import { LoginInput } from '@kapitwatt/shared';
import { router } from 'expo-router';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import type { TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLogin } from '@/api/queries';
import { loginSheetTop } from '@/components/night/geometry';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { startOver } from '@/utils/nav';
import { loginError } from '../utils/login-error';
import { loginLine, loginPose } from '../utils/login-mascot';
import { KEYBOARD_LIFT, LIT_MS } from '../utils/login-motion';
import { useKeyboardLift } from './useKeyboardLift';

/**
 * Login's state: the two fields, the request, where the sheet sits, and Alitaptap's pose, line and
 * reactions (a hop when it wakes or you get in, a wince at a wrong answer).
 */
export function useLoginForm() {
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
  const lift = useKeyboardLift(loginSheetTop(insets.top), KEYBOARD_LIFT);
  const passwordInput = useRef<ComponentRef<typeof TextInput>>(null);

  const filled = email.trim() !== '' && password !== '';
  const emailOk = LoginInput.shape.email.safeParse(email.trim()).success;
  const awake = emailOk || password !== '' || typingPassword;
  const failed = login.isError || formError !== null;
  const mood = { inside, failed, awake, typingPassword, filled, emailOk, poked };
  const pose = loginPose(mood);

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

  return {
    insetTop: insets.top,
    sheetTop: lift.top,
    keyboard: lift.keyboard,
    passwordInput,
    email,
    password,
    emailError: formError ?? undefined,
    passwordError: login.isError ? loginError(login.error) : undefined,
    filled,
    loading: login.isPending || inside,
    pose,
    eyesShut: typingPassword && pose === 'neutral',
    cheer,
    wince,
    line: loginLine(mood),
    changeEmail: (text: string) => {
      edited();
      setEmail(text);
    },
    changePassword: (text: string) => {
      edited();
      setPassword(text);
    },
    focusPassword: () => passwordInput.current?.focus(),
    onPasswordFocus: () => setTypingPassword(true),
    onPasswordBlur: () => setTypingPassword(false),
    poke: () => pose === 'dimmed' && setPoked(true),
    submit,
    back: () => (router.canGoBack() ? router.back() : router.replace('/welcome')),
    forgotPassword: () => router.push('/forgot-password'),
    createAccount: () => router.replace('/sign-up'),
  };
}
