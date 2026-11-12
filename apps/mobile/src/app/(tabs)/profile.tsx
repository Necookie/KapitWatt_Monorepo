import { Icon, type IconName } from '@kapitwatt/icons';
import { UpdateProfileInput } from '@kapitwatt/shared';
import { themes } from '@kapitwatt/styles';
import { Text } from '@kapitwatt/ui';
import { Redirect, router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, ErrorState, Loading, TextField } from '@/components/ui';
import { ApiError, errorCode } from '@/lib/api';
import { formatKwh } from '@/lib/format';
import { useDeleteAccount, useHistory, useLogout, useMe, useUpdateProfile } from '@/lib/queries';
import { fonts, radius, space } from '@/theme';

const c = themes.light.color;

const dateLabel = (iso: string) =>
  new Date(iso).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });

const initials = (name: string | null) =>
  (name ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('') || '?';

/**
 * The household's own data and its privacy controls (Data Privacy Act 2012; mockup "Profile A"):
 * see it, correct it, turn alerts off, log out, and withdraw consent by deleting the account.
 */
export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
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
  const [pulling, setPulling] = useState(false);

  if (me.error instanceof ApiError && me.error.status === 401) return <Redirect href="/welcome" />;
  if (me.isPending) return <Loading />;
  if (me.isError) return <ErrorState onRetry={() => void me.refetch()} />;
  const h = me.data;

  const savedKwh = (history.data ?? []).reduce((t, i) => t + (i.result?.verifiedKwh ?? 0), 0);
  const edit = UpdateProfileInput.safeParse({ accountName: name, serviceAddress: address });
  const leave = () => {
    router.dismissAll();
    router.replace('/welcome');
  };
  const startEdit = () => {
    update.reset();
    setName(h.accountName ?? '');
    setAddress(h.serviceAddress ?? '');
    setEditing(true);
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingBottom: space.xl + insets.bottom }}
      refreshControl={
        <RefreshControl
          refreshing={pulling}
          onRefresh={() => {
            setPulling(true);
            void Promise.all([me.refetch(), history.refetch()]).finally(() => setPulling(false));
          }}
          tintColor={c.onPrimary}
          colors={[c.primary]}
        />
      }
    >
      <View style={[styles.header, { paddingTop: insets.top + space.xl }]}>
        <View style={styles.who}>
          <View style={styles.avatar}>
            <Text variant="titleLarge" style={{ color: c.brand }}>
              {initials(h.accountName)}
            </Text>
          </View>
          <View style={styles.flex}>
            <Text variant="titleLarge" style={{ color: c.onPrimary }}>
              {h.accountName ?? 'Household'}
            </Text>
            <Text variant="bodyMedium" style={{ color: HEADER_MUTED }}>
              {`${h.barangayName}, ${h.municipality}`}
            </Text>
          </View>
        </View>
        <View style={styles.stats}>
          <Stat label="Points" value={String(h.points)} />
          <View style={styles.statDivider} />
          <Stat label="Saved" value={formatKwh(savedKwh)} />
          <View style={styles.statDivider} />
          <Stat label="Trust" value={String(Math.round(h.trustScore))} />
        </View>
      </View>

      <View style={styles.body}>
        <Section title="Account">
          <ListRow icon="profile" label="Email" detail={h.email ?? 'Not set'} />
          <ListRow
            icon="locked"
            label="Meralco account"
            detail={h.accountNumberMasked ?? 'Not set'}
          />
          {editing ? (
            <View style={styles.editor}>
              <TextField
                label="Account holder’s name"
                autoCapitalize="words"
                autoCorrect={false}
                value={name}
                onChangeText={setName}
              />
              <TextField
                label="Service address"
                autoCapitalize="words"
                value={address}
                onChangeText={setAddress}
              />
              {update.isError ? (
                <Text color="error">Could not save your changes. Try again.</Text>
              ) : null}
              <Button
                label="Save"
                disabled={!edit.success}
                loading={update.isPending}
                onPress={() => {
                  if (!edit.success) return;
                  update.mutate(edit.data, { onSuccess: () => setEditing(false) });
                }}
              />
              <Button label="Cancel" variant="secondary" onPress={() => setEditing(false)} />
            </View>
          ) : (
            <ListRow
              icon="home"
              label="Name and service address"
              detail={h.serviceAddress ?? 'Not set'}
              onPress={startEdit}
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
                disabled={update.isPending && !editing}
                onValueChange={(on) => update.mutate({ optedIn: on })}
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
            onPress={() => router.push('/privacy')}
            last
          />
        </Section>

        <View style={styles.card}>
          <ListRow
            icon="signOut"
            label={logout.isPending ? 'Logging out…' : 'Log out'}
            tone="primary"
            onPress={() => logout.mutate(undefined, { onSettled: leave })}
            last={!deleting}
          />
          {deleting ? (
            <View style={styles.editor}>
              <Text variant="titleSmall" color="error">
                Withdraw consent and delete my account
              </Text>
              <Text variant="bodyMedium" color="onSurfaceVariant">
                This erases your profile, your Meralco account details, your meter photos and
                readings, and your points and credits. Barangay totals from past events stay, with
                nothing that identifies you. This cannot be undone.
              </Text>
              <TextField
                label="Enter your password to confirm"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                value={password}
                onChangeText={setPassword}
              />
              {remove.isError ? (
                <Text color="error">
                  {errorCode(remove.error) === 'invalid_credentials'
                    ? 'Wrong password.'
                    : 'Could not delete your account. Try again.'}
                </Text>
              ) : null}
              <Button
                label="Delete my account"
                disabled={password.length === 0}
                loading={remove.isPending}
                onPress={() => remove.mutate(password, { onSuccess: leave })}
              />
              <Button
                label="Keep my account"
                variant="secondary"
                onPress={() => {
                  setDeleting(false);
                  setPassword('');
                  remove.reset();
                }}
              />
            </View>
          ) : (
            <ListRow
              icon="close"
              label="Delete account and data"
              tone="error"
              onPress={() => setDeleting(true)}
              last
            />
          )}
        </View>
      </View>
    </ScrollView>
  );
}

