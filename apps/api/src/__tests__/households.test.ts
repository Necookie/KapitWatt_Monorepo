import type { HouseholdProfileRow } from '@kapitwatt/db';
import {
  DeleteAccountInput,
  HouseholdMe,
  LoginInput,
  MAX_COMMIT_KW,
  RegisterHouseholdInput,
  UpdateProfileInput,
} from '@kapitwatt/shared';
import { describe, expect, it } from 'vitest';
import { commitCapKw } from '../services/cap';
import { hashPassword, verifyPassword } from '../lib/crypto';
import {
  maskAccountNumber,
  pathFor,
  simulatedAmiBaselineKw,
  toHouseholdMe,
} from '../services/households';
import { call, json } from './helpers';

describe('commitCapKw', () => {
  it('is null until there is a baseline', () => {
    expect(commitCapKw(null, 450)).toBeNull();
  });

  it('is limited by the bill cap (worked example: 450 kWh/month caps at 1.25 kW, so 1.2)', () => {
    expect(commitCapKw(1.9, 450)).toBe(1.2);
  });

  it('is limited by the baseline', () => {
    expect(commitCapKw(0.8, 900)).toBe(0.8);
  });

  it('never exceeds MAX_COMMIT_KW', () => {
    expect(commitCapKw(9, 9000)).toBe(MAX_COMMIT_KW);
  });

  it('rounds down to the 0.1 kW step without float noise', () => {
    expect(commitCapKw(1.3, 1000)).toBe(1.3);
    expect(commitCapKw(0.7000000001, 1000)).toBe(0.7);
    expect(commitCapKw(0.05, 1000)).toBe(0);
  });
});

describe('household profile', () => {
  const row: HouseholdProfileRow = {
    id: '6f1e8a2e-3b7c-4c55-9a0e-0d6c1b8f2a10',
    barangayId: '9b2f6a3c-1d4e-4f5a-8b6c-7d8e9f0a1b2c',
    barangayName: 'Bagumbayan',
    municipality: 'Santa Cruz',
    meterType: 'standard',
    meterSerial: 'MER-123',
    billAvgKwhMonth: 450,
    baselineKw: null,
    trustScore: 50,
    optedIn: true,
    rehearsalReadings: 1,
    points: 160,
    creditPhp: 9.670000001,
    email: 'juan@example.com',
    accountNumber: '0123456789',
    accountName: 'Juan Dela Cruz',
    serviceAddress: '12 Rizal St',
    consentAt: new Date('2026-11-12T01:00:00.000Z'),
  };

  it('maps meter type to verification path', () => {
    expect(pathFor('ami')).toBe('ami');
    expect(pathFor('standard')).toBe('photo');
  });

  it('asks photo households for the rehearsal until they have a baseline', () => {
    const me = HouseholdMe.parse(toHouseholdMe(row));
    expect(me.needsRehearsal).toBe(true);
    expect(me.commitCapKw).toBeNull();
    expect(me.creditPhp).toBe(9.67);
  });

  it('sets the commit cap once the baseline exists', () => {
    const me = toHouseholdMe({ ...row, baselineKw: 1.9 });
    expect(me.needsRehearsal).toBe(false);
    expect(me.commitCapKw).toBe(1.2);
  });

  it('never asks smart-meter households to rehearse', () => {
    expect(toHouseholdMe({ ...row, meterType: 'ami' }).needsRehearsal).toBe(false);
  });
});

describe('account details in the profile', () => {
  const row: HouseholdProfileRow = {
    id: '6f1e8a2e-3b7c-4c55-9a0e-0d6c1b8f2a10',
    barangayId: '9b2f6a3c-1d4e-4f5a-8b6c-7d8e9f0a1b2c',
    barangayName: 'Bagumbayan',
    municipality: 'Santa Cruz',
    meterType: 'standard',
    meterSerial: 'MER-123',
    billAvgKwhMonth: 450,
    baselineKw: null,
    trustScore: 50,
    optedIn: true,
    rehearsalReadings: 0,
    points: 0,
    creditPhp: 0,
    email: 'juan@example.com',
    accountNumber: '0123456789',
    accountName: 'Juan Dela Cruz',
    serviceAddress: '12 Rizal St',
    consentAt: new Date('2026-11-12T01:00:00.000Z'),
  };

  it('never sends the full account number back', () => {
    const me = HouseholdMe.parse(toHouseholdMe(row));
    expect(me.accountNumberMasked).toBe('••••••6789');
    expect(JSON.stringify(me)).not.toContain('0123456789');
    expect(maskAccountNumber('0123456789')).toHaveLength(10);
  });

  it('carries the consent time and the editable details', () => {
    const me = toHouseholdMe(row);
    expect(me.consentAt).toBe('2026-11-12T01:00:00.000Z');
    expect(me.accountName).toBe('Juan Dela Cruz');
    expect(me.serviceAddress).toBe('12 Rizal St');
  });

  it('leaves the details null for households from before accounts existed', () => {
    const me = HouseholdMe.parse(
      toHouseholdMe({
        ...row,
        email: null,
        accountNumber: null,
        accountName: null,
        serviceAddress: null,
        consentAt: null,
      }),
    );
    expect(me.accountNumberMasked).toBeNull();
    expect(me.email).toBeNull();
  });
});

