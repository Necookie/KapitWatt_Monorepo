import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius, space, text } from '@/theme';

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
      <Text style={styles.label}>{props.label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${props.label}: ${selected?.label ?? 'not chosen'}`}
        accessibilityState={{ disabled: props.disabled, expanded: open }}
        disabled={props.disabled}
        onPress={() => setOpen(true)}
        style={[styles.input, props.disabled && styles.disabled]}
      >
        <Text style={[styles.value, !selected && styles.placeholder]} numberOfLines={1}>
          {selected?.label ?? props.placeholder ?? 'Choose…'}
        </Text>
        <Text style={styles.chevron}>▾</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable
          style={styles.backdrop}
          onPress={() => setOpen(false)}
          accessibilityLabel="Close"
        />
        <View style={[styles.sheet, { paddingBottom: space.lg + insets.bottom }]}>
          <Text style={styles.sheetTitle}>{props.label}</Text>
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
                  <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>
                    {item.label}
                  </Text>
                  {active ? <Text style={styles.check}>✓</Text> : null}
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
  field: { gap: space.xs },
  label: { ...text.body, fontFamily: fonts.semibold, color: colors.ink },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    minHeight: 50,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
  },
  disabled: { opacity: 0.45 },
  value: { ...text.body, color: colors.ink, flex: 1 },
  placeholder: { color: colors.muted },
  chevron: { ...text.body, color: colors.muted },
  backdrop: { flex: 1, backgroundColor: 'rgba(15, 42, 67, 0.4)' },
  sheet: {
    maxHeight: '60%',
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingTop: space.lg,
    paddingHorizontal: space.lg,
  },
  sheetTitle: { ...text.title, color: colors.ink, marginBottom: space.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space.md,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
  },
  optionActive: { backgroundColor: colors.surface },
  optionPressed: { backgroundColor: colors.surface },
  optionLabel: { ...text.body, color: colors.ink, flex: 1 },
  optionLabelActive: { fontFamily: fonts.semibold },
  check: { ...text.body, color: colors.teal, fontFamily: fonts.semibold },
});
