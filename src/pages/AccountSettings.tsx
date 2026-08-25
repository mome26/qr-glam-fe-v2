import { useState } from 'react';
import { useAuth } from '../hooks/use-auth';
import {
  User,
  Mail,
  Lock,
  Shield,
  ArrowRight,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import { useUpdateProfile } from '../hooks/use-user-profile';
import { useChangePassword } from '../hooks/use-password-change';
import toast from 'react-hot-toast';

export default function AccountSettings() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const updateProfile = useUpdateProfile(user?.id);
  const changePassword = useChangePassword(user?.id);

  const [prevUser, setPrevUser] = useState(user);
  
  // Sync state if user data loads after mount
  if (user && user !== prevUser) {
    setPrevUser(user);
    setName(user.name || '');
    setEmail(user.email || '');
  }

  const getInitials = (name: string) => {
    return (
      name
        ?.split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase() || 'U'
    );
  };

  const isPending = updateProfile.isPending || changePassword.isPending;

  const handleSave = async () => {
    let profileUpdated = false;
    let passwordUpdated = false;

    // 1. Handle Profile Update
    if (name !== user?.name || email !== user?.email) {
      try {
        await updateProfile.mutateAsync({
          name: name !== user?.name ? name : undefined,
          email: email !== user?.email ? email : undefined,
        });
        profileUpdated = true;
      } catch (err: unknown) {
        toast.error((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to update profile');
        return; // Halt if profile update fails
      }
    }

    // 2. Handle Password Change
    if (newPassword) {
      if (!currentPassword) {
        toast.error('Current password is required to set a new password');
        return;
      }
      try {
        await changePassword.mutateAsync({ currentPassword, newPassword });
        passwordUpdated = true;
        setCurrentPassword('');
        setNewPassword('');
        window.location.reload();
      } catch (err: unknown) {
        toast.error((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to change password');
        return;
      }
    }

    if (profileUpdated && passwordUpdated) {
      toast.success('Profile and password updated successfully');
    } else if (profileUpdated) {
      toast.success('Profile updated successfully');
    } else if (passwordUpdated) {
      toast.success('Password changed successfully');
    } else {
      toast('No changes detected', { icon: 'ℹ️' });
    }
  };

  return (
    <div className="w-full min-h-full bg-background p-8 md:p-12">
      <div className="max-w-4xl mx-auto flex flex-col gap-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-4xl font-semibold font-display text-card-foreground">
            Account Settings
          </h1>
          <p className="text-muted">
            Manage your profile information and security preferences.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 flex flex-col gap-8">
            <section className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden transition-all hover:shadow-md">
              <div className="px-8 py-6 border-b border-border/50 flex justify-between items-center bg-accent/50">
                <h2 className="text-lg font-bold text-card-foreground flex items-center gap-2">
                  <User className="w-5 h-5 text-info" />
                  Profile Information
                </h2>
              </div>
              <div className="p-8 flex flex-col gap-8">
                <div className="flex items-center gap-8">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-info to-primary text-white flex items-center justify-center text-3xl font-bold shadow-lg ring-4 ring-white group-hover:scale-105 transition-transform duration-300">
                      {getInitials(user?.name || '')}
                    </div>
                    <button
                      onClick={() =>
                        toast('Profile photo uploads coming soon!', {
                          icon: '📸',
                        })
                      }
                      className="absolute -bottom-1 -right-1 bg-white border border-border p-2 rounded-full shadow-md text-muted hover:text-info hover:scale-110 transition-all"
                    >
                      <ArrowRight className="w-4 h-4 transform -rotate-45" />
                    </button>
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-xl font-bold text-foreground">
                      {user?.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase bg-muted/30 px-2 py-0.5 rounded">
                        {user?.role} ACCOUNT
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        toast('Profile photo uploads coming soon!', {
                          icon: '📸',
                        })
                      }
                      className="text-info text-xs font-bold hover:underline mt-2 text-left"
                    >
                      Change Profile Photo
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-muted uppercase tracking-wider ml-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your full name"
                        className="w-full pl-11 pr-4 py-3.5 bg-accent/30 border border-border rounded-xl text-sm font-medium focus:ring-4 focus:ring-info/5 focus:border-info outline-none transition-all placeholder:text-muted-foreground/40"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-muted uppercase tracking-wider ml-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full pl-11 pr-4 py-3.5 bg-accent/30 border border-border rounded-xl text-sm font-medium focus:ring-4 focus:ring-info/5 focus:border-info outline-none transition-all placeholder:text-muted-foreground/40"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden transition-all hover:shadow-md">
              <div className="px-8 py-6 border-b border-border/50 flex justify-between items-center bg-accent/50">
                <h2 className="text-lg font-bold text-card-foreground flex items-center gap-2">
                  <Lock className="w-5 h-5 text-info" />
                  Security & Password
                </h2>
              </div>
              <div className="p-8 flex flex-col gap-6">
                {user?.isDefaultPassword && (
                  <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 flex items-start gap-3">
                    <span className="text-xl shrink-0">🔒</span>
                    <div>
                      <p className="text-sm font-medium text-warning">
                        Your account uses a temporary password (123456789). Change it now to secure your access.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-muted uppercase tracking-wider ml-1">
                    Update Password
                  </label>
                  <p className="text-xs text-muted-foreground mb-4 bg-info/5 p-3 rounded-lg border border-info/10">
                    To change your password, provide your current password and
                    the new one below. Leave blank if no change is needed.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                      <input
                        type="password"
                        autoComplete="current-password"
                        placeholder="Current password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 bg-accent/30 border border-border rounded-xl text-sm outline-none focus:ring-4 focus:ring-info/5 focus:border-info transition-all font-mono"
                      />
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                      <input
                        type="password"
                        autoComplete="new-password"
                        placeholder="New password (min 8 chars)"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 bg-accent/30 border border-border rounded-xl text-sm outline-none focus:ring-4 focus:ring-info/5 focus:border-info transition-all font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-6">
                  <button
                    onClick={handleSave}
                    disabled={isPending}
                    className="flex items-center justify-center gap-2 bg-info text-white rounded-xl px-12 py-3.5 text-sm font-bold hover:bg-info/90 active:scale-95 transition-all shadow-lg shadow-info/10 hover:shadow-info/25 disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px]"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Save All Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </section>
          </div>

          <aside className="flex flex-col gap-6">
            <div className="bg-gradient-to-br from-info to-primary rounded-2xl p-8 text-white flex flex-col gap-4 shadow-xl shadow-info/20 group hover:-translate-y-1 transition-transform duration-300">
              <Shield className="w-10 h-10 opacity-50 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-bold">Two-Factor Authentication</h3>
              <p className="text-sm text-white/80 leading-relaxed">
                Add an extra layer of security to your account by enabling
                two-factor authentication (2FA).
              </p>
              <button
                onClick={() =>
                  toast('Two-factor authentication coming soon!', {
                    icon: '🔒',
                  })
                }
                className="bg-white/20 backdrop-blur-md text-white px-4 py-3 rounded-xl text-sm font-bold mt-2 hover:bg-white/30 transition-colors border border-white/30"
              >
                Enable 2FA
              </button>
            </div>

            <div className="bg-white border border-border rounded-2xl p-6 flex flex-col gap-3">
              <h4 className="text-xs font-bold text-muted uppercase tracking-widest">
                Account Status
              </h4>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-foreground">
                  Active Professional
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Member since{' '}
                {new Date().toLocaleDateString(undefined, {
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
