import { Icon } from '@kapitwatt/icons';
import { themes } from '@kapitwatt/styles';
import { radius, space } from '@kapitwatt/tokens';
import { Button, Text } from '@kapitwatt/ui';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import {
  ALERTS_CONSENT_LABEL,
  DATA_CONSENT_LABEL,
  PRIVACY_SUMMARY,
} from '@/components/privacy/PrivacyNotice';
import { Checkbox } from '@/components/ui';
import type { StepProps } from '../utils/draft';

const c = themes.light.color;

export function PrivacyStep({ draft, set }: StepProps) {
  return (
    <>
      <View style={styles.panel}>
        {PRIVACY_SUMMARY.map((row) => (
          <View key={row.icon} style={styles.summaryRow}>
            <Icon name={row.icon} color="primary" />
            <Text variant="bodyMedium" style={styles.flex}>
              {row.text}
            </Text>
          </View>
        ))}
        <Button
          variant="text"
          label="Read the full notice"

          onPress={() => router.push('/privacy')}
        />
      </View>
      <View style={styles.consents}>
        <Checkbox
          checked={draft.consent}
          onChange={(consent) => set({ consent })}
          label={DATA_CONSENT_LABEL}
        />
        <Checkbox
          checked={draft.alertsConsent}
          onChange={(alertsConsent) => set({ alertsConsent })}
          label={ALERTS_CONSENT_LABEL}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  panel: {
    backgroundColor: c.surfaceContainerLow,
    borderRadius: radius.lg,
    padding: space[4],
    gap: 14,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
  consents: { gap: space[3] },
});
