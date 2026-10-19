'use client';

import { useState, useEffect, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { login } from '@/actions/authActions';
import { createClient } from '@/lib/supabase/client';
import { GoogleIcon } from '@/components/features/auth/SocialAuthButtons';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

function LoginFormContent() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        return Boolean(localStorage.getItem('eras_remembered_email'));
      } catch {
        return false;
      }
    }
    return false;
  });

  const searchParams = useSearchParams();
  const isVerified = searchParams.get('verified') === 'true';
  const urlError = searchParams.get('error');

  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Load remembered email into form
  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem('eras_remembered_email');
      if (savedEmail) {
        setValue('email', savedEmail);
      }
    } catch {
      // Ignore localStorage access errors
    }
  }, [setValue]);

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError(null);

    // Save or clear remembered email
    try {
      if (rememberMe) {
        localStorage.setItem('eras_remembered_email', data.email);
      } else {
        localStorage.removeItem('eras_remembered_email');
      }
    } catch {
      // Ignore localStorage access errors
    }

    const formData = new FormData();
    formData.append('email', data.email);
    formData.append('password', data.password);

    const result = await login(formData);
    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    } else if (result?.role) {
      if (result.role === 'Admin') router.push('/admin');
      else router.push('/discovery');
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const origin = window.location.origin;
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/callback?provider=google`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (oauthError) throw oauthError;
    } catch (err: unknown) {
      console.error('Google sign in error:', err);
      const message = err instanceof Error ? err.message : 'Google sign-in failed. Please try again.';
      setError(message);
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 sm:p-6 md:p-10 lg:p-12">
      <div className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 items-center">
        
        {/* Left Column: Artwork Card */}
        <div className="relative w-full aspect-[4/5] max-h-[580px] md:max-h-[640px] rounded-[24px] sm:rounded-[28px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.08)] bg-neutral-900 select-none">
          <Image
            src="/images/blue-lily-artwork.jpg"
            alt="Blue Lily Botanical Art"
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover object-center"
          />

          {/* Floating Pill Badge: exactly matching user spec */}
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

        {/* Right Column: Sign In Form & Brand */}
        <div className="w-full max-w-[390px] mx-auto flex flex-col justify-center">
          
          {/* Brand Header: ERAS */}
          <div className="text-center mb-6">
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

          {/* Main Titles: Welcome Back & Aesthete! */}
          <div className="text-center mb-8">
            <h1
              style={{
                fontFamily: "'Poppins', sans-serif",
                color: '#000000',
                fontWeight: 500,
              }}
              className="text-3xl sm:text-[34px] tracking-tight leading-tight"
            >
              Welcome Back
            </h1>
            <p
              style={{
                fontFamily: "'Century Schoolbook', 'Playfair Display', Georgia, serif",
                color: 'rgba(79.69, 79.69, 79.69, 0.75)',
                fontStyle: 'italic',
                fontWeight: 700,
              }}
              className="text-2xl sm:text-[28px] mt-0.5"
            >
              Aesthete!
            </p>
          </div>

          {/* Verification Status */}
          {isVerified && (
            <div className="mb-5 bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>Email verified successfully! Please sign in with your credentials.</span>
            </div>
          )}

          {/* Error Message */}
          {(error || urlError) && (
            <div className="mb-5 bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-xs">
              {error || urlError}
            </div>
          )}

          {/* Credentials Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email Field */}
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
                {...register('email')}
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  color: '#343434',
                }}
                className="w-full bg-transparent border-0 border-b border-[#A1A1A1] focus:border-black focus:ring-0 text-sm py-2 outline-none transition-colors"
              />
              {errors.email && (
                <p className="text-red-500 text-[11px] mt-1.5">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  color: '#929292',
                  fontWeight: 500,
                }}
                className="block text-xs mb-1"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder=""
                  {...register('password')}
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
              {errors.password && (
                <p className="text-red-500 text-[11px] mt-1.5">{errors.password.message}</p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between pt-1">
              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border border-[#CBCBCB] text-[#181A1F] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#181A1F]"
                />
                <span
                  style={{
                    fontFamily: "'Poppins', sans-serif",
                    color: '#929292',
                    fontWeight: 500,
                  }}
                  className="text-xs"
                >
                  Remember me
                </span>
              </label>
              <Link
                href="/forgot-password"
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  color: '#BDBDBD',
                  fontWeight: 500,
                }}
                className="text-xs hover:text-[#343434] transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 space-y-3">
              {/* Primary Log In Button */}
              <button
                type="submit"
                disabled={isLoading || isGoogleLoading}
                style={{
                  background: '#181A1F',
                  borderRadius: 16.22,
                  fontFamily: "'Poppins', sans-serif",
                  color: 'white',
                  fontWeight: 600,
                }}
                className="w-full h-11 sm:h-12 hover:bg-black active:scale-[0.99] text-sm transition-all duration-200 shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Logging in...</span>
                  </div>
                ) : (
                  <span>Log in</span>
                )}
              </button>

              {/* Secondary Google Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading || isGoogleLoading}
                style={{
                  background: '#F3F3F3',
                  borderRadius: 16.22,
                  fontFamily: "'Poppins', sans-serif",
                  color: '#343434',
                  fontWeight: 600,
                }}
                className="w-full h-11 sm:h-12 hover:bg-[#EAEAEA] active:scale-[0.99] text-sm transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isGoogleLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                    <span>Connecting to Google...</span>
                  </div>
                ) : (
                  <>
                    <GoogleIcon className="w-4 h-4" />
                    <span>Log in with Google</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Footer Link */}
          <div className="text-center mt-9 text-xs">
            <span
              style={{
                fontFamily: "'Poppins', sans-serif",
                color: '#929292',
                fontWeight: 500,
              }}
            >
              Don&apos;t have an account?{' '}
            </span>
            <Link
              href="/signup"
              style={{
                fontFamily: "'Poppins', sans-serif",
                color: '#343434',
                fontWeight: 700,
              }}
              className="hover:underline ml-1"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
