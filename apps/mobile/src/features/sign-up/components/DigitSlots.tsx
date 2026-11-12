import { themes } from '@kapitwatt/styles';
import { Text } from '@kapitwatt/ui';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useReveal, type RevealTarget } from '@/components/ui';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { radius } from '@/styles/theme';

const t = themes.light;
const c = t.color;
const NATIVE = Platform.OS !== 'web';

/**
 * A fixed-length number typed into a row of slots, one digit each (the Meralco account number).
 * One hidden input takes the keyboard; the slots show it. The next empty slot is outlined while
 * typing, and once the number is complete and valid (`ok`) the slots fill and settle with a nudge.
 */
export function DigitSlots(props: {
  label: string;
  hint?: string;
  error?: string;
  length: number;
  value: string;
  ok: boolean;
  onChange: (digits: string) => void;
}) {
  const input = useRef<ComponentRef<typeof TextInput>>(null);
  const [focused, setFocused] = useState(false);
  const box = useRef<RevealTarget>(null);
  const reveal = useReveal();
  const reduced = useReducedMotion();
  const snap = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!props.ok || reduced) return;
    snap.setValue(0);
    Animated.timing(snap, {
      toValue: 1,
      duration: 360,
      easing: Easing.out(Easing.quad),
      useNativeDriver: NATIVE,
    }).start();
  }, [props.ok]);

  const next = Math.min(props.value.length, props.length - 1);
  return (
    <View ref={box} style={styles.field}>
      <Text variant="labelLarge" color={props.error ? 'error' : 'onSurfaceVariant'}>
        {props.label}
      </Text>
      <Pressable accessible={false} onPress={() => input.current?.focus()}>
        <Animated.View
          style={[
            styles.row,
            {
              transform: [
                {
                  scale: snap.interpolate({
                    inputRange: [0, 0.4, 1],
                    outputRange: [1, 1.03, 1],
                  }),
                },
              ],
            },
          ]}
        >
          {Array.from({ length: props.length }, (_, i) => {
            const digit = props.value[i];
            const active = focused && i === next && !props.ok;
            return (
              <View
                key={i}
                style={[
                  styles.slot,
                  props.ok && styles.slotOk,
                  active && styles.slotActive,
                  !!props.error && styles.slotError,
                ]}
              >
                <Text
                  variant="titleLarge"
                  style={{ color: props.ok ? c.onPrimaryContainer : c.onSurface }}
                >
                  {digit ?? ''}
                </Text>
              </View>
            );
          })}
          <TextInput
            ref={input}
            value={props.value}
            onChangeText={(text) => props.onChange(text.replace(/\D/g, '').slice(0, props.length))}
            onFocus={() => {
              setFocused(true);
              reveal(box.current);
            }}
            onBlur={() => setFocused(false)}
            keyboardType="number-pad"
            maxLength={props.length}
            caretHidden
            accessibilityLabel={props.label}
            accessibilityHint={props.hint}
            style={styles.hidden}
          />
        </Animated.View>
      </Pressable>
      {props.error || props.hint ? (
        <Text variant="bodyMedium" color={props.error ? 'error' : 'onSurfaceVariant'}>
          {props.error ?? props.hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 4, alignSelf: 'stretch' },
  row: { flexDirection: 'row', gap: 4 },
  slot: {
    flex: 1,
    height: 52,
    borderRadius: radius.sm,
    borderWidth: t.borderWidth.hairline,
    borderColor: c.outline,
    backgroundColor: c.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotActive: { borderWidth: t.borderWidth.strong, borderColor: c.primary },
  slotOk: { borderColor: c.primary, backgroundColor: c.primaryContainer },
  slotError: { borderColor: c.error },
  // The input that takes the keyboard: over the slots, invisible.
  hidden: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    opacity: 0,
    color: 'transparent',
  },
});
