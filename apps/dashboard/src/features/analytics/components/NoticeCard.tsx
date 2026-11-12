import { Icon } from '@kapitwatt/icons';
import { Card, Stack, Text } from '@kapitwatt/ui';

export function NoticeCard({
  icon,
  error,
  children,
}: {
  icon: 'info' | 'flagged';
  error?: boolean;
  children: string;
}) {
  return (
    <Card variant="filled" padding={4}>
      <Stack direction="row" align="center" gap={3}>
        <Icon name={icon} size="sm" color={error ? 'error' : 'onSurfaceVariant'} />
        <Text variant="bodyMedium" color={error ? 'error' : 'onSurface'} style={{ flexShrink: 1 }}>
          {children}
        </Text>
      </Stack>
    </Card>
  );
}
