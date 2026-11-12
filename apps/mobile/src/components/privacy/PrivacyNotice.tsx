import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, space, text } from '@/theme';

/**
 * The privacy notice, shown before any personal data is asked for at sign-up and again from the
 * profile screen. One text in one place, so what a household agreed to is what it can re-read.
 * Retention and the list of recipients are pilot placeholders, like the reward rates.
 */

export const DATA_CONSENT_LABEL =
  'I consent to the collection and use of my personal data as described in this notice.';
export const ALERTS_CONSENT_LABEL =
  'I agree to receive grid alerts from KapitWatt by push notification.';

const SECTIONS: { title: string; body: string }[] = [
  {
    title: 'What we collect',
    body:
      'Your email, your Meralco account number, the account holder’s name and the service ' +
      'address; your home location; your meter serial number; and the meter photos and readings ' +
      'you send during events.',
  },
  {
    title: 'Why we collect it',
    body:
      'To check that an energy cut really happened at your meter, and to credit the reward to ' +
      'the right Meralco account. We do not use it for advertising and we do not sell it.',
  },
  {
    title: 'Who can see it',
    body:
      'Only Meralco program staff who review readings. Results are published per barangay, ' +
      'never per household. Your account number is shown back to you with only its last four ' +
      'digits.',
  },
  {
    title: 'How long we keep it',
    body:
      'Meter photos are stored privately and deleted after a limited time. Your account details ' +
      'are kept while you are enrolled and erased when you delete your account.',
  },
  {
    title: 'Your rights',
    body:
      'You can see your data, correct it, turn alerts off, withdraw your consent and delete your ' +
      'account at any time from the Profile screen. You may also complain to the National ' +
      'Privacy Commission.',
  },
];

export function PrivacyNotice() {
  return (
    <View style={styles.gap}>
      <Text style={styles.lead}>
        KapitWatt handles your personal data under the Data Privacy Act of 2012 (Republic Act
        10173).
      </Text>
      {SECTIONS.map((s) => (
        <View key={s.title} style={styles.section}>
          <Text style={styles.heading}>{s.title}</Text>
          <Text style={styles.body}>{s.body}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  gap: { gap: space.md },
  section: { gap: space.xs },
  lead: { ...text.body, color: colors.ink },
  heading: { ...text.body, fontFamily: fonts.semibold, color: colors.ink },
  body: { ...text.body, color: colors.muted },
});
