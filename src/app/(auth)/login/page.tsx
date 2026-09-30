'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogIn, Mail, Lock } from 'lucide-react';
import { login } from '@/actions/authActions';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
      if (result.role === 'Creator') router.push('/portfolio');
      else if (result.role === 'Admin') router.push('/admin');
      else router.push('/user');
    }
  };

  return (
    <div>
      <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgb(0,0,0,0.06)] p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Welcome Back</h1>
          <p className="text-gray-500 text-sm">Sign in to your Eras Studio account</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm">
            {error}
          </div>
        )}

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
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />
            <Lock className="absolute right-3 top-9 text-gray-400" size={16} />
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
