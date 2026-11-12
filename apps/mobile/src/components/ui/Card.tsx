import { Card as DsCard, Stack, Text } from '@kapitwatt/ui';
import type { ReactNode } from 'react';

/** Grouped content with an optional title, drawn by `@kapitwatt/ui` (filled, flat, 12 px corners). */
export function Card(props: { title?: string; children: ReactNode }) {
  return (
    <DsCard>
      <Stack gap={2}>
        {props.title ? <Text variant="titleLarge">{props.title}</Text> : null}
        {props.children}
      </Stack>
    </DsCard>
  );
}

/** A label and its value on one line, e.g. "Commitment   1.0 kW". */
export function Row(props: { label: string; value: string; strong?: boolean }) {
  return (
    <Stack direction="row" justify="space-between" gap={3}>
      <Text color="onSurfaceVariant" style={{ flexShrink: 1 }}>
        {props.label}
      </Text>
      <Text
        variant={props.strong ? 'titleMedium' : 'bodyLarge'}
        style={{ fontVariant: ['tabular-nums'] }}
      >
        {props.value}
      </Text>
    </Stack>
  );
}
