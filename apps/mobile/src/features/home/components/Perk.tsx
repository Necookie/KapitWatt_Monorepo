import { Icon } from '@kapitwatt/icons';
import { Text } from '@kapitwatt/ui';
import { StyleSheet, View } from 'react-native';
import { space } from '@/styles/theme';
import { ink } from '../utils/ink';

export function Perk(props: { line: string }) {
  return (
    <View style={styles.perk}>
      <Icon name="check" size="sm" color={ink} />
      <Text variant="bodyMedium" style={[styles.flex, { color: ink }]}>
        {props.line}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: 4 },
  perk: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
});
