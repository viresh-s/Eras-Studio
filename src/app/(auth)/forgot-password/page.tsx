'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, KeyRound, Lock, Eye, EyeOff, CheckCircle2, ArrowLeft, RefreshCw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { sendPasswordResetOtp } from '@/actions/authActions';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

type Step = 'email' | 'otp' | 'password' | 'success';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  
  const [countdown, setCountdown] = useState(0);

  // Listen for Supabase password recovery events (in case user clicked email link directly)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setStep('password');
        setError(null);
        setInfoMessage('Authentication verified. Please enter your new password.');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Resend countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // STEP 1: Send OTP to Email
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
      // Call server action first
      const result = await sendPasswordResetOtp(trimmedEmail);
      if (result.error) {
        // Fallback to client SDK if server action fails
        const { error: clientError } = await supabase.auth.resetPasswordForEmail(trimmedEmail);
        if (clientError) {
          setError(clientError.message || result.error);
          setIsLoading(false);
          return;
        }
      }

      setCountdown(60);
      setInfoMessage(`We've sent a 6-digit verification code to ${trimmedEmail}`);
      setStep('otp');
    } catch (err: any) {
      setError(err?.message || 'Failed to send verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (countdown > 0 || !email) return;
    setError(null);
    setIsLoading(true);

    try {
      const result = await sendPasswordResetOtp(email.trim());
      if (result.error) {
        const { error: clientError } = await supabase.auth.resetPasswordForEmail(email.trim());
        if (clientError) {
          setError(clientError.message || result.error);
          setIsLoading(false);
          return;
        }
      }

      setCountdown(60);
      setInfoMessage('A new verification code has been dispatched to your email.');
    } catch (err: any) {
      setError(err?.message || 'Failed to resend code');
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
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

      // 2. Fallback to 'email' type if project email template was configured as magic link / email OTP
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
        setError(verifyError.message || 'Invalid or expired verification code. Please try again.');
        setIsLoading(false);
        return;
      }

      // Success, move to Step 3
      setStep('password');
      setInfoMessage('Verification successful. Now set your new password.');
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
      <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgb(0,0,0,0.06)] p-8">
        
        {/* Step Indicator Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className={`w-2.5 h-2.5 rounded-full ${step === 'email' ? 'bg-[#141413]' : 'bg-gray-300'}`} />
            <span className={`w-2.5 h-2.5 rounded-full ${step === 'otp' ? 'bg-[#141413]' : 'bg-gray-300'}`} />
            <span className={`w-2.5 h-2.5 rounded-full ${step === 'password' ? 'bg-[#141413]' : 'bg-gray-300'}`} />
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest ml-1">
              {step === 'email' && 'Step 1 of 3: Identify'}
              {step === 'otp' && 'Step 2 of 3: Verify OTP'}
              {step === 'password' && 'Step 3 of 3: New Password'}
              {step === 'success' && 'Complete'}
            </span>
          </div>

          <h1 className="text-2xl font-extrabold text-gray-900 mb-1 font-serif">
            {step === 'email' && 'Reset your password'}
            {step === 'otp' && 'Enter verification code'}
            {step === 'password' && 'Set a new password'}
            {step === 'success' && 'Password updated!'}
          </h1>
          <p className="text-gray-500 text-sm">
            {step === 'email' && 'Enter your registered email and we will send you an OTP code.'}
            {step === 'otp' && `Enter the 6-digit OTP code sent to ${email}`}
            {step === 'password' && 'Your identity has been verified. Choose a strong new password.'}
            {step === 'success' && 'Your password has been changed. You can now sign in.'}
          </p>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-5 bg-red-50 border border-red-200 rounded-xl p-3.5 text-red-600 text-sm flex items-start gap-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {infoMessage && !error && (
          <div className="mb-5 bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-emerald-800 text-sm flex items-start gap-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
            <span>{infoMessage}</span>
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
              />
              <Mail className="absolute right-3 top-9 text-gray-400" size={16} />
            </div>

            <Button type="submit" fullWidth isLoading={isLoading}>
              <KeyRound size={16} />
              Send Verification Code
            </Button>
          </form>
        )}

        {/* STEP 2 FORM: OTP CODE */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="relative">
              <Input
                label="6-Digit Verification Code"
                type="text"
                maxLength={8}
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\s+/g, ''))}
                required
                autoFocus
                className="text-center text-lg tracking-[0.3em] font-mono font-bold"
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
                {countdown > 0 ? `Resend in ${countdown}s` : 'Resend code'}
              </button>
            </div>

            <Button type="submit" fullWidth isLoading={isLoading}>
              Verify Code & Continue
            </Button>
          </form>
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
              Update Password
            </Button>
          </form>
        )}

        {/* STEP 4: SUCCESS STATE */}
        {step === 'success' && (
          <div className="text-center py-4 space-y-6">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={36} />
            </div>

            <div>
              <p className="text-gray-600 text-sm">
                Your password has been successfully updated. You can now log into your account with your new credentials.
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
