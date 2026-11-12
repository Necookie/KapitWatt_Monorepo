import { themes } from '@kapitwatt/styles';
import { Redirect } from 'expo-router';
import { StyleSheet, Switch, View } from 'react-native';
import { ErrorState, Loading } from '@/components/ui';
import { ApiError } from '@/api/http';
import { TabScreen } from '@/layout/components/TabScreen';
import { radius } from '@/styles/theme';
import { AccountEditor } from '../components/AccountEditor';
import { DeleteAccountPanel } from '../components/DeleteAccountPanel';
import { ListRow } from '../components/ListRow';
import { Avatar } from '../components/Avatar';
import { ProfileStats } from '../components/ProfileStats';
import { Section } from '../components/Section';
import { useProfile } from '../hooks/useProfile';
import { dateLabel } from '../utils/date-label';

const c = themes.light.color;

/**
 * Profile, the last tab: the household in the night band (initials, name, barangay), then on the
 * sheet its figures, the account and settings, and logging out or deleting the account.
 */
export default function ProfilePage() {
  const p = useProfile();
  const { me, update, logout, remove } = p;

  if (me.error instanceof ApiError && me.error.status === 401) return <Redirect href="/welcome" />;

  return (
    <TabScreen
      title={p.title}
      overline={p.place}
      leading={me.data ? <Avatar name={me.data.accountName} /> : undefined}
      onRefresh={p.refresh}
    >
      {me.isPending ? (
        <Loading />
      ) : me.isError ? (
        <ErrorState onRetry={() => void me.refetch()} />
      ) : (
        <>
          <ProfileStats score={me.data.trustScore} savedKwh={p.savedKwh} />
          <Section title="Account">
            <ListRow icon="profile" label="Email" detail={me.data.email ?? 'Not set'} />
            <ListRow
              icon="locked"
              label="Meralco account"
              detail={me.data.accountNumberMasked ?? 'Not set'}
            />
            {p.editing ? (
              <AccountEditor
                name={p.name}
                address={p.address}
                onChangeName={p.setName}
                onChangeAddress={p.setAddress}
                error={p.saveError}
                canSave={p.canSave}
                saving={update.isPending}
                onSave={p.save}
                onCancel={p.cancelEdit}
              />
            ) : (
              <ListRow
                icon="home"
                label="Name and service address"
                detail={me.data.serviceAddress ?? 'Not set'}
                onPress={p.startEdit}
              />
            )}
            <ListRow
              icon={me.data.meterType === 'ami' ? 'smartMeter' : 'meter'}
              label={me.data.meterType === 'ami' ? 'Smart meter' : 'Regular meter'}
              detail={`${me.data.meterSerial} · ${me.data.billAvgKwhMonth} kWh a month`}
              last
            />
          </Section>

          <Section title="Settings">
            <ListRow
              icon="notifications"
              label="Grid alerts"
              detail={
                me.data.optedIn
                  ? 'On: you get alerts and can join events'
                  : 'Off: no alerts, no events'
              }
              trailing={
                <Switch
                  value={me.data.optedIn}
                  disabled={update.isPending && !p.editing}
                  onValueChange={p.setAlerts}
                  trackColor={{ true: c.primary, false: c.surfaceContainerHighest }}
                  thumbColor={c.onPrimary}
                  accessibilityLabel="Grid alerts"
                />
              }
            />
            <ListRow
              icon="info"
              label="Privacy notice"
              detail={
                me.data.consentAt
                  ? `Consent given ${dateLabel(me.data.consentAt)}`
                  : 'Consent not recorded'
              }
              onPress={p.openPrivacy}
              last
            />
          </Section>

          <View style={styles.card}>
            <ListRow
              icon="signOut"
              label={logout.isPending ? 'Logging out…' : 'Log out'}
              tone="primary"
              onPress={p.logOut}
              last={!p.deleting}
            />
            {p.deleting ? (
              <DeleteAccountPanel
                password={p.password}
                onChangePassword={p.setPassword}
                error={p.removeError}
                deleting={remove.isPending}
                onDelete={p.deleteAccount}
                onKeep={p.keepAccount}
              />
            ) : (
              <ListRow
                icon="close"
                label="Delete account and data"
                tone="error"
                onPress={p.startDelete}
                last
              />
            )}
          </View>
        </>
      )}
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    backgroundColor: c.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: c.outlineVariant,
    overflow: 'hidden',
  },
});
