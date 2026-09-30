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
    <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgb(0,0,0,0.04)] p-8 max-w-3xl mt-8 border border-red-50">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Account Settings</h2>

      {/* Change Email */}
      <div className="mb-10">
        <h3 className="font-bold text-gray-900 mb-4">Change Email Address</h3>
        {emailState?.success && <div className="mb-4 bg-green-50 border border-green-200 rounded-xl p-3 text-green-700 text-sm">{emailState.success}</div>}
        {emailState?.error && <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm">{emailState.error}</div>}
        
        <form onSubmit={handleEmailChange} className="flex gap-4 items-end">
          <div className="flex-1 relative">
            <Input label="New Email" name="email" type="email" placeholder={currentEmail} required />
            <Mail className="absolute right-3 top-9 text-gray-400" size={16} />
          </div>
          <Button type="submit" variant="secondary">Update Email</Button>
        </form>
      </div>

      {/* Change Password */}
      <div className="mb-10 pt-6 border-t border-gray-100">
        <h3 className="font-bold text-gray-900 mb-4">Change Password</h3>
        {passwordState?.success && <div className="mb-4 bg-green-50 border border-green-200 rounded-xl p-3 text-green-700 text-sm">{passwordState.success}</div>}
        {passwordState?.error && <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm">{passwordState.error}</div>}
        
        <form onSubmit={handlePasswordChange} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div className="relative">
            <Input label="New Password" name="password" type="password" minLength={6} required />
            <Lock className="absolute right-3 top-9 text-gray-400" size={16} />
          </div>
          <div className="relative">
            <Input label="Confirm New Password" name="confirm_password" type="password" minLength={6} required />
            <Lock className="absolute right-3 top-9 text-gray-400" size={16} />
          </div>
          <div className="md:col-span-2">
            <Button type="submit" variant="secondary">Update Password</Button>
          </div>
        </form>
      </div>

      {/* Delete Account */}
      <div className="pt-6 border-t border-gray-100">
        <h3 className="font-bold text-red-600 mb-1 flex items-center gap-2">
          <AlertTriangle size={18} /> Danger Zone: Delete Account
        </h3>
        <p className="text-gray-500 text-sm mb-4">
          Once you delete your account, there is no going back. All of your artworks, messages, and data will be permanently wiped.
        </p>

        {deleteState?.error && <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm">{deleteState.error}</div>}
        
        {!isDeleting ? (
          <Button type="button" variant="coral" onClick={() => setIsDeleting(true)} className="bg-red-600 hover:bg-red-700 text-white border-none">
            Delete My Account
          </Button>
        ) : (
          <form onSubmit={handleDeleteAccount} className="bg-red-50 p-4 rounded-xl border border-red-100 mt-4">
            <p className="font-semibold text-red-900 mb-2">To confirm, please enter your password:</p>
            <div className="flex gap-4 items-end">
              <div className="flex-1 relative">
                <Input label="Current Password" name="password" type="password" required />
                <Lock className="absolute right-3 top-9 text-gray-400" size={16} />
              </div>
              <Button type="submit" variant="coral" className="bg-red-600 hover:bg-red-700 text-white border-none">
                Confirm Deletion
              </Button>
              <Button type="button" variant="secondary" onClick={() => { setIsDeleting(false); setDeleteState(null); }}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
