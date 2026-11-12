import { View } from 'react-native';
import { motion } from '@/styles/motion';

/** A small live indicator: a dot with a ring that keeps growing out of it. */
export function LiveDot({ color }: { color: string }) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: 8, height: 8, marginLeft: 2 }}
    >
      <View
        style={[
          { position: 'absolute', inset: 0, borderRadius: 4, backgroundColor: color },
          motion.ping,
        ]}
      />
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
    </View>
  );
}
