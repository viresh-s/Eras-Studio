'use client';

import { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Mail,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { sendPasswordResetOtp } from '@/actions/authActions';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

type Step = 'email' | 'otp' | 'password' | 'success';

interface OtpInputProps {
  value: string;
  onChange: (otp: string) => void;
  onComplete?: (otp: string) => void;
  disabled?: boolean;
  hasError?: boolean;
}

/**
 * High-end 6-Box OTP Input Component
 * Features: auto-advance, backspace navigation, paste handling, arrow keys, numeric mobile keypad
 */
function OtpBoxes({
  value,
  onChange,
  onComplete,
  disabled = false,
  hasError = false,
}: OtpInputProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Array of 6 single-digit strings
  const digits = Array.from({ length: 6 }, (_, i) => value[i] || '');

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const sanitized = rawVal.replace(/\D/g, '');

    if (!sanitized) {
      // Clear this digit
      const updated = [...digits];
      updated[index] = '';
      const newOtp = updated.join('');
      onChange(newOtp);
      return;
    }

    // If multiple characters typed or autofilled
    if (sanitized.length > 1) {
      const chars = sanitized.slice(0, 6).split('');
      const updated = [...digits];
      for (let i = 0; i < chars.length && index + i < 6; i++) {
        updated[index + i] = chars[i];
      }
      const newOtp = updated.join('');
      onChange(newOtp);
      const nextFocus = Math.min(index + chars.length, 5);
      inputsRef.current[nextFocus]?.focus();
      if (newOtp.length === 6) onComplete?.(newOtp);
      return;
    }

    // Single digit input
    const char = sanitized[sanitized.length - 1];
    const updated = [...digits];
    updated[index] = char;
    const newOtp = updated.join('');
    onChange(newOtp);

    // Auto-advance to next box
    if (index < 5) {
      inputsRef.current[index + 1]?.focus();
    }

    if (newOtp.length === 6) {
      onComplete?.(newOtp);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        // Move focus backward and delete
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
    } else if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault();
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const chars = pasted.split('');
    const updated = Array.from({ length: 6 }, (_, i) => chars[i] || '');
    const newOtp = updated.join('');
    onChange(newOtp);

    const focusIdx = Math.min(chars.length, 5);
    inputsRef.current[focusIdx]?.focus();

    if (newOtp.length === 6) {
      onComplete?.(newOtp);
    }
  };

  return (
    <div className="flex items-center justify-center gap-1.5 sm:gap-2.5 my-3 select-none">
      {digits.map((digit, index) => {
        const isFilled = digit.length > 0;
        return (
          <div key={index} className="flex items-center">
            {index === 3 && (
              <span className="w-2 sm:w-3 h-0.5 bg-gray-300 rounded-full mx-1 sm:mx-1.5" />
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
              autoFocus={index === 0}
              aria-label={`Digit ${index + 1}`}
              className={`
                w-10 h-13 sm:w-12 sm:h-14
                text-center text-xl sm:text-2xl font-bold font-mono
                rounded-xl border-2 transition-all duration-150 outline-none
                ${
                  hasError
                    ? 'border-red-400 bg-red-50/50 text-red-700 focus:border-red-500 focus:ring-4 focus:ring-red-100'
                    : isFilled
                    ? 'border-[#141413] bg-white text-gray-900 shadow-sm focus:ring-4 focus:ring-gray-900/10'
                    : 'border-gray-200 bg-gray-50/70 text-gray-900 hover:border-gray-300 focus:border-[#141413] focus:bg-white focus:ring-4 focus:ring-gray-900/10'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            />
          </div>
        );
      })}
    </div>
  );
}

function ForgotPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const [countdown, setCountdown] = useState(0);

  // Check URL query parameters and hash fragments on mount
  useEffect(() => {
    const mode = searchParams.get('mode');
    const type = searchParams.get('type');
    const errDesc = searchParams.get('error_description');

    if (errDesc) {
      setError(decodeURIComponent(errDesc));
      return;
    }

    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    const isRecoveryHash = hash.includes('type=recovery') || hash.includes('access_token');
    const isRecoveryQuery = mode === 'reset' || type === 'recovery';

    if (isRecoveryQuery || isRecoveryHash) {
      setStep('password');
      setInfoMessage('Email verified successfully! Please enter your new password.');
    }

    // Verify session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && (isRecoveryQuery || isRecoveryHash)) {
        setStep('password');
      }
    });

    // Listen for Supabase password recovery events (e.g. from hash token exchange)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setStep('password');
        setError(null);
        setInfoMessage('Authentication verified. Please enter your new password.');
      } else if (event === 'SIGNED_IN' && (isRecoveryQuery || isRecoveryHash)) {
        setStep('password');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [searchParams, supabase]);

  // While waiting on the OTP step, auto-detect if the user clicked the reset link in another tab
  useEffect(() => {
    if (step !== 'otp') return;

    const interval = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setStep('password');
        setInfoMessage('Email link verified! You can now set your new password.');
        clearInterval(interval);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [step, supabase]);

  // Resend countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Helper to obtain redirect URL for email links
  const getRedirectUrl = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/auth/callback?next=/forgot-password?mode=reset`;
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
      // 1. Try server action
      const result = await sendPasswordResetOtp(trimmedEmail);
      if (result.error) {
        // Fallback to client SDK if server action fails
        const { error: clientError } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
          redirectTo: getRedirectUrl(),
        });
        if (clientError) {
          setError(clientError.message || result.error);
          setIsLoading(false);
          return;
        }
      }

      setCountdown(60);
      setInfoMessage(`We've dispatched password reset instructions to ${trimmedEmail}`);
      setStep('otp');
    } catch (err: any) {
      setError(err?.message || 'Failed to send password reset request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend Reset Email / Code
  const handleResendOtp = async () => {
    if (countdown > 0 || !email) return;
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

      setCountdown(60);
      setInfoMessage('A new reset link and verification code have been dispatched to your email.');
    } catch (err: any) {
      setError(err?.message || 'Failed to resend. Please try again.');
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
          'No active reset session detected yet. Please ensure you clicked the "Reset Password" link in the email sent to your inbox, or enter the 6-digit code below.'
        );
      }
    } catch {
      setError('Unable to verify session. Please click the link in your email or enter the 6-digit code.');
    } finally {
      setIsCheckingSession(false);
    }
  };

  // STEP 2: Verify 6-digit OTP code
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setInfoMessage(null);

    const trimmedOtp = otp.trim();
    if (!trimmedOtp || trimmedOtp.length < 6) {
      setError('Please enter the complete 6-digit verification code');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Try 'recovery' type
      let { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: trimmedOtp,
        type: 'recovery',
      });

      // 2. Fallback to 'email' type if template was configured as magic link / email OTP
      if (verifyError) {
        const fallback = await supabase.auth.verifyOtp({
          email: email.trim(),
          token: trimmedOtp,
          type: 'email',
        });

        if (!fallback.error) {
          verifyError = null;
          data = fallback.data;
        }
      }

      if (verifyError) {
        setError(verifyError.message || 'Invalid or expired verification code. Please check your email or request a new code.');
        setIsLoading(false);
        return;
      }

      // Success, move to Step 3
      setStep('password');
      setInfoMessage('Verification successful! Now set your new password.');
    } catch (err: any) {
      setError(err?.message || 'Verification failed. Please check the code.');
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
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setError(updateError.message || 'Failed to update password');
        setIsLoading(false);
        return;
      }

      // Successfully updated!
      setStep('success');
    } catch (err: any) {
      setError(err?.message || 'An error occurred while updating your password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgb(0,0,0,0.06)] p-6 sm:p-8">
        
        {/* Step Indicator Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className={`w-2.5 h-2.5 rounded-full transition-colors ${step === 'email' ? 'bg-[#141413]' : 'bg-gray-300'}`} />
            <span className={`w-2.5 h-2.5 rounded-full transition-colors ${step === 'otp' ? 'bg-[#141413]' : 'bg-gray-300'}`} />
            <span className={`w-2.5 h-2.5 rounded-full transition-colors ${step === 'password' ? 'bg-[#141413]' : 'bg-gray-300'}`} />
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest ml-1">
              {step === 'email' && 'Step 1 of 3: Identify'}
              {step === 'otp' && 'Step 2 of 3: Verification'}
              {step === 'password' && 'Step 3 of 3: New Password'}
              {step === 'success' && 'Complete'}
            </span>
          </div>

          <h1 className="text-2xl font-extrabold text-gray-900 mb-1 font-serif">
            {step === 'email' && 'Reset your password'}
            {step === 'otp' && 'Check your email'}
            {step === 'password' && 'Set a new password'}
            {step === 'success' && 'Password updated!'}
          </h1>
          <p className="text-gray-500 text-sm">
            {step === 'email' && 'Enter your registered email and we will send you a reset link and verification code.'}
            {step === 'otp' && `Instructions dispatched to ${email}`}
            {step === 'password' && 'Your identity has been verified. Choose a strong new password.'}
            {step === 'success' && 'Your password has been changed. You can now sign in.'}
          </p>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-5 bg-red-50 border border-red-200 rounded-xl p-3.5 text-red-600 text-sm flex items-start gap-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {infoMessage && !error && (
          <div className="mb-5 bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-emerald-800 text-sm flex items-start gap-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
            <span className="leading-snug">{infoMessage}</span>
          </div>
        )}

        {/* STEP 1 FORM: EMAIL */}
        {step === 'email' && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="relative">
              <Input
                label="Registered Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
              <Mail className="absolute right-3 top-9 text-gray-400" size={16} />
            </div>

            <Button type="submit" fullWidth isLoading={isLoading}>
              <KeyRound size={16} />
              Send Reset Link & Code
            </Button>
          </form>
        )}

        {/* STEP 2 FORM: OTP CODE OR LINK CLICK */}
        {step === 'otp' && (
          <div className="space-y-5">
            
            {/* Primary Guidance Card: Email Reset Link */}
            <div className="bg-gradient-to-br from-amber-50/90 to-orange-50/50 border border-amber-200/90 rounded-2xl p-4 sm:p-5 text-amber-950 shadow-sm">
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100/90 text-amber-900 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                  <Mail size={18} />
                </div>
                <div className="space-y-2 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-900">
                      Option 1: Click Link in Email
                    </h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-200/70 text-amber-900 px-2 py-0.5 rounded-full">
                      Recommended
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Supabase sent a direct reset link to <strong className="text-gray-900 font-semibold">{email}</strong>. Open your email and click the button or link to proceed immediately without entering a code.
                  </p>
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={handleCheckSessionAfterLinkClick}
                      disabled={isCheckingSession}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-900 bg-white hover:bg-gray-50 border border-amber-300 shadow-sm rounded-lg px-3 py-1.5 transition-all"
                    >
                      {isCheckingSession ? (
                        <>
                          <RefreshCw size={12} className="animate-spin text-gray-600" />
                          Checking reset link...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={13} className="text-emerald-600" />
                          I clicked the link — Set New Password →
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Subtle Divider */}
            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-gray-400 font-semibold tracking-wider text-[11px]">
                  Or Option 2: Enter 6-Digit Code
                </span>
              </div>
            </div>

            {/* 6-Box OTP Entry */}
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1 text-center">
                  If your email includes a 6-digit code, enter it here:
                </label>
                
                <OtpBoxes
                  value={otp}
                  onChange={setOtp}
                  onComplete={() => {
                    // Smooth auto-submit feel when user fills all 6 digits
                  }}
                  disabled={isLoading}
                  hasError={Boolean(error)}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setStep('email');
                    setError(null);
                    setOtp('');
                  }}
                  className="text-gray-500 hover:text-gray-900 transition-colors font-medium flex items-center gap-1"
                >
                  <ArrowLeft size={13} /> Change email
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={countdown > 0 || isLoading}
                  className={`font-semibold transition-colors flex items-center gap-1.5 ${
                    countdown > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-[#141413] hover:underline'
                  }`}
                >
                  <RefreshCw size={13} className={countdown > 0 ? 'opacity-40' : ''} />
                  {countdown > 0 ? `Resend in ${countdown}s` : 'Resend email / code'}
                </button>
              </div>

              <Button
                type="submit"
                fullWidth
                isLoading={isLoading}
                disabled={otp.length < 6}
              >
                Verify Code & Set New Password
              </Button>
            </form>
          </div>
        )}

        {/* STEP 3 FORM: NEW PASSWORD */}
        {step === 'password' && (
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="relative">
              <Input
                label="New Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <div className="relative">
              <Input
                label="Confirm New Password"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 transition-colors"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <Button type="submit" fullWidth isLoading={isLoading}>
              <Lock size={16} />
              Save New Password
            </Button>
          </form>
        )}

        {/* STEP 4: SUCCESS STATE */}
        {step === 'success' && (
          <div className="text-center py-4 space-y-6">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 size={36} />
            </div>

            <div>
              <p className="text-gray-600 text-sm">
                Your password has been successfully updated. You can now sign in with your new credentials.
              </p>
            </div>

            <Button
              type="button"
              fullWidth
              onClick={() => router.push('/login')}
            >
              Sign In to Your Account
            </Button>
          </div>
        )}

      </div>

      {/* Footer Navigation */}
      <div className="mt-4 bg-white rounded-2xl shadow-[0_2px_20px_rgb(0,0,0,0.04)] p-4 text-center">
        <p className="text-sm text-gray-500">
          Remembered your password?{' '}
          <Link href="/login" className="font-semibold text-gray-900 hover:text-gray-700 transition-colors">
            Return to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

function ForgotPasswordLoading() {
  return (
    <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgb(0,0,0,0.06)] p-8 text-center animate-pulse">
      <div className="w-10 h-10 bg-gray-200 rounded-full mx-auto mb-4" />
      <div className="h-6 bg-gray-200 rounded w-48 mx-auto mb-2" />
      <div className="h-4 bg-gray-100 rounded w-64 mx-auto" />
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
