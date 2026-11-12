import { CreateAlertInput } from '@kapitwatt/shared';
import { client } from '@/api/client';
import { useAction } from '@/api/queries';

/** Sends the alert. `input` is the form's current values, parsed when the mutation runs. */
export function useCreateAlert(input: unknown) {
  return useAction(() => client.createAlert(CreateAlertInput.parse(input)));
}
