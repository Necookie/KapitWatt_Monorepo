import { PrivacyNotice } from '@/components/privacy/PrivacyNotice';
import { Card, Screen } from '@/components/ui';

/** The privacy notice the household agreed to at sign-up, readable any time. */
export default function PrivacyPage() {
  return (
    <Screen>
      <Card>
        <PrivacyNotice />
      </Card>
    </Screen>
  );
}