describe('passwords', () => {
  it('stores a salted hash, never the password', async () => {
    const a = await hashPassword('correct horse');
    const b = await hashPassword('correct horse');
    expect(a).toMatch(/^pbkdf2\$100000\$[A-Za-z0-9_-]+\$[A-Za-z0-9_-]+$/);
    expect(a).not.toContain('correct horse');
    expect(a).not.toBe(b);
  });

  it('verifies the right password only', async () => {
    const stored = await hashPassword('correct horse');
    expect(await verifyPassword('correct horse', stored)).toBe(true);
    expect(await verifyPassword('wrong horse', stored)).toBe(false);
    expect(await verifyPassword('', stored)).toBe(false);
  });

  it('rejects stored values that are not one of our hashes', async () => {
    expect(await verifyPassword('x', '')).toBe(false);
    expect(await verifyPassword('x', 'plain-text')).toBe(false);
    expect(await verifyPassword('x', 'pbkdf2$99999999$c2FsdA$aGFzaA')).toBe(false);
  });
});

describe('sign-up, login and profile input', () => {
  const signup = {
    email: '  Juan@Example.com ',
    password: 'correct horse',
    accountNumber: '0123456789',
    accountName: 'Juan Dela Cruz',
    serviceAddress: '12 Rizal St, Bagumbayan',
    barangayId: '9b2f6a3c-1d4e-4f5a-8b6c-7d8e9f0a1b2c',
    meterType: 'standard',
    meterSerial: 'MER-123',
    billAvgKwhMonth: 450,
    lat: 14.28,
    lng: 121.41,
    consent: true,
    alertsConsent: true,
  };
  const issues = (input: unknown) =>
    RegisterHouseholdInput.safeParse(input).error?.issues.map((i) => i.path.join('.')) ?? [];

  it('accepts a complete sign-up and normalises the email', () => {
    expect(RegisterHouseholdInput.parse(signup).email).toBe('juan@example.com');
  });

  it('needs both consents', () => {
    expect(issues({ ...signup, consent: false })).toEqual(['consent']);
    expect(issues({ ...signup, alertsConsent: false })).toEqual(['alertsConsent']);
    expect(issues({ ...signup, alertsConsent: undefined })).toEqual(['alertsConsent']);
  });

  it('needs a 10-digit account number', () => {
    for (const bad of ['123456789', '12345678901', '12345 6789', 'ABCDEFGHIJ', '']) {
      expect(issues({ ...signup, accountNumber: bad })).toEqual(['accountNumber']);
    }
  });

  it('needs a monthly use of at least 1 kWh (a tiny value would round to 0 in the database)', () => {
    expect(issues({ ...signup, billAvgKwhMonth: 0.004 })).toEqual(['billAvgKwhMonth']);
    expect(issues({ ...signup, billAvgKwhMonth: 0 })).toEqual(['billAvgKwhMonth']);
    expect(issues({ ...signup, billAvgKwhMonth: 1 })).toEqual([]);
  });

  it('needs an email, a password of 8 or more, a name and an address', () => {
    expect(issues({ ...signup, email: 'not-an-email' })).toEqual(['email']);
    expect(issues({ ...signup, password: 'short' })).toEqual(['password']);
    expect(issues({ ...signup, accountName: ' ' })).toEqual(['accountName']);
    expect(issues({ ...signup, serviceAddress: 'x' })).toEqual(['serviceAddress']);
  });

  it('validates login, profile changes and account deletion', () => {
    expect(LoginInput.parse({ email: 'JUAN@example.com', password: 'x' }).email).toBe(
      'juan@example.com',
    );
    expect(LoginInput.safeParse({ email: 'juan@example.com' }).success).toBe(false);
    expect(UpdateProfileInput.safeParse({}).success).toBe(false);
    expect(UpdateProfileInput.safeParse({ optedIn: false }).success).toBe(true);
    expect(UpdateProfileInput.safeParse({ accountName: 'J' }).success).toBe(false);
    expect(DeleteAccountInput.safeParse({}).success).toBe(false);
  });
});

describe('account routes before the database', () => {
  it('refuses a login without a password', async () => {
    const res = await call('/auth/login', json({ email: 'juan@example.com' }));
    expect(res.status).toBe(400);
  });

  it('needs a household token to log out, edit the profile or delete the account', async () => {
    expect((await call('/auth/logout', { method: 'POST' })).status).toBe(401);
    expect((await call('/auth/me', { ...json({ optedIn: false }), method: 'PATCH' })).status).toBe(
      401,
    );
    expect((await call('/auth/me', { ...json({ password: 'x' }), method: 'DELETE' })).status).toBe(
      401,
    );
  });
});

describe('smart-meter sign-up in the demo', () => {
  it('starts with a baseline from the bill, so the household can commit at once', () => {
    // 450 kWh/month: 2 x 450 / 720 = 1.25 kW peak estimate
    expect(simulatedAmiBaselineKw(450)).toBeCloseTo(1.3, 5);
    for (const bill of [100, 300, 450, 1200]) {
      const cap = commitCapKw(simulatedAmiBaselineKw(bill), bill);
      expect(cap).not.toBeNull();
      expect(cap!).toBeGreaterThan(0);
    }
  });
});
