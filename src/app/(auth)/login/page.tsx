'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
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
    }
  };

  return (
    <div>
      <div className="border-4 border-brand-black bg-white shadow-brutal-lg p-8">
        <div className="mb-6">
          <h1 className="font-heading text-3xl font-bold mb-2">Welcome Back</h1>
          <p className="text-brand-gray">Sign in to your ERAS account</p>
        </div>

        {error && (
          <div className="mb-4 border-3 border-brand-red bg-red-50 p-3 text-brand-red text-sm font-medium">
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
            <Mail className="absolute right-3 top-9 text-brand-gray" size={18} />
          </div>

          <div className="relative">
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />
            <Lock className="absolute right-3 top-9 text-brand-gray" size={18} />
          </div>

          <Button type="submit" fullWidth isLoading={isLoading}>
            <LogIn size={18} />
            Sign In
          </Button>
        </form>
      </div>

      <div className="mt-4 border-4 border-brand-black bg-brand-pink shadow-brutal p-4 text-center">
        <p className="font-medium">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-bold underline underline-offset-4 hover:text-brand-blue">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
