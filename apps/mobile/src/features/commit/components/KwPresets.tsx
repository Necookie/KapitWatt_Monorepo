import { Icon } from '@kapitwatt/icons';
import { COMMIT_PRESETS_KW } from '@kapitwatt/shared';
import { themes } from '@kapitwatt/styles';
import { Text } from '@kapitwatt/ui';
import { Pressable, StyleSheet, View } from 'react-native';
import { formatKw } from '@/utils/format';

const c = themes.light.color;

/** Quick picks: the preset cuts as one segmented row; presets above the cap are disabled. */
export function KwPresets(props: { selected: number; cap: number; onSet: (kw: number) => void }) {
  const { selected, cap } = props;
  return (
    <View style={styles.segments} accessibilityRole="radiogroup" accessibilityLabel="Quick picks">
      {COMMIT_PRESETS_KW.map((p, i) => {
        const disabled = p > cap;
        const active = p === selected;
        return (
          <Pressable
            key={p}
            accessibilityRole="radio"
            accessibilityState={{ disabled, checked: active }}
            accessibilityLabel={formatKw(p)}
            disabled={disabled}
            onPress={() => props.onSet(p)}
            style={[
              styles.segment,
              i < COMMIT_PRESETS_KW.length - 1 && styles.segmentDivider,
              active && styles.segmentOn,
            ]}
          >
            {active ? (
              <Icon name="check" size="sm" weight="bold" color="onSecondaryContainer" />
            ) : null}
            <Text
              variant="titleSmall"
              style={{
                color: disabled ? c.outline : active ? c.onSecondaryContainer : c.onSurface,
              }}
            >
              {String(p)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  segments: {
    flexDirection: 'row',
    height: 48,
    borderWidth: 1,
    borderColor: c.outline,
    borderRadius: 24,
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  segmentDivider: { borderRightWidth: 1, borderRightColor: c.outline },
  segmentOn: { backgroundColor: c.secondaryContainer },
});
