import { UpdateProfileInput } from '@kapitwatt/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { describeError } from '@/api/http';
import { startOver } from '@/utils/nav';
import { dateLabel } from '../utils/date-label';
import { useDeleteAccount, useHistory, useLogout, useMe, useUpdateProfile } from '@/api/queries';

/**
 * The Profile screen's queries, the editor and delete-confirm state, the derived figures and
 * every action on the screen.
 */
export function useProfile() {
  const me = useMe();
  const history = useHistory();
  const update = useUpdateProfile();
  const logout = useLogout();
  const remove = useDeleteAccount();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [password, setPassword] = useState('');

  const savedKwh = (history.data ?? []).reduce((t, i) => t + (i.result?.verifiedKwh ?? 0), 0);
  // The band: the household's name over its barangay.
  const title = me.data?.accountName ?? 'Household';
  const place = me.data ? `${me.data.barangayName}, ${me.data.municipality}` : undefined;
  const consentDetail = me.data?.consentAt
    ? `Consent given ${dateLabel(me.data.consentAt)}`
    : 'Consent not recorded';
  const edit = UpdateProfileInput.safeParse({ accountName: name, serviceAddress: address });
  const saveError = update.isError
    ? describeError(update.error, {}, 'Could not save your changes. Try again.')
    : null;
  const removeError = remove.isError
    ? describeError(
        remove.error,
        { invalid_credentials: 'Wrong password.' },
        'Could not delete your account. Try again.',
      )
    : null;

  const leave = () => startOver('/welcome');
  // Pull to refresh (the shared Screen shows the spinner until both are back).
  const refresh = () => Promise.all([me.refetch(), history.refetch()]);
  const startEdit = () => {
    update.reset();
    setName(me.data?.accountName ?? '');
    setAddress(me.data?.serviceAddress ?? '');
    setEditing(true);
  };
  const save = () => {
    if (!edit.success) return;
    update.mutate(edit.data, { onSuccess: () => setEditing(false) });
  };
  const cancelEdit = () => setEditing(false);
  const setAlerts = (on: boolean) => update.mutate({ optedIn: on });
  const openPrivacy = () => router.push('/privacy');
  const logOut = () => logout.mutate(undefined, { onSettled: leave });
  const startDelete = () => setDeleting(true);
  const deleteAccount = () => remove.mutate(password, { onSuccess: leave });
  const keepAccount = () => {
    setDeleting(false);
    setPassword('');
    remove.reset();
  };

  return {
    me,
    update,
    logout,
    remove,
    editing,
    name,
    setName,
    address,
    setAddress,
    deleting,
    password,
    setPassword,
    title,
    place,
    consentDetail,
    savedKwh,
    canSave: edit.success,
    saveError,
    removeError,
    refresh,
    startEdit,
    save,
    cancelEdit,
    setAlerts,
    openPrivacy,
    logOut,
    startDelete,
    deleteAccount,
    keepAccount,
  };
}
