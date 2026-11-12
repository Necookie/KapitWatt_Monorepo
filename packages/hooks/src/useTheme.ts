import { ThemeContext, type Theme } from '@kapitwatt/styles';
import { useContext, useMemo } from 'react';

export function useTheme(): Theme {
  return useContext(ThemeContext);
}

/**
 * Themed styles, rebuilt only when the theme changes.
 *   const makeStyles = (t: Theme) => StyleSheet.create({ card: { backgroundColor: t.color.surfaceContainer } });
 *   const styles = useStyles(makeStyles);   // define makeStyles outside the component
 */
export function useStyles<T>(factory: (theme: Theme) => T): T {
  const theme = useTheme();
  return useMemo(() => factory(theme), [factory, theme]);
}
