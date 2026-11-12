import { useLocalSearchParams } from 'expo-router';
import { useAlert } from '@/api/queries';

/** The alert and photo kind in the route, and when that photo is due once the alert loads. */
export function useCapture() {
  const { alertId, kind } = useLocalSearchParams<{ alertId: string; kind: string }>();
  const alert = useAlert(alertId);
  const due = alert.data
    ? kind === 'before'
      ? alert.data.beforePhotoDueAt
      : alert.data.afterPhotoDueAt
    : null;
  return { alertId, kind, due };
}
