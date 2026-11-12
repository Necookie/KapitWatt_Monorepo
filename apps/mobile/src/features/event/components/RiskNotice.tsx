import { Icon } from '@kapitwatt/icons';
import { themes } from '@kapitwatt/styles';
import { Text } from '@kapitwatt/ui';
import { StyleSheet, View } from 'react-native';
import type { BrownoutRisk } from '@/utils/brownout';
import { radius, space } from '@/styles/theme';

const c = themes.light.color;

export function RiskNotice(props: { risk: BrownoutRisk }) {
  const { risk } = props;
  return (
    <View style={[styles.risk, risk.kind === 'help' && styles.riskHelp]}>
      <Icon
        name="alert"
        size="sm"
        weight="fill"
        color={risk.kind === 'own' ? 'error' : 'onSurfaceVariant'}
      />
      <Text
        variant="bodyMedium"
        color={risk.kind === 'own' ? 'onErrorContainer' : 'onSurface'}
        style={styles.flex}
      >
        {risk.line}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  risk: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    padding: space.md,
    borderRadius: radius.md,
    backgroundColor: c.errorContainer,
  },
  riskHelp: { backgroundColor: c.surfaceContainerHigh },
});
