import { themes } from '@kapitwatt/styles';
import { Text } from '@kapitwatt/ui';
import { StatusBar } from 'expo-status-bar';
import { Animated, StyleSheet, View } from 'react-native';
import { Button, Screen, TextField } from '@/components/ui';
import { Fireflies } from '@/components/night/Fireflies';
import { NightSky } from '@/components/night/NightSky';
import { greeting } from '@/utils/greeting';
import { fonts, space } from '@/styles/theme';
import { LoginNight } from '../components/LoginNight';
import { useLoginForm } from '../hooks/useLoginForm';

const c = themes.light.color;

/**
 * Email and password login for a household that already joined. Welcome's night carries on above
 * the form (the sheet rose there from welcome): Alitaptap sleeps on the moon until you start
 * typing, wakes with a stretch, shuts its eyes for the password, winces at a wrong one and lights
 * up when you are in. Its line under the heading follows along. While the keyboard is open the
 * sheet slides up over the moon, so the form keeps its room and Alitaptap's head peeks over it.
 */
export default function LoginPage() {
  const form = useLoginForm();

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <NightSky />
      <Fireflies />
      <LoginNight
        insetTop={form.insetTop}
        pose={form.pose}
        eyesShut={form.eyesShut}
        cheer={form.cheer}
        wince={form.wince}
        onPoke={form.poke}
        onBack={form.back}
      />

      <Animated.View style={[styles.sheet, { top: form.sheetTop }]}>
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
              {form.line}
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
              onSubmitEditing={form.focusPassword}
              error={form.emailError}
              value={form.email}
              onChangeText={form.changeEmail}
            />
            <TextField
              ref={form.passwordInput}
              label="Password"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={form.submit}
              onFocus={form.onPasswordFocus}
              onBlur={form.onPasswordBlur}
              error={form.passwordError}
              value={form.password}
              onChangeText={form.changePassword}
            />
            <View style={styles.actions}>
              <Button
                label="Log in"
                disabled={!form.filled}
                loading={form.loading}
                onPress={form.submit}
              />
              <Button
                label="Forgot password?"
                variant="text"
                align="center"
                onPress={form.forgotPassword}
              />
            </View>
          </View>

          <View style={styles.bottom}>
            <Text variant="bodyMedium" color="onSurfaceVariant">
              New to KapitWatt?
            </Text>
            <Button label="Create account" variant="text" onPress={form.createAccount} />
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
