'use client';

import { useState } from 'react';
import { changeEmail, changePassword, deleteAccount } from '@/actions/accountActions';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Mail, Lock, AlertTriangle } from 'lucide-react';

export default function AccountSettingsForm({ currentEmail }: { currentEmail: string }) {
  const [emailState, setEmailState] = useState<{ success?: string, error?: string } | null>(null);
  const [passwordState, setPasswordState] = useState<{ success?: string, error?: string } | null>(null);
  const [deleteState, setDeleteState] = useState<{ error?: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEmailChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const result = await changeEmail(formData);
    setEmailState(result);
  };

  const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (formData.get('password') !== formData.get('confirm_password')) {
      setPasswordState({ error: 'Passwords do not match' });
      return;
    }
    const result = await changePassword(formData);
    setPasswordState(result);
    if (result.success) {
      (e.target as HTMLFormElement).reset();
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!confirm('Are you absolutely sure? This will delete all your artworks, messages, and profile data permanently. This cannot be undone.')) {
      setIsDeleting(false);
      return;
    }
    const formData = new FormData(e.currentTarget);
    const result = await deleteAccount(formData);
    if (result?.error) {
      setDeleteState(result);
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[var(--color-cor-border-light)] shadow-soft-sm space-y-12">
      {/* Change Email */}
      <div>
        <h3 className="font-serif text-xl font-bold text-[var(--color-cor-ink)] mb-6">Email Address</h3>
        {emailState?.success && <div className="mb-6 bg-green-50 border border-green-200 rounded-2xl p-4 text-green-700 text-sm font-medium">{emailState.success}</div>}
        {emailState?.error && <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm font-medium">{emailState.error}</div>}
        
        <form onSubmit={handleEmailChange} className="flex flex-col sm:flex-row gap-4 sm:items-end">
          <div className="flex-1 relative">
            <Input label="New Email" name="email" type="email" placeholder={currentEmail} required />
            <Mail className="absolute right-4 top-10 text-[var(--color-cor-ink-light)]" size={18} />
          </div>
          <Button type="submit" variant="secondary" className="w-full sm:w-auto h-[50px] mb-[2px]">Update Email</Button>
        </form>
      </div>

      {/* Change Password */}
      <div className="pt-12 border-t border-[var(--color-cor-border-light)]">
        <h3 className="font-serif text-xl font-bold text-[var(--color-cor-ink)] mb-6">Change Password</h3>
        {passwordState?.success && <div className="mb-6 bg-green-50 border border-green-200 rounded-2xl p-4 text-green-700 text-sm font-medium">{passwordState.success}</div>}
        {passwordState?.error && <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm font-medium">{passwordState.error}</div>}
        
        <form onSubmit={handlePasswordChange} className="grid grid-cols-1 md:grid-cols-2 gap-5 items-end">
          <div className="relative">
            <Input label="New Password" name="password" type="password" minLength={6} required />
            <Lock className="absolute right-4 top-10 text-[var(--color-cor-ink-light)]" size={18} />
          </div>
          <div className="relative">
            <Input label="Confirm New Password" name="confirm_password" type="password" minLength={6} required />
            <Lock className="absolute right-4 top-10 text-[var(--color-cor-ink-light)]" size={18} />
          </div>
          <div className="md:col-span-2 pt-2">
            <Button type="submit" variant="secondary" className="w-full sm:w-auto h-[50px]">Update Password</Button>
          </div>
        </form>
      </div>

      {/* Delete Account */}
      <div className="pt-12 border-t border-[var(--color-cor-border-light)]">
        <h3 className="font-serif text-xl font-bold text-[#9A3B3B] mb-2 flex items-center gap-2">
          <AlertTriangle size={20} /> Danger Zone: Delete Account
        </h3>
        <p className="text-[var(--color-cor-ink-light)] text-sm mb-6 max-w-2xl leading-relaxed">
          Once you delete your account, there is no going back. All of your artworks, messages, and data will be permanently wiped.
        </p>

        {deleteState?.error && <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4 text-[#9A3B3B] text-sm font-medium">{deleteState.error}</div>}
        
        {!isDeleting ? (
          <Button type="button" variant="primary" onClick={() => setIsDeleting(true)} className="bg-[#9A3B3B] hover:bg-[#7a2e2e] text-white border-none h-[50px] px-8">
            Delete My Account
          </Button>
        ) : (
          <form onSubmit={handleDeleteAccount} className="bg-[#FAF5EC] p-6 sm:p-8 rounded-3xl border border-[#E8E8E3] mt-6">
            <p className="font-bold text-[#9A3B3B] mb-4">To confirm, please enter your password:</p>
            <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
              <div className="flex-1 relative">
                <Input label="Current Password" name="password" type="password" required />
                <Lock className="absolute right-4 top-10 text-[var(--color-cor-ink-light)]" size={18} />
              </div>
              <div className="flex items-center gap-3 mb-[2px]">
                <Button type="submit" variant="primary" className="bg-[#9A3B3B] hover:bg-[#7a2e2e] text-white border-none h-[50px]">
                  Confirm Deletion
                </Button>
                <Button type="button" variant="secondary" onClick={() => { setIsDeleting(false); setDeleteState(null); }} className="h-[50px]">
                  Cancel
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
