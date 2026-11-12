import { SimParams } from '@kapitwatt/shared';
import { DEFAULT_PARAMS } from '@kapitwatt/sim';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

/**
 * The simulation parameters in force. Held above the routes because three places
 * need the same values: the simulator panel edits them, the shell keeps them on
 * screen as assumptions (FR-DASH-09), and the overview sends them with the
 * delivery phase when the operator ends the window.
 */
const STORAGE_KEY = 'kapitwatt.dashboard.simParams';

interface SimParamsContextValue {
  params: SimParams;
  setParams: (next: SimParams) => void;
}

const SimParamsContext = createContext<SimParamsContextValue | null>(null);

function load(): SimParams {
  try {
    const stored = globalThis.localStorage?.getItem(STORAGE_KEY);
    const parsed = stored ? SimParams.safeParse(JSON.parse(stored)) : null;
    if (parsed?.success) return parsed.data;
  } catch {
    // Unreadable or blocked storage: fall back to the plan defaults.
  }
  return DEFAULT_PARAMS;
}

export function SimParamsProvider({ children }: { children: ReactNode }) {
  const [params, setState] = useState<SimParams>(load);
  const setParams = useCallback((next: SimParams) => {
    setState(next);
    try {
      globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Not persisted; the values still hold for this session.
    }
  }, []);
  const value = useMemo(() => ({ params, setParams }), [params, setParams]);
  return <SimParamsContext.Provider value={value}>{children}</SimParamsContext.Provider>;
}

export function useSimParams(): SimParamsContextValue {
  const value = useContext(SimParamsContext);
  if (!value) throw new Error('useSimParams must be used inside SimParamsProvider');
  return value;
}
