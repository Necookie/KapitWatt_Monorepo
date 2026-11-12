import { describeError } from '@/api/http';

export function loginError(e: Error): string {
  return describeError(
    e,
    {
      invalid_credentials: 'Wrong email or password.',
      // An API from before logins existed answers 404 for this route.
      not_found:
        'The server does not support logging in yet. Ask the KapitWatt team to update the API.',
    },
    'Could not log you in. Try again.',
  );
}
