import { themes } from '@kapitwatt/styles';
import { Button } from '@kapitwatt/ui';
import { Redirect } from 'expo-router';
import { StyleSheet, Switch, View } from 'react-native';
import { radius } from '@kapitwatt/tokens';
import { ErrorState, Loading } from '@/components/ui';
import { ApiError } from '@/api/http';
import { TabScreen } from '@/layout/components/TabScreen';
import { AccountEditor } from '../components/AccountEditor';
import { DeleteAccountPanel } from '../components/DeleteAccountPanel';
import { ListRow } from '../components/ListRow';
import { Avatar } from '../components/Avatar';
import { MeralcoStub } from '../components/MeralcoStub';
import { MeterPlate } from '../components/MeterPlate';
import { ProfileStats } from '../components/ProfileStats';
import { Section } from '../components/Section';
import { useProfile } from '../hooks/useProfile';

const c = themes.light.color;

/**
 * Profile, the last tab: the household in the night band (initials, name, barangay), then on the
 * sheet its figures, its Meralco account as a bill stub (Edit corrects the name and address) and
 * its meter on the faceplate from sign-up, the alerts switch, and its data and privacy (Data
 * Privacy Act): the consent given, the notice, and withdrawing consent by deleting the account.
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
          <Section title="Your household" plain>
            {p.editing ? (
              <View style={styles.card}>
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
              </View>
            ) : (
              <MeralcoStub
                masked={me.data.accountNumberMasked}
                holder={me.data.accountName}
                address={me.data.serviceAddress}
                email={me.data.email}
                onEdit={p.startEdit}
              />
            )}
            <MeterPlate
              type={me.data.meterType}
              serial={me.data.meterSerial}
              billKwhMonth={me.data.billAvgKwhMonth}
            />
          </Section>

          <Section title="Your data and privacy">
            <ListRow
              icon={me.data.consentAt ? 'check' : 'close'}
              label="Data use"
              detail={p.consentDetail}
            />
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
            <ListRow icon="info" label="Read the privacy notice" onPress={p.openPrivacy} />
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
                detail="Withdraws your consent"
                tone="error"
                onPress={p.startDelete}
                last
              />
            )}
          </Section>

          <Button
            variant="outlined"
            size="lg"
            fullWidth
            label={logout.isPending ? 'Logging out…' : 'Log out'}
            onPress={p.logOut}
          />
        </>
      )}
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, backgroundColor: c.surfaceContainerLow, overflow: 'hidden' },
});
