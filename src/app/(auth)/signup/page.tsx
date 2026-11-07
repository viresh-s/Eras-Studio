'use client';

import { useState, useEffect, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, AlertCircle, X } from 'lucide-react';
import { signup } from '@/actions/authActions';
import { createClient } from '@/lib/supabase/client';
import { GoogleIcon } from '@/components/features/auth/SocialAuthButtons';
import { formatAuthError } from '@/lib/authErrorHandling';

const signupSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phoneNumber: z.string().min(7, 'Please enter a valid phone number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type SignupForm = z.infer<typeof signupSchema>;

function SignupFormContent() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'Creator' | 'User'>('Creator');

  const searchParams = useSearchParams();
  const urlError = searchParams.get('error');

  const rawError = error || urlError;
  const formattedError = formatAuthError(rawError);

  // Capture OAuth error from URL hash (e.g., #error=access_denied&error_description=...)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.replace(/^#/, '');
      const hashParams = new URLSearchParams(hash);
      const hashError = hashParams.get('error_description') || hashParams.get('error');
      if (hashError) {
        setError(hashError);
        window.history.replaceState({}, '', window.location.pathname + window.location.search);
      }
    }
  }, []);

  const handleClearError = () => {
    setError(null);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('error');
      url.searchParams.delete('error_description');
      url.searchParams.delete('error_code');
      window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
    }
  };

  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phoneNumber: '',
      password: '',
    },
  });

  const onSubmit = async (data: SignupForm) => {
    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('email', data.email);
    formData.append('password', data.password);
    formData.append('fullName', data.fullName);
    formData.append('phoneNumber', data.phoneNumber);
    formData.append('role', selectedRole);

    const result = await signup(formData);
    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    } else if (result?.requireEmailVerification) {
      router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
    } else if (result?.role) {
      if (result.role === 'Admin') router.push('/admin');
      else router.push('/discovery');
    }
  };

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const origin = window.location.origin;
      const callbackUrl = `${origin}/auth/callback?role=${encodeURIComponent(selectedRole)}&provider=google&source=signup`;

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (oauthError) throw oauthError;
    } catch (err: unknown) {
      console.error('Google sign up error:', err);
      const message = err instanceof Error ? err.message : 'Google sign-up failed. Please try again.';
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
            src="/images/cobalt-floral-artwork.jpg"
            alt="Cobalt Floral Art"
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover object-center"
          />

          {/* Floating Pill Badge: COBALT FLORAL ART */}
          <div className="absolute bottom-6 left-6 z-10 bg-white border border-black/30 px-4 py-1.5 sm:px-5 sm:py-2 rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.08)] flex items-center">
            <span
              style={{
                fontFamily: "'Poppins', sans-serif",
                color: '#323232',
                fontWeight: 500,
              }}
              className="text-[10px] sm:text-[11px] uppercase tracking-wider"
            >
              COBALT FLORAL ART
            </span>
          </div>
        </div>

        {/* Right Column: Sign Up Form & Brand */}
        <div className="w-full max-w-[390px] mx-auto flex flex-col justify-center">
          
          {/* Brand Header: ERAS */}
          <div className="text-center mb-1 flex justify-center">
            <Link href="/" className="hover:opacity-90 transition-opacity inline-flex items-center">
              <Image
                src="/images/eras-logo.png"
                alt="ERAS"
                width={120}
                height={38}
                className="h-8 w-auto object-contain select-none"
                priority
              />
            </Link>
          </div>

          {/* Subtitle: Pick a side */}
          <div className="text-center mb-3">
            <span
              style={{
                fontFamily: "'Century Schoolbook', Century, 'TeX Gyre Schola', Georgia, serif",
                color: '#343434',
                fontStyle: 'italic',
                fontWeight: 700,
              }}
              className="text-xl sm:text-[24px] inline-block"
            >
              Pick a side
            </span>
          </div>

          {/* User & Creator Selection Box below it */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center bg-[#F3F3F3] p-1 rounded-[9px] border border-gray-200/40">
              <button
                type="button"
                onClick={() => setSelectedRole('Creator')}
                style={{
                  fontFamily: "'Poppins', sans-serif",
                }}
                className={`px-4 py-1.5 rounded-[6px] text-xs transition-all cursor-pointer ${
                  selectedRole === 'Creator'
                    ? 'bg-white text-gray-900 font-semibold shadow-xs'
                    : 'text-[#6E6E69] hover:text-gray-900 font-medium'
                }`}
              >
                Creator
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('User')}
                style={{
                  fontFamily: "'Poppins', sans-serif",
                }}
                className={`px-4 py-1.5 rounded-[6px] text-xs transition-all cursor-pointer ${
                  selectedRole === 'User'
                    ? 'bg-white text-gray-900 font-semibold shadow-xs'
                    : 'text-[#6E6E69] hover:text-gray-900 font-medium'
                }`}
              >
                User
              </button>
            </div>
          </div>

          {/* Error / Cancellation Feedback */}
          {formattedError && (
            formattedError.isWarning ? (
              <div className="mb-5 bg-amber-50/90 border border-amber-200/80 rounded-xl p-3 text-amber-900 text-xs flex items-center justify-between gap-2 shadow-2xs">
                <div className="flex items-center gap-2">
                  <AlertCircle size={15} className="text-amber-600 shrink-0" />
                  <span>{formattedError.message}</span>
                </div>
                <button
                  type="button"
                  onClick={handleClearError}
                  className="text-amber-600 hover:text-amber-900 p-0.5 rounded-md hover:bg-amber-100/70 transition-colors shrink-0"
                  aria-label="Dismiss notice"
                >
                  <X size={13} />
                </button>
              </div>
            ) : (
              <div className="mb-5 bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertCircle size={15} className="text-red-600 shrink-0" />
                  <span>{formattedError.message}</span>
                </div>
                <button
                  type="button"
                  onClick={handleClearError}
                  className="text-red-500 hover:text-red-800 p-0.5 rounded-md hover:bg-red-100 transition-colors shrink-0"
                  aria-label="Dismiss error"
                >
                  <X size={13} />
                </button>
              </div>
            )
          )}

          {/* Form Fields */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Full Name */}
            <div>
              <label
                htmlFor="fullName"
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  color: '#929292',
                  fontWeight: 500,
                }}
                className="block text-xs mb-1"
              >
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                autoComplete="name"
                placeholder=""
                {...register('fullName')}
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  color: '#343434',
                }}
                className="w-full bg-transparent border-0 border-b border-[#A1A1A1] focus:border-black focus:ring-0 text-sm py-1.5 outline-none transition-colors"
              />
              {errors.fullName && (
                <p className="text-red-500 text-[11px] mt-1">{errors.fullName.message}</p>
              )}
            </div>

            {/* Email Id */}
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
                Email Id
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
                className="w-full bg-transparent border-0 border-b border-[#A1A1A1] focus:border-black focus:ring-0 text-sm py-1.5 outline-none transition-colors"
              />
              {errors.email && (
                <p className="text-red-500 text-[11px] mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label
                htmlFor="phoneNumber"
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  color: '#929292',
                  fontWeight: 500,
                }}
                className="block text-xs mb-1"
              >
                Phone Number
              </label>
              <input
                id="phoneNumber"
                type="tel"
                autoComplete="tel"
                placeholder=""
                {...register('phoneNumber')}
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  color: '#343434',
                }}
                className="w-full bg-transparent border-0 border-b border-[#A1A1A1] focus:border-black focus:ring-0 text-sm py-1.5 outline-none transition-colors"
              />
              {errors.phoneNumber && (
                <p className="text-red-500 text-[11px] mt-1">{errors.phoneNumber.message}</p>
              )}
            </div>

            {/* Password */}
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
                  autoComplete="new-password"
                  placeholder=""
                  {...register('password')}
                  style={{
                    fontFamily: "'Poppins', sans-serif",
                    color: '#343434',
                  }}
                  className="w-full bg-transparent border-0 border-b border-[#A1A1A1] focus:border-black focus:ring-0 text-sm py-1.5 pr-8 outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 bottom-1.5 text-[#343434] hover:text-black transition-colors cursor-pointer p-0.5"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-[11px] mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-3 space-y-3">
              {/* Primary Create Account Button */}
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
                    <span>Creating account...</span>
                  </div>
                ) : (
                  <span>Create account</span>
                )}
              </button>

              {/* Secondary Google Button */}
              <button
                type="button"
                onClick={handleGoogleSignUp}
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
                    <span>Sign up with Google</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Footer Link */}
          <div className="text-center mt-8 text-xs">
            <span
              style={{
                fontFamily: "'Poppins', sans-serif",
                color: '#929292',
                fontWeight: 500,
              }}
            >
              Already have an account?{' '}
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
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SignupFormContent />
    </Suspense>
  );
}
