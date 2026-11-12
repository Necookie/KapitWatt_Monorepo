import { useTheme } from '@kapitwatt/hooks';
import { View, type ViewStyle } from 'react-native';
import { Split } from '@/components/Split';
import { Notice } from '@/components/ui/Notice';
import { errorMessage } from '@/api/client';
import { useLayoutValue } from '@/hooks/useLayoutValue';
import { useSimParams } from '@/hooks/sim-params';
import { ExpectedOutcome } from '../components/ExpectedOutcome';
import { ParameterColumn } from '../components/ParameterColumn';
import { SimBanner } from '../components/SimBanner';
import { SimulatorRunRail } from '../components/SimulatorRunRail';
import { useSimulatorState } from '../hooks/useSimulatorState';

/**
 * Demo only. Scenario cards and the assumptions in three groups on the left; on the right, kept in
 * view, the run steps with the next one as the main action and the expected outcome as a waterfall.
 * Simulated households go through the same commit, reading and settlement code as real phones.
 */
export default function SimulatorPage() {
  const t = useTheme();
  const { params, setParams } = useSimParams();
  const sim = useSimulatorState(params);
  const [beside, onLayout] = useLayoutValue((w) => w >= 900);

  return (
    <View onLayout={onLayout} style={{ gap: t.space[4] }}>
      {sim.failed ? <Notice tone="critical">{errorMessage(sim.failed)}</Notice> : null}
      <SimBanner status={sim.status.data} enabled={sim.demo} />

      {beside ? (
        <Split wide ratio={[7, 4]}>
          <ParameterColumn
            params={params}
            setParams={setParams}
            targeted={sim.targeted}
            targetKw={sim.targetKw}
            live={sim.live}
          />
          {/* Kept in view while the parameters scroll (web: sticky inside the page's scroll view). */}
          <View
            style={
              {
                position: 'sticky',
                top: t.space[4],
                alignSelf: 'flex-start',
                width: '100%',
              } as unknown as ViewStyle
            }
          >
            <SimulatorRunRail
              sim={sim}
              paceSeconds={params.paceSeconds}
              between={
                <ExpectedOutcome expected={sim.expected} targetKw={sim.targetKw} params={params} />
              }
            />
          </View>
        </Split>
      ) : (
        // Narrow: the next step first, then the assumptions, then what they add up to.
        <>
          <SimulatorRunRail sim={sim} paceSeconds={params.paceSeconds} between={null} />
          <ParameterColumn
            params={params}
            setParams={setParams}
            targeted={sim.targeted}
            targetKw={sim.targetKw}
            live={sim.live}
          />
          <ExpectedOutcome expected={sim.expected} targetKw={sim.targetKw} params={params} />
        </>
      )}
    </View>
  );
}
