import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fontFamily, radius, space, withAlpha } from '@kapitwatt/tokens';
import { themes } from '@kapitwatt/styles';
import { Text } from '@kapitwatt/ui';

const c = themes.light.color;

/**
 * Dropdown: a field showing the current choice; tapping it opens a list of options in a sheet.
 * Built here instead of a picker library so it looks the same on Android and iOS.
 */
export function Select<T extends string>(props: {
  label: string;
  placeholder?: string;
  options: readonly { value: T; label: string }[];
  value: T | null;
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const selected = props.options.find((o) => o.value === props.value);

  return (
    <View style={styles.field}>
      <Text variant="bodyLarge" style={styles.label}>
        {props.label}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${props.label}: ${selected?.label ?? 'not chosen'}`}
        accessibilityState={{ disabled: props.disabled, expanded: open }}
        disabled={props.disabled}
        onPress={() => setOpen(true)}
        style={[styles.input, props.disabled && styles.disabled]}
      >
        <Text
          variant="bodyLarge"
          style={[styles.value, !selected && styles.placeholder]}
          numberOfLines={1}
        >
          {selected?.label ?? props.placeholder ?? 'Choose…'}
        </Text>
        <Text variant="bodyLarge" style={styles.chevron}>
          ▾
        </Text>
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable
          style={styles.backdrop}
          onPress={() => setOpen(false)}
          accessibilityLabel="Close"
        />
        <View style={[styles.sheet, { paddingBottom: space[4] + insets.bottom }]}>
          <Text variant="titleLarge" style={styles.sheetTitle}>
            {props.label}
          </Text>
          <FlatList
            data={props.options}
            keyExtractor={(o) => o.value}
            renderItem={({ item }) => {
              const active = item.value === props.value;
              return (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  onPress={() => {
                    props.onChange(item.value);
                    setOpen(false);
                  }}
                  style={({ pressed }) => [
                    styles.option,
                    active && styles.optionActive,
                    pressed && styles.optionPressed,
                  ]}
                >
                  <Text
                    variant="bodyLarge"
                    style={[styles.optionLabel, active && styles.optionLabelActive]}
                  >
                    {item.label}
                  </Text>
                  {active ? (
                    <Text variant="bodyLarge" style={styles.check}>
                      ✓
                    </Text>
                  ) : null}
                </Pressable>
              );
            }}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: space[1] },
  label: { fontFamily: fontFamily.semibold, color: c.onSurface },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    minHeight: 50,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.outlineVariant,
    borderRadius: radius.md,
    paddingHorizontal: space[3],
  },
  disabled: { opacity: 0.45 },
  value: { color: c.onSurface, flex: 1 },
  placeholder: { color: c.onSurfaceVariant },
  chevron: { color: c.onSurfaceVariant },
  backdrop: { flex: 1, backgroundColor: withAlpha(c.scrim, 0.4) },
  sheet: {
    maxHeight: '60%',
    backgroundColor: c.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingTop: space[4],
    paddingHorizontal: space[4],
  },
  sheetTitle: { color: c.onSurface, marginBottom: space[2] },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space[3],
    paddingHorizontal: space[3],
    borderRadius: radius.md,
  },
  optionActive: { backgroundColor: c.surfaceContainerHighest },
  optionPressed: { backgroundColor: c.surfaceContainerHighest },
  optionLabel: { color: c.onSurface, flex: 1 },
  optionLabelActive: { fontFamily: fontFamily.semibold },
  check: { color: c.primary, fontFamily: fontFamily.semibold },
});
