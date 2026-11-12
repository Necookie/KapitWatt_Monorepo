import { useTheme } from '@kapitwatt/hooks';
import { View } from 'react-native';
import { FigureTile, type Tile } from '@/components/FigureTile';

/** A bento column: the lead figure on top, two smaller ones side by side beneath it. */
export function TileStack({ lead, pair }: { lead: Tile; pair: [Tile, Tile] }) {
  const t = useTheme();
  return (
    <View style={{ flex: 1, gap: t.space[3] }}>
      <FigureTile {...lead} size="lg" />
      <View style={{ flex: 1, flexDirection: 'row', gap: t.space[3] }}>
        <FigureTile {...pair[0]} />
        <FigureTile {...pair[1]} />
      </View>
    </View>
  );
}
