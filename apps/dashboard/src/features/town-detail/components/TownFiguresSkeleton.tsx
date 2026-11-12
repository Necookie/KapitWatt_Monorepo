import { View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Stat } from '@/components/ui/Stat';

export function TownFiguresSkeleton() {
  return (
    <Card padded={false}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {['Town target', 'Committed', 'Delivered, verified', 'Barangays on target'].map((label) => (
          <Stat key={label} loading label={label} value="" />
        ))}
      </View>
    </Card>
  );
}
