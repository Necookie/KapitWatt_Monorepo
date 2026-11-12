import { Icon, type IconName } from '@kapitwatt/icons';
import { Card, ProgressBar, Skeleton, SkeletonText, Stack, Text } from '@kapitwatt/ui';

/** A headline figure: label, value in the data type style, unit, context, and optional target progress. */
export function KpiCard({
  label,
  icon,
  value,
  unit,
  caption,
  progress,
  loading = false,
}: {
  label: string;
  icon: IconName;
  value?: string;
  unit?: string;
  caption?: string;
  progress?: { share: number; tone: 'primary' | 'relief' | 'tertiary'; label: string };
  loading?: boolean;
}) {
  if (loading) {
    return (
      <Card variant="outlined" padding={4} style={{ flexGrow: 1, flexBasis: 160, minWidth: 150 }}>
        <Stack gap={2} accessibilityLabel={`${label}: loading`}>
          <Stack direction="row" align="center" gap={2}>
            <Icon name={icon} size="sm" color="onSurfaceVariant" />
            <Text variant="labelMedium" color="onSurfaceVariant">
              {label}
            </Text>
          </Stack>
          <Skeleton width={104} height={34} radius="sm" style={{ marginVertical: 2 }} />
          <SkeletonText lines={2} lineHeight={9} gap={6} />
        </Stack>
      </Card>
    );
  }
  return (
    <Card variant="outlined" padding={4} style={{ flexGrow: 1, flexBasis: 160, minWidth: 150 }}>
      <Stack gap={2}>
        <Stack direction="row" align="center" gap={2}>
          <Icon name={icon} size="sm" color="onSurfaceVariant" />
          <Text variant="labelMedium" color="onSurfaceVariant">
            {label}
          </Text>
        </Stack>
        <Stack direction="row" align="flex-end" gap={1}>
          <Text variant="dataMedium">{value}</Text>
          {unit ? (
            <Text variant="titleSmall" color="onSurfaceVariant" style={{ marginBottom: 6 }}>
              {unit}
            </Text>
          ) : null}
        </Stack>
        {progress ? (
          // The track runs to 125% so a value past target visibly crosses the target tick.
          <ProgressBar
            value={Math.min(progress.share / 1.25, 1)}
            target={1 / 1.25}
            tone={progress.tone}
            size="thin"
            accessibilityLabel={progress.label}
          />
        ) : null}
        {caption ? (
          <Text variant="bodySmall" color="onSurfaceVariant">
            {caption}
          </Text>
        ) : null}
      </Stack>
    </Card>
  );
}
