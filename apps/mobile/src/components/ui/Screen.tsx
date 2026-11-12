import { useCallback, useEffect, useRef, useState, type ComponentRef, type ReactNode } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  RefreshControl,
  ScrollView,
  StyleSheet,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { space } from '@kapitwatt/tokens';
import { themes } from '@kapitwatt/styles';
import { RevealContext, type RevealTarget } from './reveal';

const c = themes.light.color;

/** Room kept between a revealed field and the edge of what is visible (px). */
const REVEAL_MARGIN = 24;

/**
 * Every screen's outer frame: scrolls, pads, and optionally supports pull to refresh.
 * The spinner shows only for a pull the user made, never for the background polling.
 * The content fills at least the screen, so a block with `marginTop: 'auto'` sits at the bottom.
 *
 * It keeps text fields clear of the keyboard. Expo apps are edge-to-edge on Android, so the window
 * no longer shrinks for the keyboard: the scroll view sits in a KeyboardAvoidingView ("padding", as
 * the Expo docs recommend), and the field being typed in (TextField, via `useReveal`) is scrolled
 * into the room left above the keyboard, only when it is hidden there.
 */
export function Screen(props: {
  children: ReactNode;
  onRefresh?: () => Promise<unknown>;
  /** 24 px sides and a 24 px gap, for screens with few, large blocks (welcome, log in). */
  roomy?: boolean;
  /** No top bar above this screen: pad for the status bar and leave room at the top. */
  noHeader?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const { onRefresh } = props;
  const [pulling, setPulling] = useState(false);
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const target = useRef<RevealTarget | null>(null);
  const scrolledTo = useRef(0);
  const visibleHeight = useRef(0);
  const keyboardUp = useRef(false);

  /** Scrolls the focused field into view if it is above or below what is visible. */
  const reveal = useCallback(() => {
    const field = target.current;
    const view = scroll.current;
    const content = view?.getInnerViewRef();
    if (!field || !view || !content) return;
    field.measureLayout(
      content,
      (_x, y, _width, height) => {
        const top = scrolledTo.current;
        const bottom = top + visibleHeight.current;
        if (y - REVEAL_MARGIN < top) view.scrollTo({ y: Math.max(0, y - REVEAL_MARGIN) });
        else if (y + height + REVEAL_MARGIN > bottom) {
          view.scrollTo({ y: y + height + REVEAL_MARGIN - visibleHeight.current });
        }
      },
      () => undefined,
    );
  }, []);

  // The keyboard opening shrinks the scroll view (onLayout below reveals then); closing it ends that.
  useEffect(() => {
    const shown = Keyboard.addListener('keyboardDidShow', () => {
      keyboardUp.current = true;
    });
    const hidden = Keyboard.addListener('keyboardDidHide', () => {
      keyboardUp.current = false;
    });
    return () => {
      shown.remove();
      hidden.remove();
    };
  }, []);

  /** A field got focus: remember it, and reveal it now if the keyboard is already open. */
  const focus = useCallback(
    (field: RevealTarget | null) => {
      target.current = field;
      if (keyboardUp.current) reveal();
    },
    [reveal],
  );

  const onLayout = (e: LayoutChangeEvent) => {
    visibleHeight.current = e.nativeEvent.layout.height;
    if (keyboardUp.current) reveal();
  };
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrolledTo.current = e.nativeEvent.contentOffset.y;
  };

  return (
    <RevealContext.Provider value={focus}>
      <KeyboardAvoidingView behavior="padding" style={styles.root}>
        <ScrollView
          ref={scroll}
          style={styles.root}
          keyboardShouldPersistTaps="handled"
          onLayout={onLayout}
          onScroll={onScroll}
          scrollEventThrottle={64}
          contentContainerStyle={[
            styles.content,
            props.roomy && styles.roomy,
            props.noHeader && { paddingTop: insets.top + space[8] },
            { paddingBottom: space[6] + insets.bottom },
          ]}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={pulling}
                onRefresh={() => {
                  setPulling(true);
                  void onRefresh().finally(() => setPulling(false));
                }}
                tintColor={c.primary}
                colors={[c.primary]}
              />
            ) : undefined
          }
        >
          {props.children}
        </ScrollView>
      </KeyboardAvoidingView>
    </RevealContext.Provider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.surface },
  content: { flexGrow: 1, padding: space[4], gap: space[4] },
  roomy: { paddingHorizontal: space[6], paddingTop: space[2], gap: space[6] },
});
