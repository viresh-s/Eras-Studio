'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import Link from 'next/link';
import { MailCheck, RefreshCw, Pencil, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { resendVerificationEmail, changeVerificationEmail } from '@/actions/authActions';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { createClient } from '@/lib/supabase/client';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialEmail = searchParams.get('email') || '';
  const supabase = useMemo(() => createClient(), []);
  
  const [currentEmail, setCurrentEmail] = useState(initialEmail);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState('');
  const [isChangingEmail, setIsChangingEmail] = useState(false);

  const [countdown, setCountdown] = useState(0);
  const [attempts, setAttempts] = useState<{ timestamp: number }[]>([]);
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (initialEmail && initialEmail !== currentEmail) {
      setCurrentEmail(initialEmail);
    }
  }, [initialEmail]);

  // Listen for auth state changes (e.g., user clicks link in a new tab)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || session) {
        // When they verify, redirect to the login page with confirmation
        router.push('/login?verified=true');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  // Load state from local storage on mount to persist across reloads
  useEffect(() => {
    const stored = localStorage.getItem('resend_attempts');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Filter out attempts older than 10 minutes
        const tenMinsAgo = Date.now() - 10 * 60 * 1000;
        const validAttempts = parsed.filter((t: number) => t > tenMinsAgo);
        
        setAttempts(validAttempts.map((t: number) => ({ timestamp: t })));
        
        // Calculate remaining cooldown if last attempt was < 60s ago
        if (validAttempts.length > 0) {
          const lastAttempt = validAttempts[validAttempts.length - 1];
          const timePassed = Date.now() - lastAttempt;
          if (timePassed < 60000) {
            setCountdown(Math.ceil((60000 - timePassed) / 1000));
          }
        }
      } catch {
        // ignore
      }
    }
  }, []);

  // Countdown timer logic
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResend = async () => {
    if (!currentEmail) {
      setMessage({ type: 'error', text: 'Email address is missing. Please sign up again or enter your email.' });
      return;
    }

    if (attempts.length >= 3) {
      setMessage({ type: 'error', text: 'You can only request 3 emails every 10 minutes. Please wait.' });
      return;
    }

    setIsResending(true);
    setMessage(null);

    const result = await resendVerificationEmail(currentEmail);

    if (result.error) {
      setMessage({ type: 'error', text: result.error });
    } else {
      setMessage({ type: 'success', text: `Verification link resent to ${currentEmail}! Please check your inbox.` });
      
      const newAttempts = [...attempts, { timestamp: Date.now() }];
      setAttempts(newAttempts);
      localStorage.setItem('resend_attempts', JSON.stringify(newAttempts.map(a => a.timestamp)));
      setCountdown(60);
    }

    setIsResending(false);
  };

  const handleChangeEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmail = newEmailInput.trim();

    if (!targetEmail) {
      setMessage({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }

    if (!currentEmail) {
      setMessage({ type: 'error', text: 'Original email is missing. Please sign up with your email.' });
      return;
    }

    if (targetEmail.toLowerCase() === currentEmail.toLowerCase()) {
      setMessage({ type: 'error', text: 'The new email is identical to the current email.' });
      return;
    }

    setIsChangingEmail(true);
    setMessage(null);

    try {
      const res = await changeVerificationEmail(currentEmail, targetEmail);
      if (res.error) {
        setMessage({ type: 'error', text: res.error });
      } else if (res.success && res.newEmail) {
        setCurrentEmail(res.newEmail);
        setIsEditingEmail(false);
        router.replace(`/verify-email?email=${encodeURIComponent(res.newEmail)}`);
        setMessage({
          type: 'success',
          text: `Email updated to ${res.newEmail}! We've dispatched a fresh confirmation link to your new inbox.`,
        });
        setCountdown(60);
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update email address. Please try again.' });
    } finally {
      setIsChangingEmail(false);
    }
  };

  const isLimitReached = attempts.length >= 3;
  const isButtonDisabled = isResending || countdown > 0 || isLimitReached || !currentEmail;

  return (
    <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgb(0,0,0,0.06)] p-6 sm:p-8 text-center max-w-md mx-auto mt-12 border border-[#E8E8E3]">
      <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
        <MailCheck size={32} />
      </div>
      
      <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Check your inbox</h1>
      
      {!isEditingEmail ? (
        <>
          <p className="text-gray-500 mb-2 text-sm leading-relaxed">
            We sent a confirmation link to:
          </p>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-xs sm:text-sm font-semibold text-gray-900 mb-4 max-w-full truncate">
            <span className="truncate">{currentEmail || 'your email'}</span>
            <button
              type="button"
              onClick={() => {
                setNewEmailInput(currentEmail);
                setIsEditingEmail(true);
                setMessage(null);
              }}
              className="text-blue-600 hover:text-blue-700 underline text-xs font-medium cursor-pointer inline-flex items-center gap-1 shrink-0"
            >
              <Pencil size={12} />
              Change
            </button>
          </div>

          <p className="text-gray-500 mb-6 text-xs sm:text-sm leading-relaxed">
            Please click the link in the email to verify your account so you can sign in.
          </p>
        </>
      ) : (
        /* Change Email Form */
        <form onSubmit={handleChangeEmailSubmit} className="mb-6 p-4 rounded-xl bg-gray-50 border border-gray-200 text-left space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-900">Correct Your Email Address</span>
            <button
              type="button"
              onClick={() => {
                setIsEditingEmail(false);
                setMessage(null);
              }}
              className="text-xs text-gray-500 hover:text-gray-800"
            >
              Cancel
            </button>
          </div>

          <Input
            label="New Email Address"
            type="email"
            placeholder="you@example.com"
            value={newEmailInput}
            onChange={(e) => setNewEmailInput(e.target.value)}
            required
            autoFocus
          />

          <div className="flex items-center gap-2 pt-1">
            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={isChangingEmail}
              disabled={isChangingEmail || !newEmailInput.trim()}
            >
              Update & Resend Email
            </Button>
          </div>
        </form>
      )}

      {message && (
        <div className={`mb-6 p-3.5 rounded-xl text-xs sm:text-sm flex items-start gap-2.5 text-left ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
          {message.type === 'success' ? (
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="space-y-3">
        <Button 
          fullWidth 
          variant="secondary"
          onClick={handleResend}
          disabled={isButtonDisabled || isEditingEmail}
          isLoading={isResending}
        >
          <RefreshCw size={15} className={countdown > 0 ? "opacity-50" : ""} />
          {countdown > 0 
            ? `Resend available in ${countdown}s` 
            : isLimitReached 
              ? 'Rate limit reached (wait 10m)' 
              : 'Resend Verification Email'}
        </Button>

        <Link 
          href="/login" 
          className="block w-full py-2.5 px-4 bg-gray-900 text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-black transition-colors"
        >
          Return to Login
        </Link>
        
        <p className="text-[11px] text-gray-400 pt-1">
          Didn&apos;t receive an email? Check your spam folder or verify you entered the correct address above.
        </p>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-6 py-12">
      <div className="w-full max-w-md">
        <Suspense fallback={<div className="p-8 text-center mt-12">Loading...</div>}>
          <VerifyEmailContent />
        </Suspense>
      </div>
    </div>
  );
}
