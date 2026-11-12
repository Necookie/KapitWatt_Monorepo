import { useTheme } from '@kapitwatt/hooks';
import { Icon } from '@kapitwatt/icons';
import { Text } from '@kapitwatt/ui';
import { Link, usePathname } from 'expo-router';
import { Fragment } from 'react';
import { Pressable, View } from 'react-native';
import type { PressState } from '@/utils/press-state';
import { crumbsFor } from '../utils/navigation';

/**
 * The top app bar's title as a trail: the page's name, or its destination then the page beneath it
 * (Live load › Santa Cruz). Earlier steps link back; the last one is the page's heading.
 */
export function Breadcrumbs() {
  const t = useTheme();
  const crumbs = crumbsFor(usePathname());
  return (
    <View
      accessibilityRole={'navigation' as never}
      accessibilityLabel="Breadcrumb"
      style={{ flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: t.space[2] }}
    >
      {crumbs.map((crumb, i) =>
        crumb.href ? (
          <Fragment key={crumb.href}>
            <Link href={crumb.href as never} asChild>
              <Pressable accessibilityRole="link">
                {(s: PressState) => (
                  <Text
                    variant="titleLarge"
                    color="onSurfaceVariant"
                    numberOfLines={1}
                    style={{ textDecorationLine: s.hovered ? 'underline' : 'none' }}
                  >
                    {crumb.label}
                  </Text>
                )}
              </Pressable>
            </Link>
            <Icon name="chevronRight" size="sm" color="onSurfaceVariant" />
          </Fragment>
        ) : (
          <Text
            key={i}
            variant="titleLarge"
            accessibilityRole="header"
            numberOfLines={1}
            style={{ flexShrink: 1 }}
          >
            {crumb.label}
          </Text>
        ),
      )}
    </View>
  );
}
