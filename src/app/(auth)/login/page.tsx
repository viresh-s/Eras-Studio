'use client';

import { useState, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { LogIn, Mail, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { login } from '@/actions/authActions';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import SocialAuthButtons from '@/components/features/auth/SocialAuthButtons';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

function LoginFormContent() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const searchParams = useSearchParams();
  const isVerified = searchParams.get('verified') === 'true';
  const urlError = searchParams.get('error');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const router = useRouter();

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError(null);

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

  return (
    <div>
      <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgb(0,0,0,0.06)] p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Welcome Back</h1>
          <p className="text-gray-500 text-sm">Sign in to your Eras Studio account</p>
        </div>

        {isVerified && (
          <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-emerald-800 text-sm flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>Email verified successfully! Please sign in with your credentials.</span>
          </div>
        )}

        {(error || urlError) && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm">
            {error || urlError}
          </div>
        )}

        <SocialAuthButtons mode="login" onError={(err) => setError(err)} />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="relative">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <Mail className="absolute right-3 top-9 text-gray-400" size={16} />
          </div>

          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
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

          <div className="flex items-center justify-end -mt-1 mb-1">
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors underline-offset-4 hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <Button type="submit" fullWidth isLoading={isLoading}>
            <LogIn size={16} />
            Sign In
          </Button>
        </form>
      </div>

      <div className="mt-4 bg-white rounded-2xl shadow-[0_2px_20px_rgb(0,0,0,0.04)] p-4 text-center">
        <p className="text-sm text-gray-500">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-semibold text-gray-900 hover:text-accent-coral transition-colors">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center bg-white rounded-2xl">Loading...</div>}>
      <LoginFormContent />
    </Suspense>
  );
}
