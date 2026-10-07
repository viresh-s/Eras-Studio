'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserPlus, Mail, Lock, User, Phone, Palette, ShoppingBag, Eye, EyeOff } from 'lucide-react';
import { signup } from '@/actions/authActions';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

const signupSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  phoneNumber: z.string().min(7, 'Please enter a valid phone number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords don\'t match',
  path: ['confirmPassword'],
});

type SignupForm = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  });

  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<'User' | 'Creator'>('User');

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
      if (result.role === 'Creator') router.push('/portfolio');
      else if (result.role === 'Admin') router.push('/admin');
      else router.push('/discovery');
    }
  };

  return (
    <div>
      <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgb(0,0,0,0.06)] p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Join Eras Studio</h1>
          <p className="text-gray-500 text-sm">Create your account and start your journey</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Role Selector */}
        <div className="mb-6">
          <label className="text-sm font-medium text-gray-700 block mb-2">
            I am a...
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSelectedRole('User')}
              className={`flex items-center justify-center gap-2 p-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
                selectedRole === 'User'
                  ? 'bg-blue-50 text-blue-700 ring-2 ring-blue-200'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ShoppingBag size={18} />
              Collector
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole('Creator')}
              className={`flex items-center justify-center gap-2 p-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
                selectedRole === 'Creator'
                  ? 'bg-pink-50 text-pink-700 ring-2 ring-pink-200'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Palette size={18} />
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
            <User className="absolute right-3 top-9 text-gray-400" size={16} />
          </div>

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
              label="Phone Number"
              type="tel"
              placeholder="+1 234 567 8900"
              error={errors.phoneNumber?.message}
              {...register('phoneNumber')}
            />
            <Phone className="absolute right-3 top-9 text-gray-400" size={16} />
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

          <div className="relative">
            <Input
              label="Confirm Password"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
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

          <Button
            type="submit"
            fullWidth
            isLoading={isLoading}
          >
            <UserPlus size={16} />
            Create Account as {selectedRole === 'Creator' ? 'Creator' : 'Collector'}
          </Button>
        </form>
      </div>

      <div className="mt-4 bg-white rounded-2xl shadow-[0_2px_20px_rgb(0,0,0,0.04)] p-4 text-center">
        <p className="text-sm text-gray-500">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-gray-900 hover:text-accent-coral transition-colors">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
