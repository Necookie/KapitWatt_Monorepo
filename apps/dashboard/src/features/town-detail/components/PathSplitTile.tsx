import { useTheme } from '@kapitwatt/hooks';
import { Icon } from '@kapitwatt/icons';
import { Text } from '@kapitwatt/ui';
import { View } from 'react-native';
import { kw } from '@/utils/format';
import { motion } from '@/styles/motion';

/**
 * Verified delivery split by path: smart meter (darker) and meter photo (lighter), told apart by
 * lightness and by the words under the bar. Before measuring, says when it will be known.
 */
export function PathSplitTile({
  measured,
  amiKw,
  photoKw,
}: {
  measured: boolean;
  amiKw: number;
  photoKw: number;
}) {
  const t = useTheme();
  const total = amiKw + photoKw;
  return (
    <View
      style={{
        flex: 1,
        gap: t.space[3],
        padding: t.space[5],
        borderRadius: t.radius.lg,
        backgroundColor: measured ? t.color.reliefContainer : t.color.surfaceContainer,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[2] }}>
        <Icon
          name="verified"
          size="sm"
          color={measured ? 'onReliefContainer' : 'onSurfaceVariant'}
        />
        <Text variant="labelLarge" color={measured ? 'onReliefContainer' : 'onSurfaceVariant'}>
          Delivered by path
        </Text>
      </View>
      {measured && total > 0 ? (
        <>
          <View
            accessibilityRole="progressbar"
            accessibilityLabel={`Smart meter ${kw(amiKw)} kW, meter photo ${kw(photoKw)} kW`}
            style={[
              { flexDirection: 'row', height: 12, borderRadius: t.radius.full, overflow: 'hidden' },
              motion.growX,
            ]}
          >
            <View
              style={{
                width: `${(amiKw / total) * 100}%`,
                backgroundColor: t.dataViz.deliveredAmi,
              }}
            />
            <View
              style={{
                flex: 1,
                marginLeft: amiKw > 0 ? 2 : 0,
                backgroundColor: t.dataViz.deliveredPhoto,
              }}
            />
          </View>
          <Text variant="bodySmall" color="onReliefContainer" style={{ marginTop: 'auto' }}>
            Smart meter {kw(amiKw)} kW · meter photo {kw(photoKw)} kW
          </Text>
        </>
      ) : (
        <Text variant="bodySmall" color="onSurfaceVariant" style={{ marginTop: 'auto' }}>
          {measured
            ? 'No verified cut yet.'
            : 'Measured after the window: smart meter data and meter photos.'}
        </Text>
      )}
    </View>
  );
}
