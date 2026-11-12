import type { Barangay } from '@kapitwatt/shared';
import { themes } from '@kapitwatt/styles';
import { StyleSheet, View } from 'react-native';
import { radius, space } from '@/styles/theme';
import type { StepId, StepProps } from '../utils/draft';
import { METER_LABEL } from '../utils/meter-label';
import { ReviewRow } from './ReviewRow';

const c = themes.light.color;

/** Everything entered, with a way back to each step. The account number is masked. */
export function ReviewStep(
  props: StepProps & { barangays: Barangay[]; onEdit: (step: StepId) => void },
) {
  const { draft, barangays, onEdit } = props;
  const barangay = barangays.find((b) => b.id === draft.barangayId);
  const masked = '••••' + draft.accountNumber.slice(-4);
  return (
    <View style={[styles.panel, styles.reviewPanel]}>
      <ReviewRow
        label="Login"
        lines={[draft.email.trim().toLowerCase()]}
        onEdit={() => onEdit('account')}
      />
      <ReviewRow
        label="Meralco account"
        lines={[`${draft.accountName.trim()} · ${masked}`, draft.serviceAddress.trim()]}
        onEdit={() => onEdit('meralco')}
      />
      <ReviewRow
        label="Where you live"
        lines={[barangay ? `${barangay.name}, ${barangay.municipality}` : 'Barangay missing']}
        good={draft.location ? 'Home location saved' : undefined}
        onEdit={() => onEdit('home')}
      />
      <ReviewRow
        label="Meter"
        lines={[
          `${draft.meterType ? METER_LABEL[draft.meterType] : ''} · ${draft.meterSerial.trim()}`,
          `${draft.billText} kWh a month`,
        ]}
        onEdit={() => onEdit('meter')}
      />
      <ReviewRow
        label="Consent"
        lines={[]}
        good={draft.consent && draft.alertsConsent ? 'Data and alerts: given' : undefined}
        onEdit={() => onEdit('privacy')}
        last
      />
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: c.surfaceContainerLow,
    borderRadius: radius.lg,
    padding: space.lg,
    gap: 14,
  },
  reviewPanel: { paddingVertical: space.xs, gap: 0 },
});
