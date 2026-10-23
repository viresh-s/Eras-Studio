'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { changeEmail, changePassword, deleteAccount } from '@/actions/accountActions';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import {
  Mail,
  Lock,
  Shield,
  ShieldCheck,
  AlertTriangle,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Calendar,
  Sparkles,
  Check,
  ArrowRight,
  Fingerprint,
} from 'lucide-react';

interface AccountSettingsFormProps {
  currentEmail: string;
  userProfile?: {
    id?: string;
    full_name?: string | null;
    profile_pic_url?: string | null;
    role?: string | null;
    created_at?: string | null;
    is_premium?: boolean | null;
  } | null;
  userCreatedAt?: string | null;
}

export default function AccountSettingsForm({
  currentEmail,
  userProfile,
  userCreatedAt,
}: AccountSettingsFormProps) {
  // Email states
  const [newEmail, setNewEmail] = useState('');
  const [emailSubmitting, setEmailSubmitting] = useState(false);
  const [emailState, setEmailState] = useState<{ success?: string; error?: string } | null>(null);

  // Password states
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [passwordState, setPasswordState] = useState<{ success?: string; error?: string } | null>(null);

  // Delete states
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteState, setDeleteState] = useState<{ error?: string } | null>(null);

  // Active navigation section
  const [activeTab, setActiveTab] = useState<'credentials' | 'password' | 'security' | 'danger'>('credentials');

  // Format creation date
  const memberSince = (() => {
    const rawDate = userCreatedAt || userProfile?.created_at;
    if (!rawDate) return 'Active Member';
    try {
      const date = new Date(rawDate);
      return `Member since ${date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
    } catch {
      return 'Active Member';
    }
  })();

  // Live password validation
  const passwordLengthOk = password.length >= 6;
  const passwordsMatch = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;

  // Handle email submission
  const handleEmailChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setEmailState(null);

    if (!newEmail.trim() || newEmail.trim().toLowerCase() === currentEmail.toLowerCase()) {
      setEmailState({ error: 'Please enter a different, valid email address.' });
      return;
    }

    setEmailSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      const result = await changeEmail(formData);
      setEmailState(result);
      if (result.success) {
        setNewEmail('');
      }
    } catch (err: any) {
      setEmailState({ error: err.message || 'Unable to update email. Please try again.' });
    } finally {
      setEmailSubmitting(false);
    }
  };

  // Handle password submission
  const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordState(null);

    if (password.length < 6) {
      setPasswordState({ error: 'Password must be at least 6 characters long.' });
      return;
    }

    if (password !== confirmPassword) {
      setPasswordState({ error: 'Passwords do not match.' });
      return;
    }

    setPasswordSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      const result = await changePassword(formData);
      setPasswordState(result);
      if (result.success) {
        setPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setPasswordState({ error: err.message || 'Unable to update password. Please try again.' });
    } finally {
      setPasswordSubmitting(false);
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setDeleteState(null);

    if (!deletePassword) {
      setDeleteState({ error: 'Please enter your current password to confirm account deletion.' });
      return;
    }

    setDeleteSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      const result = await deleteAccount(formData);
      if (result?.error) {
        setDeleteState(result);
        setDeleteSubmitting(false);
      }
    } catch (err: any) {
      setDeleteState({ error: err.message || 'Failed to process account deletion.' });
      setDeleteSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column: Account Profile & Navigation Sidebar */}
      <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl p-6 border border-[#E8E8E3] shadow-xs">
          <div className="flex items-center gap-4">
            <div className="relative w-14 h-14 rounded-full overflow-hidden bg-[#F5F5F5] border border-[#E8E8E3] flex items-center justify-center text-[#141413] font-serif font-bold text-lg shrink-0">
              {userProfile?.profile_pic_url ? (
                <Image
                  src={userProfile.profile_pic_url}
                  alt={userProfile.full_name || 'User Profile'}
                  fill
                  className="object-cover"
                />
              ) : (
                <span>{(userProfile?.full_name || currentEmail || 'E')[0].toUpperCase()}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-serif font-bold text-base text-[#141413] truncate">
                {userProfile?.full_name || 'Studio Member'}
              </h2>
              <p className="text-xs text-[#6E6E69] truncate mt-0.5">{currentEmail}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider bg-[#F4F4ED] text-[#141413] border border-[#E5E5DF]">
                  <Sparkles className="w-2.5 h-2.5 text-[#865E16]" />
                  {userProfile?.role || 'Creator'}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#28633B]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#28633B] animate-pulse" />
                  Active
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-5 border-t border-[#F0F0EB] space-y-2.5">
            <div className="flex items-center justify-between text-xs text-[#6E6E69]">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#8A8A85]" /> Account Status
              </span>
              <span className="font-medium text-[#141413]">Verified</span>
            </div>
            <div className="flex items-center justify-between text-xs text-[#6E6E69]">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#8A8A85]" /> Authentication
              </span>
              <span className="font-medium text-[#141413]">Supabase Auth</span>
            </div>
            <div className="flex items-center justify-between text-xs text-[#6E6E69]">
              <span className="flex items-center gap-1.5">
                <Fingerprint className="w-3.5 h-3.5 text-[#8A8A85]" /> Joined
              </span>
              <span className="font-medium text-[#141413]">{memberSince}</span>
            </div>
          </div>
        </div>

        {/* Quick Section Navigation Links */}
        <div className="bg-white rounded-2xl p-2.5 border border-[#E8E8E3] shadow-xs space-y-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab('credentials');
              document.getElementById('email-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'credentials'
                ? 'bg-[#141413] text-white'
                : 'text-[#4A4A45] hover:bg-[#F5F5F5] hover:text-[#141413]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4" />
              <span>Email & Identity</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 opacity-60" />
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('password');
              document.getElementById('password-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'password'
                ? 'bg-[#141413] text-white'
                : 'text-[#4A4A45] hover:bg-[#F5F5F5] hover:text-[#141413]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <KeyRound className="w-4 h-4" />
              <span>Password & Security</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 opacity-60" />
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('security');
              document.getElementById('security-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'security'
                ? 'bg-[#141413] text-white'
                : 'text-[#4A4A45] hover:bg-[#F5F5F5] hover:text-[#141413]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Shield className="w-4 h-4" />
              <span>Security Protocols</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 opacity-60" />
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('danger');
              document.getElementById('danger-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'danger'
                ? 'bg-[#9A3B3B] text-white'
                : 'text-[#9A3B3B] hover:bg-[#FDF2F2]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-[#9A3B3B]" />
              <span>Danger Zone</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 opacity-60" />
          </button>
        </div>

        {/* Security Assurance Badge */}
        <div className="p-4 rounded-2xl bg-[#F8F9FA] border border-[#E5E7EB] text-xs text-gray-800 space-y-1.5">
          <div className="font-semibold flex items-center gap-1.5 text-[#141413]">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> Encrypted Credentials
          </div>
          <p className="text-[11px] text-[#6E6E69] leading-relaxed">
            Your login sessions and credentials are authenticated via SSL with zero-knowledge cryptographic hashing.
          </p>
        </div>
      </aside>

      {/* Right Column: Settings Sections */}
      <main className="lg:col-span-8 space-y-8">
        {/* Section 1: Change Email */}
        <section
          id="email-section"
          className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E8E8E3] shadow-xs space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#F0F0EB] pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-[#F5F5F5] text-[#141413] border border-[#E5E5E5]">
                  <Mail className="w-4 h-4" />
                </span>
                <h3 className="font-serif text-lg font-bold text-[#141413]">Email Address</h3>
              </div>
              <p className="text-xs text-[#6E6E69]">
                The primary email linked to your account for signing in and receiving inquiries.
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F0F5F1] border border-[#CDE3D4] text-[#28633B] text-xs font-medium self-start sm:self-auto">
              <Check className="w-3 h-3" />
              <span>Verified Primary</span>
            </div>
          </div>

          {/* Current Email Display */}
          <div className="p-4 rounded-xl bg-[#F8F9FA] border border-[#E8E8E3] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] uppercase tracking-wider font-semibold text-[#8A8A85] block">
                Current Email
              </span>
              <span className="text-sm font-medium text-[#141413] font-mono mt-0.5 block">
                {currentEmail}
              </span>
            </div>
            <span className="text-xs text-[#6E6E69]">Active on all platform devices</span>
          </div>

          {/* Feedback messages */}
          {emailState?.success && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#F0F5F1] border border-[#CDE3D4] text-[#28633B] text-xs leading-relaxed animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#28633B]" />
              <div className="flex-1 font-medium">{emailState.success}</div>
            </div>
          )}

          {emailState?.error && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#FDF2F2] border border-[#F2C6C6] text-[#9E3333] text-xs leading-relaxed animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#B83838]" />
              <div className="flex-1 font-medium">{emailState.error}</div>
            </div>
          )}

          {/* Email Update Form */}
          <form onSubmit={handleEmailChange} className="space-y-4 pt-1">
            <div className="w-full">
              <Input
                label="Update to New Email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="artist@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4 text-[#8A8A85]" />}
                helperText="We'll send a verification link to confirm ownership before updating your account."
                required
              />
            </div>
            <div className="flex items-center justify-end pt-1">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={emailSubmitting}
                className="w-full sm:w-auto px-6 h-10 text-xs font-semibold"
              >
                Send Verification Link
              </Button>
            </div>
          </form>
        </section>

        {/* Section 2: Change Password */}
        <section
          id="password-section"
          className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E8E8E3] shadow-xs space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#F0F0EB] pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-[#F5F5F5] text-[#141413] border border-[#E5E5E5]">
                  <KeyRound className="w-4 h-4" />
                </span>
                <h3 className="font-serif text-lg font-bold text-[#141413]">Password & Security</h3>
              </div>
              <p className="text-xs text-[#6E6E69]">
                Use a strong, unique passphrase to keep your artist profile and transactions secure.
              </p>
            </div>
            <span className="text-xs text-[#8A8A85] hidden sm:inline">Min. 6 characters</span>
          </div>

          {/* Feedback messages */}
          {passwordState?.success && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#F0F5F1] border border-[#CDE3D4] text-[#28633B] text-xs leading-relaxed animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#28633B]" />
              <div className="flex-1 font-medium">{passwordState.success}</div>
            </div>
          )}

          {passwordState?.error && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#FDF2F2] border border-[#F2C6C6] text-[#9E3333] text-xs leading-relaxed animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#B83838]" />
              <div className="flex-1 font-medium">{passwordState.error}</div>
            </div>
          )}

          {/* Password Form */}
          <form onSubmit={handlePasswordChange} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="relative">
                <Input
                  label="New Password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  minLength={6}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leftIcon={<Lock className="w-4 h-4 text-[#8A8A85]" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[#8A8A85] hover:text-[#141413] transition-colors p-1"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                  required
                />
              </div>

              <div className="relative">
                <Input
                  label="Confirm New Password"
                  name="confirm_password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  minLength={6}
                  placeholder="Re-type new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  leftIcon={<Lock className="w-4 h-4 text-[#8A8A85]" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-[#8A8A85] hover:text-[#141413] transition-colors p-1"
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                  required
                />
              </div>
            </div>

            {/* Password Validation Helper Indicators */}
            {password.length > 0 && (
              <div className="p-3.5 rounded-xl bg-[#F8F9FA] border border-[#E8E8E3] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#6E6E69]">Password Strength</span>
                  <span
                    className={`font-semibold ${
                      password.length >= 10
                        ? 'text-[#28633B]'
                        : passwordLengthOk
                        ? 'text-[#865E16]'
                        : 'text-[#B83838]'
                    }`}
                  >
                    {password.length >= 10 ? 'Strong' : passwordLengthOk ? 'Adequate' : 'Too Short'}
                  </span>
                </div>
                {/* Strength Meter Bar */}
                <div className="w-full bg-[#E8E8E3] h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      password.length >= 10
                        ? 'w-full bg-[#28633B]'
                        : passwordLengthOk
                        ? 'w-2/3 bg-[#865E16]'
                        : 'w-1/3 bg-[#B83838]'
                    }`}
                  />
                </div>
                <div className="flex items-center gap-3 pt-1 text-[11px]">
                  <span
                    className={`flex items-center gap-1 ${
                      passwordLengthOk ? 'text-[#28633B]' : 'text-[#8A8A85]'
                    }`}
                  >
                    <Check className="w-3 h-3" /> Minimum 6 characters
                  </span>
                  {confirmPassword.length > 0 && (
                    <span
                      className={`flex items-center gap-1 ${
                        passwordsMatch ? 'text-[#28633B]' : 'text-[#B83838]'
                      }`}
                    >
                      {passwordsMatch ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <AlertCircle className="w-3 h-3" />
                      )}
                      {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end pt-1">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={passwordSubmitting}
                className="w-full sm:w-auto px-6 h-10 text-xs font-semibold"
              >
                Update Password
              </Button>
            </div>
          </form>
        </section>

        {/* Section 3: Security & Session Protocols */}
        <section
          id="security-section"
          className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E8E8E3] shadow-xs space-y-4"
        >
          <div className="space-y-1 border-b border-[#F0F0EB] pb-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#F5F5F5] text-[#141413] border border-[#E5E5E5]">
                <Shield className="w-4 h-4" />
              </span>
              <h3 className="font-serif text-lg font-bold text-[#141413]">Security & Authentication</h3>
            </div>
            <p className="text-xs text-[#6E6E69]">
              How your session and personal information are protected across the Eras platform.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="p-4 rounded-xl border border-[#E8E8E3] bg-[#F8F9FA] space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#141413]">
                <ShieldCheck className="w-4 h-4 text-[#28633B]" /> Encrypted Session Storage
              </div>
              <p className="text-[11px] text-[#6E6E69] leading-relaxed">
                Authentication tokens are stored as HTTP-only, SameSite=Lax cryptographic cookies, preventing XSS and CSRF token tampering.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-[#E8E8E3] bg-[#F8F9FA] space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#141413]">
                <Fingerprint className="w-4 h-4 text-[#141413]" /> Row Level Security (RLS)
              </div>
              <p className="text-[11px] text-[#6E6E69] leading-relaxed">
                Database policies ensure your private dossier documents, consultation logs, and client messages are accessible strictly by you.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4: Danger Zone */}
        <section
          id="danger-section"
          className="bg-[#FCF6F6] rounded-2xl p-6 sm:p-8 border border-[#F2D8D8] shadow-xs space-y-6"
        >
          <div className="flex items-start justify-between gap-4 border-b border-[#F7E5E5] pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-[#FBEBEB] text-[#9A3B3B] border border-[#F4CDCD]">
                  <AlertTriangle className="w-4 h-4" />
                </span>
                <h3 className="font-serif text-lg font-bold text-[#9A3B3B]">Danger Zone</h3>
              </div>
              <p className="text-xs text-[#7A3B3B] leading-relaxed max-w-xl">
                Irreversible account deletion. Once confirmed, all your artworks, artist statements, dossier files, and correspondence will be permanently purged.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/70 border border-[#F4CDCD] space-y-2 text-xs text-[#7A3B3B]">
            <span className="font-semibold block text-[#9A3B3B]">What happens when you delete your account:</span>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-[#6E6E69]">
              <li>Your public artist profile and discovery listings will be removed immediately.</li>
              <li>All uploaded artwork images, documents, and statements will be permanently deleted.</li>
              <li>Pending COR opportunities and residency applications will be closed.</li>
              <li>This action is irreversible and cannot be recovered by Eras support.</li>
            </ul>
          </div>

          {deleteState?.error && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#FDF2F2] border border-[#F2C6C6] text-[#9E3333] text-xs leading-relaxed animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#B83838]" />
              <div className="flex-1 font-medium">{deleteState.error}</div>
            </div>
          )}

          {!isDeleting ? (
            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-[#8A8A85]">Carefully consider before proceeding.</p>
              <Button
                type="button"
                variant="danger"
                size="md"
                onClick={() => setIsDeleting(true)}
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                className="px-5 h-10 text-xs font-semibold"
              >
                Delete Account
              </Button>
            </div>
          ) : (
            <form
              onSubmit={handleDeleteAccount}
              className="bg-white p-5 sm:p-6 rounded-xl border border-[#F4CDCD] space-y-4 animate-in fade-in duration-200"
            >
              <div className="space-y-1">
                <span className="text-xs font-bold text-[#9A3B3B] block">
                  Confirm Account Deletion
                </span>
                <p className="text-[11px] text-[#6E6E69]">
                  To verify your identity, please enter your account password below:
                </p>
              </div>

              <div className="relative">
                <Input
                  label="Current Password"
                  name="password"
                  type={showDeletePassword ? 'text' : 'password'}
                  placeholder="Enter your current password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  leftIcon={<Lock className="w-4 h-4 text-[#8A8A85]" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowDeletePassword(!showDeletePassword)}
                      className="text-[#8A8A85] hover:text-[#141413] transition-colors p-1"
                      aria-label={showDeletePassword ? 'Hide password' : 'Show password'}
                    >
                      {showDeletePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                  required
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => {
                    setIsDeleting(false);
                    setDeletePassword('');
                    setDeleteState(null);
                  }}
                  className="w-full sm:w-auto h-9 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="danger"
                  size="md"
                  isLoading={deleteSubmitting}
                  leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                  className="w-full sm:w-auto h-9 text-xs font-semibold bg-[#9A3B3B] text-white hover:bg-[#832E2E]"
                >
                  Confirm Permanent Deletion
                </Button>
              </div>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
