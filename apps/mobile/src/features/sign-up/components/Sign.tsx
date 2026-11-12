import { themes } from '@kapitwatt/styles';
import { Text } from '@kapitwatt/ui';
import { StyleSheet, View } from 'react-native';
import { SCENE } from '@/components/night/Skyline';
import { SIGN } from '../utils/lantern-street';

const c = themes.light.color;

/** The barangay's name on a street sign hung off the pole. */
export function Sign({ name, k }: { name: string; k: number }) {
  return (
    <View
      pointerEvents="none"
      style={[styles.sign, { right: (SCENE.width - SIGN.right) * k, top: SIGN.top * k }]}
    >
      <Text variant="labelSmall" numberOfLines={1} style={{ color: c.onPrimaryContainer }}>
        {name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sign: {
    position: 'absolute',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    backgroundColor: c.primaryContainer,
  },
});
