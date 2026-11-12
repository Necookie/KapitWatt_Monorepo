import { RegisterHouseholdInput, type MeterType, type PilotTown } from '@kapitwatt/shared';

/**
 * What the household has typed so far during onboarding. It lives in memory on the phone only:
 * nothing is sent to the server until "Join the pilot" on the last step, so a household that stops
 * at the consent step leaves no personal data behind.
 */
export interface Draft {
  email: string;
  password: string;
  confirmPassword: string;
  consent: boolean;
  alertsConsent: boolean;
  accountNumber: string;
  accountName: string;
  serviceAddress: string;
  town: PilotTown | null;
  barangayId: string | null;
  location: { lat: number; lng: number } | null;
  meterType: MeterType | null;
  meterSerial: string;
  billText: string;
}

export const EMPTY_DRAFT: Draft = {
  email: '',
  password: '',
  confirmPassword: '',
  consent: false,
  alertsConsent: false,
  accountNumber: '',
  accountName: '',
  serviceAddress: '',
  town: null,
  barangayId: null,
  location: null,
  meterType: null,
  meterSerial: '',
  billText: '',
};

export interface StepProps {
  draft: Draft;
  set: (changes: Partial<Draft>) => void;
}

/** The onboarding steps, in order. */
export const STEPS = ['account', 'privacy', 'meralco', 'home', 'meter', 'review'] as const;
export type StepId = (typeof STEPS)[number];

export const STEP_TITLE: Record<StepId, string> = {
  account: 'Create your account',
  privacy: 'Privacy and consent',
  meralco: 'Your Meralco account',
  home: 'Where you live',
  meter: 'Your meter',
  review: 'Review and join',
};

type Field = keyof typeof RegisterHouseholdInput.shape;

/** Checks one field with the same rule the API applies (the shared sign-up schema). */
export const fieldOk = (field: Field, value: unknown): boolean =>
  RegisterHouseholdInput.shape[field].safeParse(value).success;

/** What the draft sends to the API. Validate the result with RegisterHouseholdInput. */
export function toSignUp(d: Draft) {
  return {
    email: d.email,
    password: d.password,
    accountNumber: d.accountNumber,
    accountName: d.accountName,
    serviceAddress: d.serviceAddress,
    barangayId: d.barangayId,
    meterType: d.meterType,
    meterSerial: d.meterSerial.trim(),
    billAvgKwhMonth: Number(d.billText),
    lat: d.location?.lat,
    lng: d.location?.lng,
    consent: d.consent,
    alertsConsent: d.alertsConsent,
  };
}

/** Whether a step is complete, so "Continue" can be enabled. */
export function stepDone(step: StepId, d: Draft): boolean {
  switch (step) {
    case 'account':
      return (
        fieldOk('email', d.email) &&
        fieldOk('password', d.password) &&
        d.password === d.confirmPassword
      );
    case 'privacy':
      return d.consent && d.alertsConsent;
    case 'meralco':
      return (
        fieldOk('accountNumber', d.accountNumber) &&
        fieldOk('accountName', d.accountName) &&
        fieldOk('serviceAddress', d.serviceAddress)
      );
    case 'home':
      return d.barangayId !== null && d.location !== null;
    case 'meter':
      return (
        d.meterType !== null &&
        fieldOk('meterSerial', d.meterSerial.trim()) &&
        fieldOk('billAvgKwhMonth', Number(d.billText))
      );
    case 'review':
      return RegisterHouseholdInput.safeParse(toSignUp(d)).success;
  }
}
