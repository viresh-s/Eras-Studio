'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { UserPlus, Mail, Lock, User, Phone, Palette, ShoppingBag } from 'lucide-react';
import { signup } from '@/actions/authActions';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

const signupSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  phoneNumber: z.string().min(7, 'Please enter a valid phone number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  role: z.enum(['User', 'Creator']),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords don\'t match',
  path: ['confirmPassword'],
});

type SignupForm = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      role: 'User',
    },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: SignupForm) => {
    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('email', data.email);
    formData.append('password', data.password);
    formData.append('fullName', data.fullName);
    formData.append('phoneNumber', data.phoneNumber);
    formData.append('role', data.role);

    const result = await signup(formData);
    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="border-4 border-brand-black bg-white shadow-brutal-lg p-8">
        <div className="mb-6">
          <h1 className="font-heading text-3xl font-bold mb-2">Join ERAS</h1>
          <p className="text-brand-gray">Create your account and start your journey</p>
        </div>

        {error && (
          <div className="mb-4 border-3 border-brand-red bg-red-50 p-3 text-brand-red text-sm font-medium">
            {error}
          </div>
        )}

        {/* Role Selector */}
        <div className="mb-6">
          <label className="font-heading font-semibold text-sm uppercase tracking-wide block mb-2">
            I am a...
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setValue('role', 'User')}
              className={`flex items-center justify-center gap-2 p-4 border-3 border-brand-black font-heading font-semibold transition-all ${
                selectedRole === 'User'
                  ? 'bg-brand-blue text-white shadow-brutal'
                  : 'bg-white hover:bg-brand-lightgray'
              }`}
            >
              <ShoppingBag size={20} />
              Collector
            </button>
            <button
              type="button"
              onClick={() => setValue('role', 'Creator')}
              className={`flex items-center justify-center gap-2 p-4 border-3 border-brand-black font-heading font-semibold transition-all ${
                selectedRole === 'Creator'
                  ? 'bg-brand-pink text-brand-black shadow-brutal'
                  : 'bg-white hover:bg-brand-lightgray'
              }`}
            >
              <Palette size={20} />
              Creator
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="relative">
            <Input
              label="Full Name"
              type="text"
              placeholder="Your full name"
              error={errors.fullName?.message}
              {...register('fullName')}
            />
            <User className="absolute right-3 top-9 text-brand-gray" size={18} />
          </div>

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
              label="Phone Number"
              type="tel"
              placeholder="+1 234 567 8900"
              error={errors.phoneNumber?.message}
              {...register('phoneNumber')}
            />
            <Phone className="absolute right-3 top-9 text-brand-gray" size={18} />
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

          <div className="relative">
            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />
            <Lock className="absolute right-3 top-9 text-brand-gray" size={18} />
          </div>

          <Button
            type="submit"
            fullWidth
            isLoading={isLoading}
            variant={selectedRole === 'Creator' ? 'pink' : 'blue'}
          >
            <UserPlus size={18} />
            Create Account as {selectedRole === 'Creator' ? 'Creator' : 'Collector'}
          </Button>
        </form>
      </div>

      <div className="mt-4 border-4 border-brand-black bg-brand-yellow shadow-brutal p-4 text-center">
        <p className="font-medium">
          Already have an account?{' '}
          <Link href="/login" className="font-bold underline underline-offset-4 hover:text-brand-blue">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
