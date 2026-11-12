import { fontSources } from '@kapitwatt/styles';
import { useFonts } from 'expo-font';

/** Load Albert Sans once at the root layout. Returns true when the fonts are ready (or failed: render anyway). */
export function useBrandFonts(): boolean {
  const [loaded, error] = useFonts(fontSources);
  return loaded || error != null;
}
