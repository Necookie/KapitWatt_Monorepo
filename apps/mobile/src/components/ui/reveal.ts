import { createContext, useContext, type ComponentRef } from 'react';
import type { View } from 'react-native';

/** A field's outer box (label, input and hint), which the screen scrolls into view. */
export type RevealTarget = ComponentRef<typeof View>;

/** Set by Screen: a field calls it on focus, so the keyboard never hides the field being typed in. */
export const RevealContext = createContext<(target: RevealTarget | null) => void>(() => undefined);

/** For a text input: call the result with the field's outer box when the input gets focus. */
export const useReveal = () => useContext(RevealContext);
