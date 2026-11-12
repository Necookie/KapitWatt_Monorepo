import { themes } from '@kapitwatt/styles';
import { withAlpha } from '@kapitwatt/tokens';
import { Text } from '@kapitwatt/ui';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { fonts, radius } from '@/theme';

const t = themes.light;
const c = t.color;

/**
 * The meter serial, typed onto a plate drawn like a meter's faceplate: Grid Indigo, a small
 * "Serial no." mark and wide-set characters, so it reads like what the household is copying from.
 */
export function SerialPlate(props: {
  label: string;
  hint?: string;
  value: string;
  onChange: (serial: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.field}>
      <Text variant="labelLarge" color="onSurfaceVariant">
        {props.label}
      </Text>
      <View style={[styles.plate, focused && styles.plateFocused]}>
        <View style={styles.marks}>
          <Text variant="labelSmall" style={styles.mark}>
            SERIAL NO.
          </Text>
          <Text variant="labelSmall" style={styles.mark}>
            kWh
          </Text>
        </View>
        <TextInput
          value={props.value}
          onChangeText={props.onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoCapitalize="characters"
          autoCorrect={false}
          placeholder="————————"
          placeholderTextColor={withAlpha(c.onBrand, 0.3)}
          accessibilityLabel={props.label}
          accessibilityHint={props.hint}
          style={styles.input}
        />
      </View>
      {props.hint ? (
        <Text variant="bodyMedium" color="onSurfaceVariant">
          {props.hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 4, alignSelf: 'stretch' },
  plate: {
    borderRadius: radius.md,
    backgroundColor: c.brand,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
    borderWidth: t.borderWidth.strong,
    borderColor: c.brand,
  },
  plateFocused: { borderColor: c.primaryContainer },
  marks: { flexDirection: 'row', justifyContent: 'space-between' },
  mark: { color: withAlpha(c.onBrand, 0.6), letterSpacing: 1 },
  input: {
    fontFamily: fonts.semibold,
    fontSize: 24,
    letterSpacing: 4,
    color: c.onBrand,
    paddingVertical: 4,
    outlineStyle: 'none',
  } as object,
});
