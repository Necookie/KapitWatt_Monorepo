import { LoginInput } from '@kapitwatt/shared';
import { themes } from '@kapitwatt/styles';
import { Text, type MascotPose } from '@kapitwatt/ui';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { Animated, StyleSheet, type TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LoginNight, loginSheetTop } from '@/components/login/LoginNight';
import { useKeyboardLift } from '@/components/login/useKeyboardLift';
import { Button, Screen, TextField } from '@/components/ui';
import { Fireflies } from '@/components/welcome/Fireflies';
import { greeting } from '@/components/welcome/greeting';
import { MOON_OUTER } from '@/components/welcome/Moon';
import { NightSky } from '@/components/welcome/NightSky';
import { describeError } from '@/lib/api';
import { startOver } from '@/lib/nav';
import { useLogin } from '@/lib/queries';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { fonts, space } from '@/theme';

const c = themes.light.color;

/** After logging in, a beat to see Alitaptap light up before home opens. */
const LIT_MS = 900;
/** With the keyboard open the sheet slides up over the moon, leaving Alitaptap's head peeking. */
const KEYBOARD_LIFT = MOON_OUTER * 0.42;

function loginError(e: Error): string {
  return describeError(
    e,
    {
      invalid_credentials: 'Wrong email or password.',
      // An API from before logins existed answers 404 for this route.
      not_found:
        'The server does not support logging in yet. Ask the KapitWatt team to update the API.',
    },
    'Could not log you in. Try again.',
  );
}

/**
 * Email and password login for a household that already joined. Welcome's night carries on above
 * the form (the sheet rose there from welcome): Alitaptap sleeps on the moon until you start
 * typing, wakes with a stretch, shuts its eyes for the password, winces at a wrong one and lights
 * up when you are in. Its line under the heading follows along. While the keyboard is open the
 * sheet slides up over the moon, so the form keeps its room and Alitaptap's head peeks over it.
 */
export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const login = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [typingPassword, setTypingPassword] = useState(false);
  const [poked, setPoked] = useState(false);
  const [inside, setInside] = useState(false);
  const [cheer, setCheer] = useState(0);
  const [wince, setWince] = useState(0);
  const sheetTop = useKeyboardLift(loginSheetTop(insets.top), KEYBOARD_LIFT);
  const passwordInput = useRef<ComponentRef<typeof TextInput>>(null);

  const filled = email.trim() !== '' && password !== '';
  const emailOk = LoginInput.shape.email.safeParse(email.trim()).success;
  const awake = emailOk || password !== '' || typingPassword;
  const failed = login.isError || formError !== null;
  const pose: MascotPose = inside ? 'reward' : failed ? 'missed' : awake ? 'neutral' : 'dimmed';

  // Waking up: a stretch (one hop).
  useEffect(() => {
    if (awake) setCheer((n) => n + 1);
  }, [awake]);

  /** Any edit clears the last answer, so Alitaptap perks up again. */
  const edited = () => {
    if (login.isError) login.reset();
    setFormError(null);
  };

  const submit = () => {
    if (!filled || login.isPending || inside) return;
    // The button is live as soon as both fields have text, so a mistyped email gets an answer
    // instead of a button that silently does nothing.
    const parsed = LoginInput.safeParse({ email, password });
    if (!parsed.success) {
      login.reset();
      setFormError('Enter a valid email address.');
      setWince((n) => n + 1);
      return;
    }
    setFormError(null);
    login.mutate(parsed.data, {
      onSuccess: (res) => {
        setInside(true);
        setCheer((n) => n + 1);
        const to = res.household.needsRehearsal ? '/rehearsal' : '/';
        setTimeout(() => startOver(to), reduced ? 0 : LIT_MS);
      },
      onError: () => setWince((n) => n + 1),
    });
  };

  const line = inside
    ? "You're in. Welcome home!"
    : failed
      ? "Hmm, that didn't work."
      : typingPassword
        ? "I'm not looking."
        : filled
          ? 'Ready when you are.'
          : emailOk
            ? 'Hi again! Now your password.'
            : poked
              ? 'Five more minutes… Your email will wake me.'
              : 'Alitaptap dozed off. Type your email to wake it.';

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <NightSky />
      <Fireflies />
      <LoginNight
        insetTop={insets.top}
        pose={pose}
        eyesShut={typingPassword && pose === 'neutral'}
        cheer={cheer}
        wince={wince}
        onPoke={() => pose === 'dimmed' && setPoked(true)}
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/welcome'))}
      />

      <Animated.View style={[styles.sheet, { top: sheetTop }]}>
        <Screen roomy>
          <View style={styles.heading}>
            <Text variant="labelLarge" align="center" style={styles.kicker}>
              {greeting()}
            </Text>
            <Text variant="headlineMedium" align="center" accessibilityRole="header">
              Welcome back
            </Text>
            <Text
              color="onSurfaceVariant"
              align="center"
              accessibilityLiveRegion="polite"
              style={styles.line}
            >
              {line}
            </Text>
          </View>

          <View style={styles.form}>
            <TextField
              label="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => passwordInput.current?.focus()}
              error={formError ?? undefined}
              value={email}
              onChangeText={(text) => {
                edited();
                setEmail(text);
              }}
            />
            <TextField
              ref={passwordInput}
              label="Password"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={submit}
              onFocus={() => setTypingPassword(true)}
              onBlur={() => setTypingPassword(false)}
              error={login.isError ? loginError(login.error) : undefined}
              value={password}
              onChangeText={(text) => {
                edited();
                setPassword(text);
              }}
            />
            <View style={styles.actions}>
              <Button
                label="Log in"
                disabled={!filled}
                loading={login.isPending || inside}
                onPress={submit}
              />
              <Button
                label="Forgot password?"
                variant="text"
                align="center"
                onPress={() => router.push('/forgot-password')}
              />
            </View>
          </View>

          <View style={styles.bottom}>
            <Text variant="bodyMedium" color="onSurfaceVariant">
              New to KapitWatt?
            </Text>
            <Button
              label="Create account"
              variant="text"
              onPress={() => router.replace('/sign-up')}
            />
          </View>
        </Screen>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.brand },
  // The white sheet that rose from welcome, from just under the moon to the bottom.
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: c.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  // One column under the moon, on an 8 px rhythm: 24 from the sheet's top edge to the greeting,
  // 24 between the heading, the form and the links (the Screen's gap), 16 between fields and 24
  // above Log in. Text buttons carry their own 48 px touch height, which reads as their spacing.
  heading: { alignItems: 'center', gap: space.xs, marginTop: space.lg },
  kicker: { color: c.tertiary, fontFamily: fonts.semibold },
  line: { maxWidth: 300, marginTop: space.xs },
  form: { gap: space.lg },
  actions: { marginTop: space.sm },
  bottom: {
    marginTop: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
