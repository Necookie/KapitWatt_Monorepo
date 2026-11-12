import { TRUST } from '@kapitwatt/shared';
import { themes } from '@kapitwatt/styles';
import { Button, Logo } from '@kapitwatt/ui';
import { StatusBar } from 'expo-status-bar';
import { Animated, ScrollView, StyleSheet, View } from 'react-native';
import { space } from '@kapitwatt/tokens';

import { Fireflies } from '@/components/night/Fireflies';
import { MoonMascot } from '@/components/night/Moon';
import { NightSky } from '@/components/night/NightSky';
import { Skyline } from '@/components/night/Skyline';
import { greeting } from '@/utils/greeting';
import { Body } from '../components/Body';
import { HoldLantern } from '../components/HoldLantern';
import { MoonPicture } from '../components/MoonPicture';
import { PageDots } from '../components/PageDots';
import { Panel } from '../components/Panel';
import { RewardChip } from '../components/RewardChip';
import { useWelcome } from '../hooks/useWelcome';
import { PAGES } from '../utils/story';

const c = themes.light.color;

/**
 * First screen for a phone with no household signed in: a night street in Laguna, told in three
 * panels you swipe (alert, cut, reward). The middle one is a tiny try-it: hold the mascot and the
 * street's windows go dark one by one, then the reward that cut would earn counts up. Join or log in
 * below. Figures come from the shared reward constants.
 */
export default function WelcomePage() {
  const { insets, width, sheetRise, story, join, logIn } = useWelcome();

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <NightSky />
      <View style={[styles.top, { paddingTop: insets.top + space[3] }]}>
        <Logo height={24} color="onBrand" />
      </View>

      <View style={styles.scene}>
        <Fireflies />
        <ScrollView
          ref={story.pager}
          style={styles.pager}
          onLayout={story.onPagerLayout}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          // Plain scroll events: the web has no momentum or drag-end events. Same page, no re-render.
          onScroll={story.onScroll}
          scrollEventThrottle={32}
        >
          <Panel
            width={width}
            height={story.pagerHeight}
            kicker={greeting()}
            title="We'll tell you when the grid runs short."
            picture={
              <MoonPicture>
                <MoonMascot pose="alert" />
              </MoonPicture>
            }
            caption={
              <Body>
                NGCP raises a yellow or red alert and Meralco asks homes in your barangay to cut a
                little during the peak.
              </Body>
            }
          />

          <Panel
            width={width}
            height={story.pagerHeight}
            kicker="Try it"
            title="Cut a little, together."
            picture={<HoldLantern cut={story.cut} onDone={story.onCut} />}
            caption={
              story.cutDone ? (
                <RewardChip />
              ) : (
                <Body>Switch a few things off for the peak window.</Body>
              )
            }
          />

          <Panel
            width={width}
            height={story.pagerHeight}
            kicker="Your reward"
            title="Verified cuts raise your score."
            picture={
              <MoonPicture>
                <MoonMascot pose="reward" />
              </MoonPicture>
            }
            caption={
              <Body>
                {`We check each cut by smart meter or two meter photos. Every verified cut adds ${TRUST.cleanEvent} to your Contribution Score, and higher levels unlock perks.`}
              </Body>
            }
          />
        </ScrollView>
        <View style={styles.street} pointerEvents="none">
          <PageDots count={PAGES} index={story.page} />
          <Skyline cut={story.cut} width={width} />
        </View>
      </View>

      <View
        ref={sheetRise.sheet}
        style={[styles.sheet, { paddingBottom: insets.bottom + space[4] }]}
      >
        <Button size="lg" fullWidth label="Join the pilot" onPress={join} />
        <Button variant="text" label="I already have an account" align="center" onPress={logIn} />
      </View>
      {/* Join or log in: the white sheet rises to fill the screen before the next page opens. */}
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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.brand },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space[6],
  },
  scene: { flex: 1 },
  pager: { flex: 1 },
  street: { gap: space[3] },
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
    gap: space[1],
    paddingTop: space[4],
    paddingHorizontal: space[6],
    backgroundColor: c.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
});
