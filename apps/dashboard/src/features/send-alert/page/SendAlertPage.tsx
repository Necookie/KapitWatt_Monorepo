import { useTheme } from '@kapitwatt/hooks';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Panel } from '@/components/Panel';
import { Split } from '@/components/Split';
import { Notice } from '@/components/ui/Notice';
import { errorMessage } from '@/api/client';
import { useCurrentAlert } from '@/api/queries';
import { useLayoutValue } from '@/hooks/useLayoutValue';
import { dayAndClock } from '@/utils/format';
import { useCreateAlert } from '../api/useCreateAlert';
import { AreaPicker } from '../components/AreaPicker';
import { ConfirmSend } from '../components/ConfirmSend';
import { LevelCards } from '../components/LevelCards';
import { MessageField } from '../components/MessageField';
import { PhonePreview } from '../components/PhonePreview';
import { SendSummary } from '../components/SendSummary';
import { StickyRail } from '../components/StickyRail';
import { TargetPicker } from '../components/TargetPicker';
import { WindowPicker } from '../components/WindowPicker';
import { useAlertForm } from '../hooks/useAlertForm';
import { DEFAULT_TARGET_KW, DURATIONS, SENT_PAUSE_MS } from '../utils/alert-defaults';

/**
 * Send alert: a numbered composer (level, window, target with its forecast, areas, message) beside a
 * rail that stays in view with what households will receive, the summary and the one send action.
 */
export default function SendAlertPage() {
  const t = useTheme();
  const router = useRouter();
  const [beside, onLayout] = useLayoutValue((w) => w >= 900);
  const current = useCurrentAlert();
  const form = useAlertForm();
  const [confirming, setConfirming] = useState(false);
  const [sent, setSent] = useState(false);
  const send = useCreateAlert(form.input);
  const inForce = current.data && current.data.status !== 'settled' ? current.data : null;

  return (
    <View onLayout={onLayout} style={{ gap: t.space[4] }}>
      {inForce ? (
        <Notice tone="warning">
          An alert is already in force ({inForce.level}, {dayAndClock(inForce.windowStart)}).
          Sending another starts a new event; the live view follows the newest one.
        </Notice>
      ) : null}
      {form.barangays.error ? (
        <Notice tone="critical">{errorMessage(form.barangays.error)}</Notice>
      ) : null}

      <Split wide={beside} ratio={[7, 4]}>
        <View style={{ gap: t.space[4] }}>
          <Panel step={1} title="Level" subtitle="The NGCP alert this event answers.">
            <LevelCards
              value={form.level}
              onChange={form.setLevel}
              defaultTargetKw={DEFAULT_TARGET_KW}
            />
          </Panel>
          <Panel step={2} title="Peak window" subtitle="When households should cut their load.">
            <WindowPicker
              start={form.start}
              onStart={form.setStart}
              hours={form.hours}
              onHours={form.setHours}
              durations={DURATIONS}
            />
          </Panel>
          <Panel step={3} title="Target relief" subtitle="How much load the grid needs taken off.">
            <TargetPicker
              text={form.targetText}
              onText={form.setTarget}
              unit={form.unit}
              onUnit={form.changeUnit}
              targetKw={form.input.targetKw}
              households={form.households}
              params={form.params}
            />
          </Panel>
          <Panel
            step={4}
            title="Target areas"
            subtitle="Only opted-in households in these barangays are alerted."
          >
            <AreaPicker
              byTown={form.byTown}
              selected={form.selected}
              onToggle={form.toggle}
              onAll={form.pickAll}
              loading={form.barangays.isLoading}
            />
          </Panel>
          <Panel
            step={5}
            title="Message"
            subtitle="Written for you from the level and window. Edit it if you need to."
          >
            <MessageField
              value={form.messageText}
              edited={form.message !== null}
              onChange={form.setMessage}
              onReset={() => form.setMessage(null)}
            />
          </Panel>
        </View>

        <StickyRail sticky={beside}>
          <PhonePreview title={form.title} body={form.messageText} />
          <SendSummary
            level={form.level}
            problem={form.problem}
            onSend={() => setConfirming(true)}
            rows={form.summaryRows}
          />
        </StickyRail>
      </Split>

      <ConfirmSend
        visible={confirming}
        level={form.level}
        headline={form.confirmHeadline}
        body={form.confirmBody}
        error={send.error ? errorMessage(send.error) : undefined}
        busy={send.isPending}
        sent={sent}
        onCancel={() => {
          send.reset();
          setConfirming(false);
        }}
        onSend={() =>
          send.mutate(undefined, {
            // A moment on the check, then the live view of the alert just sent.
            onSuccess: () => {
              setSent(true);
              setTimeout(() => router.replace('/'), SENT_PAUSE_MS);
            },
          })
        }
      />
    </View>
  );
}
