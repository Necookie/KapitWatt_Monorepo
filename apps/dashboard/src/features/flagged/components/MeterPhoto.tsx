import type { FlaggedReading } from '@kapitwatt/shared';
import { useTheme } from '@kapitwatt/hooks';
import { Icon } from '@kapitwatt/icons';
import { Text } from '@kapitwatt/ui';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Notice } from '@/components/ui/Notice';
import { client, errorMessage } from '@/api/client';

/**
 * The meter photo, fetched for this reading only. A meter photo is personal data: the object URL is
 * revoked as soon as another reading is shown or the page closes.
 */
export function MeterPhoto({ reading: r }: { reading: FlaggedReading }) {
  const t = useTheme();
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);
  useEffect(() => {
    if (!r.hasPhoto) return;
    let made: string | null = null;
    let closed = false;
    setUrl(null);
    setError(null);
    client.readingPhoto(r.id).then(
      (blobUrl) => {
        made = blobUrl;
        if (closed) URL.revokeObjectURL(blobUrl);
        else setUrl(blobUrl);
      },
      (reason: unknown) => {
        if (!closed) setError(reason);
      },
    );
    return () => {
      closed = true;
      if (made) URL.revokeObjectURL(made);
    };
  }, [r.id, r.hasPhoto]);

  return (
    <View
      style={{
        minHeight: 260,
        alignItems: 'center',
        justifyContent: 'center',
        padding: t.space[3],
        borderRadius: t.radius.md,
        backgroundColor: t.color.surfaceContainer,
      }}
    >
      {!r.hasPhoto ? (
        <View style={{ alignItems: 'center', gap: t.space[2] }}>
          <Icon name="meterPhoto" size="lg" color="onSurfaceVariant" />
          <Text variant="bodyMedium" color="onSurfaceVariant">
            No photo for this reading.
          </Text>
        </View>
      ) : url ? (
        <img
          src={url}
          alt={`Meter photo for serial ${r.meterSerial}`}
          style={{ maxWidth: '100%', maxHeight: 420, objectFit: 'contain', borderRadius: 8 }}
        />
      ) : error ? (
        <Notice tone="critical">{errorMessage(error)}</Notice>
      ) : (
        <ActivityIndicator color={t.color.primary} />
      )}
    </View>
  );
}
