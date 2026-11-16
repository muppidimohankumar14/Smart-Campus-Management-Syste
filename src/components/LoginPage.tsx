import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Building2,
  Eye,
  EyeOff,
  GraduationCap,
  Lock,
  Moon,
  Sun,
  User,
} from 'lucide-react';
import { AdminProfile, ThemeMode } from '../types/student';

interface LoginPageProps {
  adminProfile: AdminProfile;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onLoginSuccess: () => void;
}

export function LoginPage({
  adminProfile,
  theme,
  onToggleTheme,
  onLoginSuccess,
}: LoginPageProps) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [imgError, setImgError] = useState(false);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedUser = username.trim();
    const trimmedPass = password.trim();

    if (!trimmedUser || !trimmedPass) {
      setError('Please enter both your administrator username and password.');
      return;
    }

    const validUsername =
      trimmedUser.toLowerCase() === adminProfile.username.toLowerCase() ||
      trimmedUser.toLowerCase() === 'admin';
    const validPassword = trimmedPass === 'admin123' || trimmedPass === 'registrar2026';

    if (!validUsername || !validPassword) {
      setError('Invalid credentials. Use demo account "admin" and password "admin123".');
      return;
    }

    setError('');
    onLoginSuccess();
  };

  const fillDemoCredentials = () => {
    setUsername(adminProfile.username || 'admin');
    setPassword('admin123');
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 lg:grid lg:grid-cols-12">
      <div className="relative hidden overflow-hidden bg-[#0B1F3A] lg:col-span-6 lg:flex lg:flex-col lg:justify-between">
        {!imgError ? (
          <img
            src="/src/assets/images/login_campus_courtyard_1794838748826.jpg"
            alt="University campus administration building and sunlit courtyard"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#0B1F3A] via-[#102E57] to-[#1E40AF]">
            <Building2 className="h-24 w-24 text-blue-300/30" aria-hidden="true" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#071426]/95 via-[#0B1F3A]/55 to-[#0B1F3A]/40" />

        <div className="relative z-10 flex items-center gap-3 p-10">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15 text-white backdrop-blur-sm ring-1 ring-white/25">
            <GraduationCap className="h-5 w-5" aria-hidden="true" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight text-white">
            CampusCore
          </span>
        </div>

        <div className="relative z-10 max-w-xl p-10">
          <p className="text-xs font-medium tracking-wide text-blue-200">
            {adminProfile.institution}
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold leading-tight text-white [text-wrap:balance]">
            Academic Records and Student Administration Portal
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-blue-100/90">
            Centralized enrollment registry, course distribution oversight, ID-based record lookup, and persistent student directory management.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-6 border-t border-white/20 pt-6 text-white">
            <div>
              <p className="font-display text-xl font-bold tabular-nums">100%</p>
              <p className="mt-0.5 text-xs text-blue-200">Browser persistence</p>
            </div>
            <div>
              <p className="font-display text-xl font-bold tabular-nums">Unique ID</p>
              <p className="mt-0.5 text-xs text-blue-200">Duplicate protection</p>
            </div>
            <div>
              <p className="font-display text-xl font-bold tabular-nums">CSV / JSON</p>
              <p className="mt-0.5 text-xs text-blue-200">Instant export</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex min-h-screen flex-col justify-between px-6 py-8 sm:px-12 lg:col-span-6 lg:px-16">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0B1F3A] text-white">
              <GraduationCap className="h-5 w-5" aria-hidden="true" />
            </div>
            <span className="font-display text-lg font-bold text-[#0B1F3A] dark:text-white">
              CampusCore
            </span>
          </div>
          <div className="hidden lg:block" />

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="h-4 w-4 text-amber-400" aria-hidden="true" />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="h-4 w-4 text-blue-700" aria-hidden="true" />
                <span>Dark Mode</span>
              </>
            )}
          </button>
        </div>

        <div className="mx-auto w-full max-w-md py-10">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Registrar Sign In
            </h2>
            <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
              Sign in to access student enrollment, search, and academic records.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label
                htmlFor="login-username"
                className="mb-1.5 block text-sm font-medium text-slate-800 dark:text-slate-200"
              >
                Administrator Username
              </label>
              <div className="relative">
                <User
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="login-username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 transition-colors focus-visible:border-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="mb-1.5 block text-sm font-medium text-slate-800 dark:text-slate-200"
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-11 text-sm text-slate-900 transition-colors focus-visible:border-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0B1F3A] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#13325C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:bg-blue-600 dark:hover:bg-blue-500"
            >
              <span>Sign In to Portal</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>

          <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50/70 p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Demo Administrator Credentials
                </p>
                <p className="mt-1 font-mono text-xs text-slate-600 dark:text-slate-400">
                  Username: <span className="font-semibold text-slate-900 dark:text-slate-100">{adminProfile.username || 'admin'}</span> · Password: <span className="font-semibold text-slate-900 dark:text-slate-100">admin123</span>
                </p>
              </div>
              <button
                type="button"
                onClick={fillDemoCredentials}
                className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-50 whitespace-nowrap shrink-0 dark:border-slate-700 dark:bg-slate-800 dark:text-blue-400 dark:hover:bg-slate-700"
              >
                Auto-Fill
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 dark:text-slate-400">
          {adminProfile.institution} · Student Records Management System
        </p>
      </div>
    </div>
  );
}
