import { createContext, type ReactNode } from 'react';
import { StyleSheet, useColorScheme, View } from 'react-native';
import { themes, type Theme } from './theme';

export const ThemeContext = createContext<Theme>(themes.light);

export type SchemePreference = 'light' | 'dark' | 'system';

/**
 * Wrap each app once, at the root layout. Provides the theme and paints the page background,
 * which is the only global style React Native has.
 * The household app ships light only for the demo; the dashboard may follow the system.
 */
export function ThemeProvider({
  scheme = 'light',
  children,
}: {
  scheme?: SchemePreference;
  children: ReactNode;
}) {
  const system = useColorScheme();
  const theme = themes[scheme === 'system' ? (system === 'dark' ? 'dark' : 'light') : scheme];
  return (
    <ThemeContext.Provider value={theme}>
      <View style={[styles.root, { backgroundColor: theme.color.surface }]}>{children}</View>
    </ThemeContext.Provider>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
