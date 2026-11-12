import { themes } from '@kapitwatt/styles';
import { radius, space } from '@kapitwatt/tokens';
import { Button, Text } from '@kapitwatt/ui';
import { StyleSheet, View } from 'react-native';

const c = themes.light.color;

/**
 * The household's Meralco account as a bill stub (an orange edge, the account number large and
 * masked to its last four digits), with the holder, the service address and the login email.
 * Edit opens the name and address editor in its place.
 */
export function MeralcoStub(props: {
  masked: string | null;
  holder: string | null;
  address: string | null;
  email: string | null;
  onEdit: () => void;
}) {
  return (
    <View style={styles.stub}>
      <View style={styles.head}>
        <Text variant="labelMedium" color="onSurfaceVariant" style={styles.overline}>
          MERALCO ACCOUNT
        </Text>
        <Button variant="text" label="Edit" onPress={props.onEdit} />
      </View>
      <Text variant="titleLarge" style={styles.number}>
        {props.masked ?? 'Not set'}
      </Text>
      <Text variant="bodyMedium" color="onSurfaceVariant">
        {[props.holder, props.address].filter(Boolean).join(' · ') || 'Name and address not set'}
      </Text>
      {props.email ? (
        <Text variant="bodySmall" color="onSurfaceVariant">
          {`Logs in as ${props.email}`}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  stub: {
    borderRadius: radius.lg,
    backgroundColor: c.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: c.outlineVariant,
    borderLeftWidth: 4,
    borderLeftColor: c.brandAccent,
    paddingLeft: space[4],
    paddingRight: space[2],
    paddingBottom: space[4],
    gap: 2,
  },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  overline: { letterSpacing: 0.5 },
  number: { letterSpacing: 2, fontVariant: ['tabular-nums'] },
});
