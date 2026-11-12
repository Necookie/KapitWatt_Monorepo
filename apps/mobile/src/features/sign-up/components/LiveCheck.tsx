import { Icon } from '@kapitwatt/icons';
import { Text } from '@kapitwatt/ui';
import { StyleSheet, View } from 'react-native';

/** A rule shown as it is met: grey circle while not yet, green tick once it holds. */
export function LiveCheck(props: { ok: boolean; children: string }) {
  return (
    <View style={styles.check}>
      <Icon
        name={props.ok ? 'check' : 'pending'}
        size="sm"
        weight={props.ok ? 'bold' : 'regular'}
        color={props.ok ? 'relief' : 'onSurfaceVariant'}
      />
      <Text variant="bodyMedium" color={props.ok ? 'relief' : 'onSurfaceVariant'}>
        {props.children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  check: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
