'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase/client';

interface SocialAuthButtonsProps {
  mode: 'login' | 'signup';
  role?: 'User' | 'Creator';
  onError?: (error: string) => void;
}

export function GoogleIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function BehanceIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M7.747 11.233c.895-.295 1.488-1.026 1.488-2.089 0-1.874-1.464-2.871-3.66-2.871H0v11.454h5.795c2.25 0 3.844-1.077 3.844-3.178 0-1.572-.79-2.744-1.892-3.316zm-5.08-3.414h2.47c1.19 0 1.96.48 1.96 1.46 0 .977-.77 1.46-1.96 1.46H2.667V7.819zm2.748 7.375h-2.75v-3.32h2.75c1.332 0 2.2.49 2.2 1.66 0 1.17-.868 1.66-2.2 1.66zM17.848 9.54c-3.11 0-5.16 2.08-5.16 5.34 0 3.262 2.05 5.343 5.253 5.343 2.502 0 4.195-1.24 4.81-3.238h-2.453c-.347.8-1.214 1.258-2.357 1.258-1.636 0-2.62-1.03-2.72-2.673h7.62c.045-.262.068-.535.068-.813 0-3.155-1.878-5.217-5.061-5.217zm-2.617 4.298c.17-1.43 1.09-2.31 2.52-2.31 1.42 0 2.302.88 2.454 2.31h-4.974zm-.188-6.17h5.454V6.27h-5.454v1.398z" />
    </svg>
  );
}

export default function SocialAuthButtons({ mode, role = 'User', onError }: SocialAuthButtonsProps) {
  const [loadingProvider, setLoadingProvider] = useState<'google' | 'behance' | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const reportError = (message: string) => {
    setLocalError(message);
    if (onError) onError(message);
  };

  const handleOAuthSignIn = async (provider: 'google' | 'behance') => {
    setLocalError(null);
    setLoadingProvider(provider);

    try {
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }

      const origin = window.location.origin;
      const callbackUrl = role
        ? `${origin}/auth/callback?role=${encodeURIComponent(role)}&provider=${provider}`
        : `${origin}/auth/callback?provider=${provider}`;

      const oauthProvider = provider === 'google' ? 'google' : ('custom:behance' as any);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: oauthProvider,
        options: {
          redirectTo: callbackUrl,
          ...(provider === 'google'
            ? {
                queryParams: {
                  access_type: 'offline',
                  prompt: 'consent',
                },
              }
            : {}),
        },
      });

      if (error) {
        if (provider === 'behance') {
          throw new Error('Behance OAuth is pending configuration in Supabase Dashboard (Adobe IMS OAuth).');
        }
        throw error;
      }
    } catch (err: any) {
      console.error(`${provider} OAuth error:`, err);
      const msg = err.message || `${provider} sign-in failed. Please try again or use email sign-in.`;
      reportError(msg);
      setLoadingProvider(null);
    }
  };

  return (
    <div className="space-y-3">
      {localError && !onError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs">
          {localError}
        </div>
      )}

      {/* Google Button */}
      <button
        type="button"
        onClick={() => handleOAuthSignIn('google')}
        disabled={loadingProvider !== null}
        className="w-full h-11 px-4 py-2.5 rounded-xl border border-[#E8E8E3] bg-white hover:bg-[#FAF9F6] active:bg-[#F0F0EB] text-[#141413] text-sm font-medium transition-all shadow-2xs flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed group"
      >
        {loadingProvider === 'google' ? (
          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
        ) : (
          <GoogleIcon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-105" />
        )}
        <span>
          {loadingProvider === 'google'
            ? 'Connecting to Google...'
            : mode === 'signup'
            ? 'Continue with Google'
            : 'Sign in with Google'}
        </span>
      </button>

      {/* Behance Button */}
      <button
        type="button"
        onClick={() => handleOAuthSignIn('behance')}
        disabled={loadingProvider !== null}
        className="w-full h-11 px-4 py-2.5 rounded-xl border border-[#0057FF]/30 bg-[#0057FF] hover:bg-[#004BDD] active:bg-[#0040C0] text-white text-sm font-medium transition-all shadow-2xs flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed group"
      >
        {loadingProvider === 'behance' ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <BehanceIcon className="w-4 h-4 shrink-0 text-white transition-transform group-hover:scale-105" />
        )}
        <span>
          {loadingProvider === 'behance'
            ? 'Connecting to Behance...'
            : mode === 'signup'
            ? 'Continue with Behance'
            : 'Sign in with Behance'}
        </span>
      </button>

      {/* Editorial Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#E8E8E3]" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-3 text-[#8A8A85] uppercase tracking-wider font-medium select-none">
            Or continue with email
          </span>
        </div>
      </div>
    </div>
  );
}
