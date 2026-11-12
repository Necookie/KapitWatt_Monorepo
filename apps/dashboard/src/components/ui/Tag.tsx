import { StyleSheet, View } from 'react-native';
import { radius } from '@/styles/theme';
import { TONES, type TagTone } from './tones';
import { Txt } from './Txt';

/** A state, always spelled out: the colour never carries the meaning alone. */
export function Tag({ label, tone = 'neutral' }: { label: string; tone?: TagTone }) {
  const { bg, fg } = TONES[tone];
  return (
    <View style={[styles.tag, { backgroundColor: bg }]}>
      <Txt size="xs" weight="600" style={{ color: fg }}>
        {label}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
});