/** Secondary text on the indigo header (light theme's inverse primary). */
const HEADER_MUTED = c.inversePrimary;

function Stat(props: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text variant="titleMedium" style={[styles.tabular, { color: c.onPrimary }]}>
        {props.value}
      </Text>
      <Text variant="bodySmall" style={{ color: HEADER_MUTED }}>
        {props.label}
      </Text>
    </View>
  );
}

function Section(props: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="labelMedium" color="onSurfaceVariant" style={styles.sectionTitle}>
        {props.title.toUpperCase()}
      </Text>
      <View style={styles.card}>{props.children}</View>
    </View>
  );
}

function ListRow(props: {
  icon: IconName;
  label: string;
  detail?: string;
  onPress?: () => void;
  trailing?: ReactNode;
  tone?: 'primary' | 'error';
  last?: boolean;
}) {
  const color = props.tone ?? 'onSurface';
  const content = (
    <>
      <Icon name={props.icon} color={props.tone ?? 'onSurfaceVariant'} />
      <View style={styles.flex}>
        <Text variant="titleSmall" color={color}>
          {props.label}
        </Text>
        {props.detail ? (
          <Text variant="bodySmall" color="onSurfaceVariant">
            {props.detail}
          </Text>
        ) : null}
      </View>
      {props.trailing ??
        (props.onPress && !props.tone ? (
          <Icon name="chevronRight" size="sm" color="onSurfaceVariant" />
        ) : null)}
    </>
  );
  const style = [styles.row, !props.last && styles.divider];
  if (!props.onPress) return <View style={style}>{content}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={props.onPress}
      style={({ pressed }) => [...style, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.surface },
  flex: { flex: 1 },
  tabular: { fontVariant: ['tabular-nums'] },
  header: {
    backgroundColor: c.brand,
    paddingHorizontal: space.xl,
    paddingBottom: space.xl,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    gap: space.xl,
  },
  who: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: c.onPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingVertical: space.md,
  },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statDivider: { width: 1, alignSelf: 'stretch', backgroundColor: 'rgba(255,255,255,0.2)' },
  body: { padding: space.xl, gap: space.xl },
  section: { gap: space.sm },
  sectionTitle: { fontFamily: fonts.semibold, letterSpacing: 0.8, paddingHorizontal: space.xs },
  card: {
    borderRadius: radius.lg,
    backgroundColor: c.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: c.outlineVariant,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: 56,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  divider: { borderBottomWidth: 1, borderBottomColor: c.outlineVariant },
  pressed: { backgroundColor: c.surfaceContainerLow },
  editor: {
    gap: space.md,
    padding: space.lg,
    borderBottomWidth: 1,
    borderBottomColor: c.outlineVariant,
  },
});
