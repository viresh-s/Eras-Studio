'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import Link from 'next/link';
import { MailCheck, RefreshCw } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { resendVerificationEmail } from '@/actions/authActions';
import Button from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get('email');
  const supabase = useMemo(() => createClient(), []);
  
  const [countdown, setCountdown] = useState(0);
  const [attempts, setAttempts] = useState<{ timestamp: number }[]>([]);
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Listen for auth state changes (e.g., user clicks link in a new tab)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || session) {
        // When they verify, Supabase logs them in. Redirect to their dashboard!
        router.push('/login');
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
      } catch (e) {
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
    if (!email) {
      setMessage({ type: 'error', text: 'Email address is missing. Please sign up again.' });
      return;
    }

    if (attempts.length >= 3) {
      setMessage({ type: 'error', text: 'You can only request 3 emails every 10 minutes. Please wait.' });
      return;
    }

    setIsResending(true);
    setMessage(null);

    const result = await resendVerificationEmail(email);

    if (result.error) {
      // Sometimes Supabase rate limits explicitly returning an error
      setMessage({ type: 'error', text: result.error });
    } else {
      setMessage({ type: 'success', text: 'Verification email resent successfully! Check your inbox.' });
      
      const newAttempts = [...attempts, { timestamp: Date.now() }];
      setAttempts(newAttempts);
      localStorage.setItem('resend_attempts', JSON.stringify(newAttempts.map(a => a.timestamp)));
      setCountdown(60);
    }

    setIsResending(false);
  };

  const isLimitReached = attempts.length >= 3;
  const isButtonDisabled = isResending || countdown > 0 || isLimitReached || !email;

  return (
    <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgb(0,0,0,0.06)] p-8 text-center max-w-md mx-auto mt-12">
      <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
        <MailCheck size={32} />
      </div>
      
      <h1 className="text-2xl font-extrabold text-gray-900 mb-3">Check your inbox</h1>
      
      <p className="text-gray-500 mb-6">
        We sent a confirmation link to <strong className="text-gray-900">{email || 'your email'}</strong>. Please click the link to verify your account so you can log in!
      </p>

      {message && (
        <div className={`mb-6 p-3 rounded-xl text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      <div className="space-y-4">
        <Button 
          fullWidth 
          variant="secondary"
          onClick={handleResend}
          disabled={isButtonDisabled}
          isLoading={isResending}
        >
          <RefreshCw size={16} className={countdown > 0 ? "opacity-50" : ""} />
          {countdown > 0 
            ? `Resend available in ${countdown}s` 
            : isLimitReached 
              ? 'Rate limit reached (wait 10m)' 
              : 'Resend Verification Email'}
        </Button>

        <Link 
          href="/login" 
          className="block w-full py-3 px-4 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors"
        >
          Return to Login
        </Link>
        
        <p className="text-xs text-gray-400 pt-2">
          Didn't receive an email? Check your spam folder or ensure you used a real email address.
        </p>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center mt-12">Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
