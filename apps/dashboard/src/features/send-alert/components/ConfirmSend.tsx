import type { AlertLevel } from '@kapitwatt/shared';
import { useTheme } from '@kapitwatt/hooks';
import { Icon } from '@kapitwatt/icons';
import { withAlpha } from '@kapitwatt/tokens';
import { Button, Text } from '@kapitwatt/ui';
import { Modal, View } from 'react-native';
import { Notice } from '@/components/ui/Notice';
import { SendButton } from './SendButton';
import { motion } from '@/styles/motion';

/** M3 dialog: says who is notified, then asks once more. */
export function ConfirmSend({
  visible,
  level,
  headline,
  body,
  error,
  busy,
  sent,
  onCancel,
  onSend,
}: {
  visible: boolean;
  level: AlertLevel;
  headline: string;
  body: string;
  error?: string;
  busy: boolean;
  sent: boolean;
  onCancel: () => void;
  onSend: () => void;
}) {
  const t = useTheme();
  const c = t.color;
  const red = level === 'red';
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onCancel}>
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: t.space[6],
          backgroundColor: withAlpha(c.scrim ?? '#000000', 0.4),
        }}
      >
        <View
          accessibilityRole="alert"
          style={[
            {
              width: '100%',
              maxWidth: 480,
              gap: t.space[4],
              padding: t.space[6],
              borderRadius: t.radius.xl,
              backgroundColor: c.surfaceContainerHigh,
            },
            motion.riseIn,
          ]}
        >
          <View
            style={{
              alignSelf: 'flex-start',
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: red ? c.alertRedContainer : c.alertYellowContainer,
            }}
          >
            <Icon
              name="alert"
              weight="fill"
              color={red ? 'onAlertRedContainer' : 'onAlertYellowContainer'}
            />
          </View>
          <Text variant="headlineSmall">{headline}</Text>
          <Text variant="bodyMedium" color="onSurfaceVariant">
            {body}
          </Text>
          {error ? <Notice tone="critical">{error}</Notice> : null}
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: t.space[2],
            }}
          >
            <Button label="Cancel" variant="text" disabled={busy || sent} onPress={onCancel} />
            <SendButton
              level={level}
              label={`Send ${red ? 'red' : 'yellow'} alert`}
              size="md"
              busy={busy}
              sent={sent}
              onPress={onSend}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
