'use client';

import { useState, useEffect, useMemo, useRef, Suspense, memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Mail,
  Eye,
  EyeOff,
  CheckCircle2,
  ArrowLeft,
  RefreshCw,
  Lock,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { sendPasswordResetOtp, updateUserPassword } from '@/actions/authActions';

type Step = 'email' | 'otp' | 'password' | 'success';

interface ResendCountdownButtonProps {
  onResend: () => Promise<void>;
  disabled?: boolean;
}

/**
 * Isolated Countdown Button: Only this small button re-renders every 1s,
 * preventing the entire page and inputs from re-rendering!
 */
const ResendCountdownButton = memo(function ResendCountdownButton({
  onResend,
  disabled = false,
}: ResendCountdownButtonProps) {
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleClick = async () => {
    if (countdown > 0 || disabled) return;
    setCountdown(60);
    await onResend();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={countdown > 0 || disabled}
      style={{ fontFamily: "'Poppins', sans-serif" }}
      className={`transition-colors flex items-center gap-1.5 cursor-pointer ${
        countdown > 0 ? 'text-[#A1A1A1] cursor-not-allowed' : 'text-[#181A1F] hover:underline font-medium'
      }`}
    >
      <RefreshCw size={13} className={countdown > 0 ? 'opacity-40' : ''} />
      {countdown > 0 ? `Resend in ${countdown}s` : 'Resend code'}
    </button>
  );
});

interface OtpInputProps {
  value: string;
  length?: number;
  onChange: (otp: string) => void;
  onComplete?: (otp: string) => void;
  onLengthChange?: (len: number) => void;
  disabled?: boolean;
  hasError?: boolean;
}

const OtpBoxes = memo(function OtpBoxes({
  value,
  length = 8,
  onChange,
  onComplete,
  onLengthChange,
  disabled = false,
  hasError = false,
}: OtpInputProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const digits = Array.from({ length }, (_, i) => value[i] || '');

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const sanitized = rawVal.replace(/\D/g, '');

    if (!sanitized) {
      const updated = [...digits];
      updated[index] = '';
      const newOtp = updated.join('');
      onChange(newOtp);
      return;
    }

    if (sanitized.length > 1) {
      const targetLen = sanitized.length === 6 ? 6 : (sanitized.length >= 8 ? 8 : length);
      if (targetLen !== length && onLengthChange) {
        onLengthChange(targetLen);
      }
      const chars = sanitized.slice(0, targetLen).split('');
      const updated = Array.from({ length: targetLen }, (_, i) => chars[i] || '');
      const newOtp = updated.join('');
      onChange(newOtp);
      const nextFocus = Math.min(chars.length, targetLen - 1);
      setTimeout(() => inputsRef.current[nextFocus]?.focus(), 10);
      if (newOtp.length === targetLen) onComplete?.(newOtp);
      return;
    }

    const char = sanitized[sanitized.length - 1];
    const updated = [...digits];
    updated[index] = char;
    const newOtp = updated.join('');
    onChange(newOtp);

    if (index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }

    if (newOtp.length === length) {
      onComplete?.(newOtp);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        const updated = [...digits];
        updated[index - 1] = '';
        onChange(updated.join(''));
        inputsRef.current[index - 1]?.focus();
      } else if (digits[index]) {
        const updated = [...digits];
        updated[index] = '';
        onChange(updated.join(''));
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '');
    if (!pasted) return;

    const targetLen = pasted.length === 6 ? 6 : 8;
    if (targetLen !== length && onLengthChange) {
      onLengthChange(targetLen);
    }
    const chars = pasted.slice(0, targetLen).split('');
    const updated = Array.from({ length: targetLen }, (_, i) => chars[i] || '');
    const newOtp = updated.join('');
    onChange(newOtp);

    const focusIdx = Math.min(chars.length, targetLen - 1);
    setTimeout(() => inputsRef.current[focusIdx]?.focus(), 10);

    if (newOtp.length === targetLen) {
      onComplete?.(newOtp);
    }
  };

  const dividerIndex = length === 8 ? 4 : 3;

  return (
    <div className="flex items-center justify-center gap-1.5 sm:gap-2 my-3 select-none flex-nowrap overflow-x-auto py-1">
      {digits.map((digit, index) => {
        const isFilled = digit.length > 0;
        return (
          <div key={index} className="flex items-center shrink-0">
            {index === dividerIndex && (
              <span className="w-1.5 sm:w-2 h-0.5 bg-[#A1A1A1] rounded-full mx-0.5 sm:mx-1 shrink-0" />
            )}
            <input
              ref={(el) => {
                inputsRef.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              disabled={disabled}
              onChange={(e) => handleChange(index, e)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              onFocus={(e) => e.target.select()}
              aria-label={`Digit ${index + 1}`}
              style={{ fontFamily: "'Poppins', sans-serif" }}
              className={`
                ${length === 8 ? 'w-8.5 h-11 sm:w-10 sm:h-12.5 text-base sm:text-lg' : 'w-10 h-12 sm:w-11 sm:h-13 text-lg sm:text-xl'}
                text-center font-semibold shrink-0
                rounded-[12px] sm:rounded-[14px] border transition-all duration-150 outline-none
                ${
                  hasError
                    ? 'border-red-400 bg-red-50/40 text-red-700 focus:border-red-500'
                    : isFilled
                    ? 'border-[#181A1F] bg-white text-[#181A1F] shadow-2xs'
                    : 'border-[#E5E5E5] bg-white text-[#181A1F] hover:border-[#CBCBCB] focus:border-[#181A1F] focus:bg-white'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            />
          </div>
        );
      })}
    </div>
  );
});

function ForgotPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpLength, setOtpLength] = useState<number>(8);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Guard to ensure initial URL verification runs strictly once on mount
  const hasInitializedRef = useRef(false);

  // Check URL query parameters and listen for recovery events on mount
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    const code = searchParams.get('code');
    const token_hash = searchParams.get('token_hash');
    const type = searchParams.get('type');
    const errParam = searchParams.get('error');
    const errDesc = searchParams.get('error_description');

    if (errParam || errDesc) {
      setError(
        errDesc
          ? decodeURIComponent(errDesc)
          : 'Your password reset link is invalid or has expired. Please enter your email to get a new code.'
      );
      setStep('email');
      return;
    }

    // 1. If code was passed directly in query param (e.g. PKCE email redirect)
    if (code) {
      setIsLoading(true);
      supabase.auth.exchangeCodeForSession(code).then(({ data, error: exchangeError }) => {
        setIsLoading(false);
        if (!exchangeError && data?.session) {
          setStep('password');
          setInfoMessage('Email verification successful! Please enter your new password.');
        } else {
          setError('The password reset link is invalid or has expired. Please enter your email to get a new code.');
          setStep('email');
        }
      });
      return;
    }

    // 2. If token_hash was passed directly in query param
    if (token_hash && type) {
      setIsLoading(true);
      supabase.auth.verifyOtp({ token_hash, type }).then(({ data, error: verifyError }) => {
        setIsLoading(false);
        if (!verifyError && data?.session) {
          setStep('password');
          setInfoMessage('Email verification successful! Please enter your new password.');
        } else {
          setError('The password reset link is invalid or has expired. Please enter your email to get a new code.');
          setStep('email');
        }
      });
      return;
    }

    // 3. Listen ONLY for explicit PASSWORD_RECOVERY event (when Supabase client processes #access_token)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        setStep('password');
        setError(null);
        setInfoMessage('Password recovery link verified! Please enter your new password.');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Helper to obtain redirect URL for email links
  const getRedirectUrl = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/forgot-password?mode=reset`;
  };

  // STEP 1: Send Reset Link & Code
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      const result = await sendPasswordResetOtp(trimmedEmail);
      if (result.error) {
        const { error: clientError } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
          redirectTo: getRedirectUrl(),
        });
        if (clientError) {
          setError(clientError.message || result.error);
          setIsLoading(false);
          return;
        }
      }

      setInfoMessage(`We've sent password reset instructions to ${trimmedEmail}`);
      setStep('otp');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send password reset request. Please try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Resend Reset Email / Code
  const handleResendOtp = async () => {
    if (!email) return;
    setError(null);
    setIsLoading(true);

    try {
      const result = await sendPasswordResetOtp(email.trim());
      if (result.error) {
        const { error: clientError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: getRedirectUrl(),
        });
        if (clientError) {
          setError(clientError.message || result.error);
          setIsLoading(false);
          return;
        }
      }

      setInfoMessage('A new reset link and verification code have been sent to your email.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to resend. Please try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // User clicked "I clicked the email link"
  const handleCheckSessionAfterLinkClick = async () => {
    setIsCheckingSession(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setStep('password');
        setInfoMessage('Session verified! You can now set your new password.');
      } else {
        setError(
          'No active reset session detected on this browser yet. Make sure you clicked the "Reset Password" link in the email on this device. If you opened the email on another phone or browser, please open it here or enter the verification code below.'
        );
      }
    } catch {
      setError('Unable to verify session. Please click the link in your email or enter your verification code.');
    } finally {
      setIsCheckingSession(false);
    }
  };

  // STEP 2: Verify OTP code (supports 8-digit and 6-digit codes)
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setInfoMessage(null);

    const trimmedOtp = otp.trim();
    if (!trimmedOtp || trimmedOtp.length < otpLength) {
      setError(`Please enter the complete ${otpLength}-digit verification code`);
      return;
    }

    setIsLoading(true);

    try {
      let { error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: trimmedOtp,
        type: 'recovery',
      });

      if (verifyError) {
        const fallback = await supabase.auth.verifyOtp({
          email: email.trim(),
          token: trimmedOtp,
          type: 'email',
        });

        if (!fallback.error) {
          verifyError = null;
        }
      }

      if (verifyError) {
        setError(verifyError.message || 'Invalid or expired verification code. Please check your email or request a new code.');
        setIsLoading(false);
        return;
      }

      setStep('password');
      setInfoMessage('Verification successful! Now set your new password.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Verification failed. Please check the code.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 3: Update Password
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      let updated = false;
      if (session) {
        const { error: clientError } = await supabase.auth.updateUser({
          password: newPassword,
        });
        if (!clientError) {
          updated = true;
        }
      }

      if (!updated) {
        const serverResult = await updateUserPassword(newPassword);
        if (serverResult.success) {
          updated = true;
        } else if (serverResult.error) {
          if (
            serverResult.error.includes('Auth session missing') ||
            serverResult.error.includes('session missing')
          ) {
            setError(
              'Your password reset session has expired or could not be found. Please request a new reset email or enter the verification code.'
            );
            setIsLoading(false);
            return;
          }
          setError(serverResult.error);
          setIsLoading(false);
          return;
        }
      }

      if (!updated) {
        setError('Your session has expired. Please request a new password reset link.');
        setIsLoading(false);
        return;
      }

      setStep('success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred while updating your password';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{ fontFamily: "'Poppins', sans-serif" }}
      className="min-h-screen bg-white flex items-center justify-center p-4 sm:p-6 md:p-10 lg:p-12"
    >
      <div className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 items-center">
        
        {/* Left Column: Artwork Card (exact match with Sign In page) */}
        <div className="relative w-full aspect-[4/5] max-h-[580px] md:max-h-[640px] rounded-[24px] sm:rounded-[28px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.08)] bg-neutral-900 select-none">
          <Image
            src="/images/blue-lily-artwork.jpg"
            alt="Blue Lily Botanical Art"
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover object-center"
          />

          {/* Floating Pill Badge */}
          <div className="absolute bottom-6 left-6 z-10 bg-white border border-[#C7C7C7] px-4 py-1.5 sm:px-5 sm:py-2 rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.08)] flex items-center">
            <span
              style={{
                fontFamily: "'Poppins', sans-serif",
                color: '#323232',
                fontWeight: 500,
              }}
              className="text-[10px] sm:text-[11px] uppercase tracking-wider"
            >
              BLUE LILY BOTANICAL ART
            </span>
          </div>
        </div>

        {/* Right Column: Form & Brand */}
        <div className="w-full max-w-[390px] mx-auto flex flex-col justify-center">
          
          {/* Brand Header: ERAS */}
          <div className="text-center mb-2">
            <span
              style={{
                fontFamily: "'Century Schoolbook', 'Playfair Display', Georgia, serif",
                color: '#123C83',
                fontWeight: 700,
                letterSpacing: '0.04em',
              }}
              className="text-2xl sm:text-[26px] uppercase block select-none"
            >
              ERAS
            </span>
          </div>

          {/* Main Title */}
          <div className="text-center mb-6">
            <h1
              style={{
                fontFamily: "'Poppins', sans-serif",
                color: '#181A1F',
                fontWeight: 500,
              }}
              className="text-lg sm:text-[20px] tracking-tight leading-tight"
            >
              {step === 'password'
                ? 'New Password'
                : step === 'success'
                ? 'Password Reset'
                : 'Forgot Password'}
            </h1>
          </div>

          {/* Error Message */}
          {error && (
            <div
              style={{ fontFamily: "'Poppins', sans-serif" }}
              className="mb-5 bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-xs"
            >
              {error}
            </div>
          )}

          {/* Info / Success Message */}
          {infoMessage && !error && (
            <div
              style={{ fontFamily: "'Poppins', sans-serif" }}
              className="mb-5 bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-emerald-800 text-xs flex items-center gap-2"
            >
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>{infoMessage}</span>
            </div>
          )}

          {/* STEP 1: EMAIL */}
          {step === 'email' && (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  style={{
                    fontFamily: "'Poppins', sans-serif",
                    color: '#929292',
                    fontWeight: 500,
                  }}
                  className="block text-xs mb-1"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder=""
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  style={{
                    fontFamily: "'Poppins', sans-serif",
                    color: '#343434',
                  }}
                  className="w-full bg-transparent border-0 border-b border-[#A1A1A1] focus:border-black focus:ring-0 text-sm py-2 outline-none transition-colors"
                />
              </div>

              {/* Increased Size Primary Action Button with Poppins Font */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    background: '#181A1F',
                    borderRadius: 16.22,
                    fontFamily: "'Poppins', sans-serif",
                    color: 'white',
                    fontWeight: 600,
                  }}
                  className="w-full h-12 sm:h-[52px] px-6 hover:bg-black active:scale-[0.99] text-[15px] transition-all duration-200 shadow-sm flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Sending link...</span>
                    </div>
                  ) : (
                    <span>Send Reset Link & Code</span>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: OTP / VERIFICATION */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label
                  style={{
                    fontFamily: "'Poppins', sans-serif",
                    color: '#929292',
                    fontWeight: 500,
                  }}
                  className="block text-xs mb-1 text-center"
                >
                  Enter {otpLength}-Digit Verification Code
                </label>
                
                <OtpBoxes
                  value={otp}
                  length={otpLength}
                  onChange={setOtp}
                  onLengthChange={(len) => {
                    setOtpLength(len);
                  }}
                  disabled={isLoading}
                  hasError={Boolean(error)}
                />

                <div className="flex justify-center -mt-1 mb-1">
                  <button
                    type="button"
                    onClick={() => {
                      const newLen = otpLength === 8 ? 6 : 8;
                      setOtpLength(newLen);
                      setOtp('');
                      setError(null);
                    }}
                    style={{ fontFamily: "'Poppins', sans-serif" }}
                    className="text-[11px] text-[#71717A] hover:text-[#181A1F] transition-colors underline cursor-pointer"
                  >
                    {otpLength === 8 ? 'Got a 6-digit code instead? Click here' : 'Got an 8-digit code instead? Click here'}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setStep('email');
                    setError(null);
                    setOtp('');
                  }}
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                  className="text-[#8E8E88] hover:text-[#181A1F] transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft size={13} /> Change email
                </button>

                <ResendCountdownButton
                  onResend={handleResendOtp}
                  disabled={isLoading}
                />
              </div>

              {/* Increased Size Primary Action Button with Poppins Font */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading || otp.length < otpLength}
                  style={{
                    background: '#181A1F',
                    borderRadius: 16.22,
                    fontFamily: "'Poppins', sans-serif",
                    color: 'white',
                    fontWeight: 600,
                  }}
                  className="w-full h-12 sm:h-[52px] px-6 hover:bg-black active:scale-[0.99] text-[15px] transition-all duration-200 shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Verifying code...</span>
                    </div>
                  ) : (
                    <span>Verify Code & Continue</span>
                  )}
                </button>
              </div>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={handleCheckSessionAfterLinkClick}
                  disabled={isCheckingSession}
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                  className="text-xs text-[#8E8E88] hover:text-[#181A1F] transition-colors cursor-pointer"
                >
                  {isCheckingSession ? 'Checking email link...' : 'Clicked the link in your email? Set password →'}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: NEW PASSWORD */}
          {step === 'password' && (
            <form onSubmit={handleUpdatePassword} className="space-y-5">
              <div>
                <label
                  htmlFor="new-password"
                  style={{
                    fontFamily: "'Poppins', sans-serif",
                    color: '#929292',
                    fontWeight: 500,
                  }}
                  className="block text-xs mb-1"
                >
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder=""
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    autoFocus
                    style={{
                      fontFamily: "'Poppins', sans-serif",
                      color: '#343434',
                    }}
                    className="w-full bg-transparent border-0 border-b border-[#A1A1A1] focus:border-black focus:ring-0 text-sm py-2 pr-8 outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 bottom-2 text-[#343434] hover:text-black transition-colors cursor-pointer p-0.5"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirm-password"
                  style={{
                    fontFamily: "'Poppins', sans-serif",
                    color: '#929292',
                    fontWeight: 500,
                  }}
                  className="block text-xs mb-1"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder=""
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    style={{
                      fontFamily: "'Poppins', sans-serif",
                      color: '#343434',
                    }}
                    className="w-full bg-transparent border-0 border-b border-[#A1A1A1] focus:border-black focus:ring-0 text-sm py-2 pr-8 outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-0 bottom-2 text-[#343434] hover:text-black transition-colors cursor-pointer p-0.5"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Increased Size Primary Action Button with Poppins Font */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    background: '#181A1F',
                    borderRadius: 16.22,
                    fontFamily: "'Poppins', sans-serif",
                    color: 'white',
                    fontWeight: 600,
                  }}
                  className="w-full h-12 sm:h-[52px] px-6 hover:bg-black active:scale-[0.99] text-[15px] transition-all duration-200 shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving password...</span>
                    </div>
                  ) : (
                    <>
                      <Lock size={15} />
                      <span>Save New Password</span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setStep('email');
                    setError(null);
                    setInfoMessage(null);
                  }}
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                  className="text-xs text-[#8E8E88] hover:text-[#181A1F] transition-colors cursor-pointer"
                >
                  Need to request a new link? Start over
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: SUCCESS STATE */}
          {step === 'success' && (
            <div className="text-center py-4 space-y-6">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-2xs">
                <CheckCircle2 size={36} />
              </div>

              <div>
                <p
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                  className="text-[#71716D] text-xs leading-relaxed"
                >
                  Your password has been successfully updated. You can now sign in with your new credentials.
                </p>
              </div>

              {/* Increased Size Primary Action Button with Poppins Font */}
              <button
                type="button"
                onClick={() => router.push('/login')}
                style={{
                  background: '#181A1F',
                  borderRadius: 16.22,
                  fontFamily: "'Poppins', sans-serif",
                  color: 'white',
                  fontWeight: 600,
                }}
                className="w-full h-12 sm:h-[52px] px-6 hover:bg-black active:scale-[0.99] text-[15px] transition-all duration-200 shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                Sign In to Your Account
              </button>
            </div>
          )}

          {/* Footer Link (Matching Login/Signup) */}
          <div className="text-center mt-9 text-xs">
            <span
              style={{
                fontFamily: "'Poppins', sans-serif",
                color: '#929292',
                fontWeight: 500,
              }}
            >
              Remember your password?{' '}
            </span>
            <Link
              href="/login"
              style={{
                fontFamily: "'Poppins', sans-serif",
                color: '#343434',
                fontWeight: 700,
              }}
              className="hover:underline ml-1"
            >
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function ForgotPasswordLoading() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<ForgotPasswordLoading />}>
      <ForgotPasswordContent />
    </Suspense>
  );
}
