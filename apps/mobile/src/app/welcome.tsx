import { TRUST } from '@kapitwatt/shared';
import { themes } from '@kapitwatt/styles';
import { withAlpha } from '@kapitwatt/tokens';
import { Logo, Text } from '@kapitwatt/ui';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState, type ComponentRef, type ReactNode } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui';
import { Fireflies } from '@/components/welcome/Fireflies';
import { greeting } from '@/components/welcome/greeting';
import { HoldLantern } from '@/components/welcome/HoldLantern';
import { PageDots } from '@/components/welcome/PageDots';
import { MoonMascot } from '@/components/welcome/Moon';
import { NightSky } from '@/components/welcome/NightSky';
import { RewardChip } from '@/components/welcome/RewardChip';
import { Skyline } from '@/components/welcome/Skyline';
import { useSheetRise } from '@/components/welcome/useSheetRise';
import { loginSheetTop } from '@/components/login/LoginNight';
import { sheetTop } from '@/components/onboarding/LanternStreet';
import { space } from '@/theme';

const c = themes.light.color;
const ON_SOFT = withAlpha(c.onBrand, 0.78);
const PAGES = 3;
/** After the cut, a beat on the reward before the story moves on. */
const AFTER_CUT_MS = 1400;

/**
 * First screen for a phone with no household signed in: a night street in Laguna, told in three
 * panels you swipe (alert, cut, reward). The middle one is a tiny try-it: hold the mascot and the
 * street's windows go dark one by one, then the reward that cut would earn counts up. Join or log in
 * below. Figures come from the shared reward constants.
 */
export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const sheetRise = useSheetRise(height);
  const pager = useRef<ComponentRef<typeof ScrollView>>(null);
  const cut = useRef(new Animated.Value(0)).current;
  const [page, setPage] = useState(0);
  const [cutDone, setCutDone] = useState(false);
  const [pagerHeight, setPagerHeight] = useState(0);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    setPage(Math.round(e.nativeEvent.contentOffset.x / width));

  const onCut = () => {
    setCutDone(true);
    setTimeout(() => {
      pager.current?.scrollTo({ x: width * 2, animated: true });
      setPage(2);
    }, AFTER_CUT_MS);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <NightSky />
      <View style={[styles.top, { paddingTop: insets.top + space.md }]}>
        <Logo height={24} color="onBrand" />
      </View>

      <View style={styles.scene}>
        <Fireflies />
        <ScrollView
          ref={pager}
          style={styles.pager}
          onLayout={(e) => setPagerHeight(e.nativeEvent.layout.height)}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          // Plain scroll events: the web has no momentum or drag-end events. Same page, no re-render.
          onScroll={onScroll}
          scrollEventThrottle={32}
        >
          <Panel
            width={width}
            height={pagerHeight}
            kicker={greeting()}
            title="We'll tell you when the grid runs short."
          >
            <MoonMascot pose="alert" />
            <Body>
              NGCP raises a yellow or red alert and Meralco asks homes in your barangay to cut a
              little during the peak.
            </Body>
          </Panel>

          <Panel width={width} height={pagerHeight} kicker="Try it" title="Cut a little, together.">
            <HoldLantern cut={cut} onDone={onCut} />
            {cutDone ? <RewardChip /> : <Body>Switch a few things off for the peak window.</Body>}
          </Panel>

          <Panel
            width={width}
            height={pagerHeight}
            kicker="Your reward"
            title="Verified cuts raise your score."
          >
            <MoonMascot pose="reward" />
            <Body>
              {`We check each cut by smart meter or two meter photos. Every verified cut adds ${TRUST.cleanEvent} to your Contribution Score, and higher levels unlock perks.`}
            </Body>
          </Panel>
        </ScrollView>
        <View style={styles.street} pointerEvents="none">
          <PageDots count={PAGES} index={page} />
          <Skyline cut={cut} width={width} />
        </View>
      </View>

      <View
        ref={sheetRise.sheet}
        style={[styles.sheet, { paddingBottom: insets.bottom + space.lg }]}
      >
        <Button
          label="Join the pilot"
          onPress={() => sheetRise.rise(sheetTop(width, insets.top), () => router.push('/sign-up'))}
        />
        <Button
          label="I already have an account"
          variant="text"
          align="center"
          onPress={() => sheetRise.rise(loginSheetTop(insets.top), () => router.push('/login'))}
        />
      </View>
      {/* Join or log in: the sheet rises to where the next page's sheet starts. */}
      {sheetRise.visible ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.rising,
            { height: sheetRise.panelHeight, transform: [{ translateY: sheetRise.y }] },
          ]}
        />
      ) : null}
    </View>
  );
}

/** One story panel: a small label, the headline, then the picture and its line. */
function Panel(props: {
  width: number;
  height: number;
  kicker: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <View style={[styles.panel, { width: props.width, height: props.height || undefined }]}>
      <View style={styles.heading}>
        <Text variant="labelLarge" style={styles.kicker}>
          {props.kicker}
        </Text>
        <Text
          variant="headlineSmall"
          align="center"
          accessibilityRole="header"
          style={styles.title}
        >
          {props.title}
        </Text>
      </View>
      {props.children}
    </View>
  );
}

function Body({ children }: { children: ReactNode }) {
  return (
    <Text variant="bodyMedium" align="center" style={styles.body}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.brand },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.xl,
  },
  scene: { flex: 1 },
  pager: { flex: 1 },
  panel: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.lg,
    paddingHorizontal: space.xl,
  },
  heading: { alignItems: 'center', gap: space.xs },
  kicker: { color: c.tertiaryContainer, textTransform: 'uppercase', letterSpacing: 1 },
  title: { color: c.onBrand },
  body: { color: ON_SOFT, maxWidth: 320 },
  street: { gap: space.md },
  rising: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    backgroundColor: c.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  sheet: {
    gap: space.xs,
    paddingTop: space.lg,
    paddingHorizontal: space.xl,
    backgroundColor: c.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
});
