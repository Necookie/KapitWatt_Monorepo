import { useFocusVisible } from '@kapitwatt/hooks';
import { useState } from 'react';

/**
 * Hover and focus for Pressable (pressed comes from Pressable itself). Hover only fires on the web.
 * `focused` follows :focus-visible, so a click or tap never leaves a focus ring behind.
 */
export function usePressState() {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const focusVisible = useFocusVisible();
  return {
    hovered,
    focused: focused && focusVisible,
    handlers: {
      onHoverIn: () => setHovered(true),
      onHoverOut: () => setHovered(false),
      onFocus: () => setFocused(true),
      onBlur: () => setFocused(false),
    },
  };
}
