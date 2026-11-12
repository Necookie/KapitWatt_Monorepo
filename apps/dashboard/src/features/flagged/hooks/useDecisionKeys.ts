import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import type { Decision } from '../api/useReviewReading';

/** A and R decide, unless the operator is typing somewhere. */
export function useDecisionKeys(decide: (decision: Decision) => void) {
  const decideRef = useRef(decide);
  decideRef.current = decide;
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (e.key === 'a' || e.key === 'A') decideRef.current('approve');
      if (e.key === 'r' || e.key === 'R') decideRef.current('reject');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
