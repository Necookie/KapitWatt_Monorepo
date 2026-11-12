import { Card } from '@/components/ui/Card';
import { Txt } from '@/components/ui/Txt';

export function TownEmptyState({ hasAlert }: { hasAlert: boolean }) {
  return (
    <Card>
      <Txt tone="muted">
        {hasAlert
          ? 'This town is not targeted by the current alert.'
          : 'No alert has been sent yet.'}
      </Txt>
    </Card>
  );
}
