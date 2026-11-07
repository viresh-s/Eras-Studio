/**
 * Centralized Authentication Error Handling & Formatting
 * 
 * Implements resilient error handling patterns:
 * - Differentiates between benign user cancellations and actionable errors.
 * - Converts raw technical codes (e.g. `access_denied`, `invalid_grant`)
 *   into clean, human-friendly messages.
 * - Provides warning flag for non-fatal events (e.g. user cancelled OAuth).
 */

export interface FormattedAuthError {
  message: string;
  isWarning: boolean; // true for cancellations or non-fatal notices (amber styling)
  isCanceled: boolean;
  code?: string;
}

export function formatAuthError(rawError: string | null | undefined): FormattedAuthError | null {
  if (!rawError) return null;

  const normalized = decodeURIComponent(rawError).trim().toLowerCase();

  // 1. User canceled / closed OAuth consent flow (Google access_denied)
  if (
    normalized === 'access_denied' ||
    normalized === 'cancelled' ||
    normalized === 'canceled' ||
    normalized.includes('access_denied') ||
    normalized.includes('denied your application access') ||
    normalized.includes('user denied access') ||
    normalized.includes('popup_closed_by_user') ||
    normalized.includes('closed_by_user') ||
    normalized.includes('user cancelled') ||
    normalized.includes('user canceled') ||
    normalized.includes('user_cancelled') ||
    normalized.includes('consent_required') ||
    normalized.includes('cancelled the login') ||
    normalized.includes('cancelled the sign in') ||
    normalized.includes('cancelled the signup')
  ) {
    return {
      message: 'Google sign-in was cancelled. You can try again or continue using your email and password.',
      isWarning: true,
      isCanceled: true,
      code: 'AUTH_CANCELLED',
    };
  }

  // 2. Account already registered with another method
  if (
    normalized.includes('user already registered') ||
    normalized.includes('already exists') ||
    normalized.includes('user_already_exists') ||
    normalized.includes('email already in use') ||
    normalized.includes('identity_already_exists')
  ) {
    return {
      message: 'An account with this email address already exists. Please log in with your credentials.',
      isWarning: false,
      isCanceled: false,
      code: 'ACCOUNT_EXISTS',
    };
  }

  // 3. Invalid credentials
  if (
    normalized.includes('invalid login credentials') ||
    normalized.includes('invalid credentials') ||
    normalized.includes('invalid_grant') ||
    normalized.includes('wrong password')
  ) {
    return {
      message: 'Incorrect email or password. Please verify your details and try again.',
      isWarning: false,
      isCanceled: false,
      code: 'INVALID_CREDENTIALS',
    };
  }

  // 4. Unverified email
  if (
    normalized.includes('email not confirmed') ||
    normalized.includes('email_not_confirmed') ||
    normalized.includes('unverified')
  ) {
    return {
      message: 'Please verify your email address before logging in. Check your inbox for the confirmation link.',
      isWarning: true,
      isCanceled: false,
      code: 'EMAIL_UNVERIFIED',
    };
  }

  // 5. Rate limiting / Too many requests
  if (
    normalized.includes('rate limit') ||
    normalized.includes('too many requests') ||
    normalized.includes('429')
  ) {
    return {
      message: 'Too many login attempts. Please wait a moment before trying again.',
      isWarning: false,
      isCanceled: false,
      code: 'RATE_LIMITED',
    };
  }

  // 6. Network or server connection failures
  if (
    normalized.includes('failed to fetch') ||
    normalized.includes('network error') ||
    normalized.includes('connection refused') ||
    normalized.includes('timeout')
  ) {
    return {
      message: 'Network connection issue. Please check your internet connection and try again.',
      isWarning: false,
      isCanceled: false,
      code: 'NETWORK_ERROR',
    };
  }

  // Fallback for general errors: preserve readable message if decent, else gentle default
  const cleanMessage =
    rawError.length > 3 && rawError.length < 120 && !rawError.includes('{')
      ? rawError
      : 'Authentication could not be completed. Please try again.';

  return {
    message: cleanMessage,
    isWarning: false,
    isCanceled: false,
  };
}

