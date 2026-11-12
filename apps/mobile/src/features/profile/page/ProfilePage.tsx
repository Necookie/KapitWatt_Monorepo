import { themes } from '@kapitwatt/styles';
import { Redirect } from 'expo-router';
import { RefreshControl, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ErrorState, Loading } from '@/components/ui';
import { ApiError } from '@/api/http';
import { radius, space } from '@/styles/theme';
import { AccountEditor } from '../components/AccountEditor';
import { DeleteAccountPanel } from '../components/DeleteAccountPanel';
import { ListRow } from '../components/ListRow';
import { ProfileHeader } from '../components/ProfileHeader';
import { Section } from '../components/Section';
import { useProfile } from '../hooks/useProfile';
import { dateLabel } from '../utils/date-label';

const c = themes.light.color;

/**
 * The household's own data and its privacy controls (Data Privacy Act 2012; mockup "Profile A"):
 * see it, correct it, turn alerts off, log out, and withdraw consent by deleting the account.
 */
export default function ProfilePage() {
  const insets = useSafeAreaInsets();
  const p = useProfile();
  const { me, update, logout, remove } = p;

  if (me.error instanceof ApiError && me.error.status === 401) return <Redirect href="/welcome" />;
  if (me.isPending) return <Loading />;
  if (me.isError) return <ErrorState onRetry={() => void me.refetch()} />;
  const h = me.data;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingBottom: space.xl + insets.bottom }}
      refreshControl={
        <RefreshControl
          refreshing={p.pulling}
          onRefresh={p.refresh}
          tintColor={c.onPrimary}
          colors={[c.primary]}
        />
      }
    >
      <ProfileHeader household={h} savedKwh={p.savedKwh} topInset={insets.top} />

      <View style={styles.body}>
        <Section title="Account">
          <ListRow icon="profile" label="Email" detail={h.email ?? 'Not set'} />
          <ListRow
            icon="locked"
            label="Meralco account"
            detail={h.accountNumberMasked ?? 'Not set'}
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
              detail={h.serviceAddress ?? 'Not set'}
              onPress={p.startEdit}
            />
          )}
          <ListRow
            icon={h.meterType === 'ami' ? 'smartMeter' : 'meter'}
            label={h.meterType === 'ami' ? 'Smart meter' : 'Regular meter'}
            detail={`${h.meterSerial} · ${h.billAvgKwhMonth} kWh a month`}
            last
          />
        </Section>

        <Section title="Settings">
          <ListRow
            icon="notifications"
            label="Grid alerts"
            detail={
              h.optedIn ? 'On: you get alerts and can join events' : 'Off: no alerts, no events'
            }
            trailing={
              <Switch
                value={h.optedIn}
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
              h.consentAt ? `Consent given ${dateLabel(h.consentAt)}` : 'Consent not recorded'
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
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.surface },
  body: { padding: space.xl, gap: space.xl },
  card: {
    borderRadius: radius.lg,
    backgroundColor: c.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: c.outlineVariant,
    overflow: 'hidden',
  },
});
