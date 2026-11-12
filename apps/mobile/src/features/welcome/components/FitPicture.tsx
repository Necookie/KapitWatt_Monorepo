import { useState, type ReactNode } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';

type Size = { width: number; height: number };
const sizeOf = (e: LayoutChangeEvent): Size => ({
  width: e.nativeEvent.layout.width,
  height: e.nativeEvent.layout.height,
});

/**
 * A panel's picture, shrunk to fit the room the panel has left for it (never enlarged). Phones differ
 * in how much height the story gets between the top bar and the street; at its full size the moon
 * would push the heading under the logo on a short screen. The picture keeps its layout size and is
 * scaled with a transform, so measuring it never feeds back into the scale.
 */
export function FitPicture({ children }: { children: ReactNode }) {
  const [room, setRoom] = useState<Size | null>(null);
  const [own, setOwn] = useState<Size | null>(null);
  const scale =
    room && own && own.height > 0 && own.width > 0
      ? Math.min(1, room.height / own.height, room.width / own.width)
      : 1;
  // Hidden until both sizes are known, so a short screen never shows one frame at full size first.
  const measured = room !== null && own !== null;
  return (
    <View style={styles.room} onLayout={(e) => setRoom(sizeOf(e))}>
      <View
        onLayout={(e) => setOwn(sizeOf(e))}
        style={{ opacity: measured ? 1 : 0, transform: [{ scale }] }}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Its natural height when there is room, shrinking below it only when there is not: what sits
  // beside it (the try-it's hint) stays right under it, and the parent centres the group.
  room: {
    flexShrink: 1,
    minHeight: 0,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
