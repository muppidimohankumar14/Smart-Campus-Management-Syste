import React, { useEffect, useState } from 'react';
import {
  Check,
  KeyRound,
  LogOut,
  Moon,
  Shield,
  Sun,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { apiRequest } from '../../utils/api';
import { AuthSession, UserAccount } from '../../types/campus';

interface SessionRow extends AuthSession {
  isCurrent: boolean;
}

interface SettingsSecurityModuleProps {
  user: Omit<UserAccount, 'passwordHash'>;
  theme: 'light' | 'dark';
  onSetTheme: (mode: 'light' | 'dark') => void;
  onUserUpdated: (user: Omit<UserAccount, 'passwordHash'>) => void;
  onLogout: () => void;
  onNotify: (
    type: 'success' | 'error' | 'info',
    title: string,
    message?: string
  ) => void;
}

export function SettingsSecurityModule({
  user,
  theme,
  onSetTheme,
  onUserUpdated,
  onLogout,
  onNotify,
}: SettingsSecurityModuleProps) {
  const [fullName, setFullName] = useState(user.fullName);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [newAdmin, setNewAdmin] = useState({
    userId: '',
    fullName: '',
    email: '',
    phone: '',
    password: '',
  });

  const loadSessions = async () => {
    try {
      const res = await apiRequest<{ sessions: SessionRow[] }>('/auth/sessions');
      setSessions(res.sessions);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadSessions();
  }, [user.userId]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiRequest<{ user: Omit<UserAccount, 'passwordHash'> }>(
        '/auth/profile',
        {
          method: 'PUT',
          body: JSON.stringify({ fullName, email, phone }),
        }
      );
      onUserUpdated(res.user);
      onNotify('success', 'Profile Updated', 'Account details saved.');
    } catch (err) {
      onNotify(
        'error',
        'Update Failed',
        err instanceof Error ? err.message : 'Unable to update profile.'
      );
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiRequest<{ message: string }>('/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      onNotify('success', 'Password Changed', res.message);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      onNotify(
        'error',
        'Password Change Failed',
        err instanceof Error ? err.message : 'Unable to change password.'
      );
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await apiRequest(`/auth/sessions/${sessionId}`, { method: 'DELETE' });
      onNotify('info', 'Session Revoked', 'Session token invalidated.');
      await loadSessions();
    } catch (err) {
      onNotify(
        'error',
        'Revoke Failed',
        err instanceof Error ? err.message : 'Unable to revoke session.'
      );
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/auth/admin-users', {
        method: 'POST',
        body: JSON.stringify(newAdmin),
      });
      onNotify(
        'success',
        'Administrator Account Created',
        `Authorized admin ${newAdmin.userId.toUpperCase()} is now active.`
      );
      setNewAdmin({
        userId: '',
        fullName: '',
        email: '',
        phone: '',
        password: '',
      });
    } catch (err) {
      onNotify(
        'error',
        'Creation Failed',
        err instanceof Error ? err.message : 'Unable to create admin account.'
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Settings & Security
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Manage profile details, bcrypt password security, theme preference, and active JWT sessions.
          </p>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 dark:border-red-900/60 dark:bg-slate-900 dark:text-red-400"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          <span>Sign Out</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
            Account Profile
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            User ID: <span className="font-mono font-semibold">{user.userId}</span> · Role:{' '}
            <span className="font-semibold text-blue-700 dark:text-blue-400">
              {user.role}
            </span>
          </p>

          <form onSubmit={handleProfileSave} className="mt-4 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Full Name
              </label>
              <input
                required
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Email Address
              </label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Phone Number
              </label>
              <input
                required
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800"
              >
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Update Profile</span>
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-slate-200 pt-6 dark:border-slate-800">
            <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
              Display Theme
            </h3>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onSetTheme('light')}
                className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-semibold ${
                  theme === 'light'
                    ? 'border-blue-600 bg-blue-50 text-blue-800'
                    : 'border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-300'
                }`}
              >
                <Sun className="h-4 w-4" aria-hidden="true" />
                <span>Light Mode</span>
              </button>
              <button
                type="button"
                onClick={() => onSetTheme('dark')}
                className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-semibold ${
                  theme === 'dark'
                    ? 'border-blue-500 bg-blue-950/60 text-blue-300'
                    : 'border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-300'
                }`}
              >
                <Moon className="h-4 w-4" aria-hidden="true" />
                <span>Dark Mode</span>
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="flex items-center gap-2 font-display text-base font-bold text-slate-900 dark:text-white">
            <KeyRound className="h-4 w-4 text-blue-600" aria-hidden="true" />
            <span>Change Password</span>
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Passwords are encrypted with bcrypt (10 salt rounds) on the server.
          </p>

          <form onSubmit={handlePasswordChange} className="mt-4 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Current Password
              </label>
              <input
                required
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                New Password
              </label>
              <input
                required
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Confirm New Password
              </label>
              <input
                required
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="rounded-lg bg-[#0B1F3A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#13325C] dark:bg-blue-600"
              >
                Update Password
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-slate-200 pt-5 dark:border-slate-800">
            <h3 className="flex items-center gap-2 font-display text-sm font-bold text-slate-900 dark:text-white">
              <Shield className="h-4 w-4 text-blue-600" aria-hidden="true" />
              <span>Role Permissions Summary</span>
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              {user.role === 'ADMIN'
                ? 'ADMIN role grants full CRUD access across student admissions, attendance marking, timetable & room conflict scheduling, examination publishing, reports, and authorized admin creation.'
                : 'STUDENT role grants read-only access to personal profile, attendance history, section timetable, published exam results, course registration, and ID card generation.'}
            </p>
          </div>
        </section>
      </div>

      {user.role === 'ADMIN' && (
        <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="flex items-center gap-2 font-display text-base font-bold text-slate-900 dark:text-white">
            <UserPlus className="h-4 w-4 text-blue-600" aria-hidden="true" />
            <span>Create Authorized Administrator Account</span>
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Only existing administrators can provision new ADMIN accounts.
          </p>

          <form
            onSubmit={handleCreateAdmin}
            className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-5"
          >
            <input
              required
              type="text"
              placeholder="Admin ID (ADM202602)"
              value={newAdmin.userId}
              onChange={(e) =>
                setNewAdmin((p) => ({ ...p, userId: e.target.value }))
              }
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs uppercase dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            <input
              required
              type="text"
              placeholder="Full Name"
              value={newAdmin.fullName}
              onChange={(e) =>
                setNewAdmin((p) => ({ ...p, fullName: e.target.value }))
              }
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            <input
              required
              type="email"
              placeholder="Email"
              value={newAdmin.email}
              onChange={(e) =>
                setNewAdmin((p) => ({ ...p, email: e.target.value }))
              }
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            <input
              required
              type="tel"
              placeholder="Phone"
              value={newAdmin.phone}
              onChange={(e) =>
                setNewAdmin((p) => ({ ...p, phone: e.target.value }))
              }
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            <div className="flex gap-2">
              <input
                required
                type="password"
                placeholder="Password"
                value={newAdmin.password}
                onChange={(e) =>
                  setNewAdmin((p) => ({ ...p, password: e.target.value }))
                }
                className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
              <button
                type="submit"
                className="rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-800 whitespace-nowrap shrink-0"
              >
                Create
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
            Active Authentication Sessions
          </h2>
        </div>
        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {sessions.length === 0 ? (
            <p className="p-6 text-xs text-slate-500">No active sessions found.</p>
          ) : (
            sessions.map((ses) => (
              <div
                key={ses.sessionId}
                className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 text-xs"
              >
                <div>
                  <p className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                    {ses.userId} · {ses.role}{' '}
                    {ses.isCurrent && (
                      <span className="text-emerald-700 dark:text-emerald-400">
                        (Current Session)
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-slate-500">
                    Created: {new Date(ses.createdAt).toLocaleString()} · Expires:{' '}
                    {new Date(ses.expiresAt).toLocaleString()}
                  </p>
                </div>
                {!ses.isCurrent && (
                  <button
                    type="button"
                    onClick={() => handleRevokeSession(ses.sessionId)}
                    className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2.5 py-1 font-semibold text-red-600 hover:bg-red-50 dark:border-red-900/60 dark:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Revoke</span>
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
