import { useTheme, useWindowClass } from '@kapitwatt/hooks';
import { Icon } from '@kapitwatt/icons';
import { color as roles } from '@kapitwatt/tokens';
import { Text } from '@kapitwatt/ui';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { ON, ON_SOFT } from '@/styles/on-brand';
import { HeroButton } from './HeroButton';
import { RestingMascot } from './RestingMascot';

/** The indigo hero with no alert in force: the grid is calm and the pilot is ready. */
export function CalmHero({ loading, demo }: { loading: boolean; demo: boolean }) {
  const t = useTheme();
  const router = useRouter();
  const wide = useWindowClass() !== 'compact';
  return (
    <View
      style={{
        flex: 1,
        flexDirection: wide ? 'row' : 'column-reverse',
        alignItems: wide ? 'center' : 'flex-start',
        gap: t.space[6],
        padding: wide ? t.space[8] : t.space[5],
        borderRadius: t.radius.xl,
        backgroundColor: roles.light.brand,
      }}
    >
      <View style={{ flex: wide ? 1 : undefined, minWidth: 0, gap: t.space[4] }}>
        <View
          style={{
            alignSelf: 'flex-start',
            flexDirection: 'row',
            alignItems: 'center',
            gap: t.space[1],
            paddingHorizontal: t.space[3],
            height: 30,
            borderRadius: t.radius.full,
            backgroundColor: roles.light.reliefContainer,
          }}
        >
          <Icon
            name={loading ? 'pending' : 'verified'}
            weight="fill"
            size="sm"
            color={roles.light.onReliefContainer}
          />
          <Text
            variant="labelLarge"
            style={{
              color: roles.light.onReliefContainer,
              textTransform: 'uppercase',
              letterSpacing: 0.6,
            }}
          >
            {loading ? 'Checking for an alert' : 'No alert in force'}
          </Text>
        </View>
        <View>
          <Text variant={wide ? 'displaySmall' : 'headlineMedium'} style={{ color: ON }}>
            The grid is calm.
          </Text>
          <Text
            variant={wide ? 'displaySmall' : 'headlineMedium'}
            style={{ color: roles.light.inversePrimary }}
          >
            The pilot is ready.
          </Text>
        </View>
        <Text variant="bodyLarge" style={{ color: ON_SOFT, maxWidth: 560 }}>
          When NGCP raises a yellow or red alert, send one to the pilot’s opted-in households.
          Commitments, the relief forecast and verified delivery will fill this page as they come
          in.
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.space[2] }}>
          <HeroButton
            label="Send alert"
            icon="send"
            filled
            onPress={() => router.push('/alerts/new')}
          />
          {demo ? (
            <HeroButton
              label="Open simulator"
              icon="simulated"
              onPress={() => router.push('/simulator')}
            />
          ) : null}
        </View>
      </View>
      <RestingMascot size={wide ? 220 : 140} />
    </View>
  );
}
