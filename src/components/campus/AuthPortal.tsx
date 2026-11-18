import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  Moon,
  Phone,
  ShieldCheck,
  Sun,
  User,
  UserPlus,
} from 'lucide-react';
import { apiRequest } from '../../utils/api';
import { StudentRecord, UserAccount } from '../../types/campus';

type AuthMode = 'login' | 'register' | 'forgot';

interface AuthPortalProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onAuthenticated: (payload: {
    token: string;
    user: Omit<UserAccount, 'passwordHash'>;
    student: StudentRecord | null;
    rememberMe: boolean;
  }) => void;
  onNotify: (
    type: 'success' | 'error' | 'info',
    title: string,
    message?: string
  ) => void;
}

const COURSE_OPTIONS = [
  'B.Tech Computer Science',
  'B.Sc Data Science',
  'Master of Computer Applications',
  'BBA Business Analytics',
  'B.Tech Electronics & Communication',
  'Applied Generative AI & Robotics',
];

export function AuthPortal({
  theme,
  onToggleTheme,
  onAuthenticated,
  onNotify,
}: AuthPortalProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [campusImgError, setCampusImgError] = useState(false);
  const [crestImgError, setCrestImgError] = useState(false);

  // Login State
  const [loginUserId, setLoginUserId] = useState('ADM202601');
  const [loginPassword, setLoginPassword] = useState('admin123');
  const [rememberMe, setRememberMe] = useState(true);
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Register State
  const [regName, setRegName] = useState('');
  const [regStudentId, setRegStudentId] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regCourse, setRegCourse] = useState(COURSE_OPTIONS[0]);
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPass, setShowRegPass] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');

  // Forgot Password State
  const [forgotStep, setForgotStep] = useState<'request' | 'verify'>('request');
  const [forgotUserId, setForgotUserId] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [previewCode, setPreviewCode] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const data = await apiRequest<{
        token: string;
        user: Omit<UserAccount, 'passwordHash'>;
        student: StudentRecord | null;
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          userId: loginUserId,
          password: loginPassword,
          rememberMe,
        }),
      });
      onAuthenticated({ ...data, rememberMe });
    } catch (err) {
      setLoginError(
        err instanceof Error ? err.message : 'Unable to sign in.'
      );
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegLoading(true);
    try {
      const res = await apiRequest<{ message: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          fullName: regName,
          studentId: regStudentId,
          email: regEmail,
          phone: regPhone,
          course: regCourse,
          password: regPassword,
          confirmPassword: regConfirmPassword,
        }),
      });
      onNotify('success', 'Account Created', res.message);
      setLoginUserId(regStudentId.trim().toUpperCase());
      setLoginPassword('');
      setMode('login');
      setRegName('');
      setRegStudentId('');
      setRegEmail('');
      setRegPhone('');
      setRegPassword('');
      setRegConfirmPassword('');
    } catch (err) {
      setRegError(
        err instanceof Error ? err.message : 'Registration failed.'
      );
    } finally {
      setRegLoading(false);
    }
  };

  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotLoading(true);
    try {
      const res = await apiRequest<{
        message: string;
        verificationCodePreview?: string;
      }>('/auth/forgot-password/request', {
        method: 'POST',
        body: JSON.stringify({ userId: forgotUserId, email: forgotEmail }),
      });
      if (res.verificationCodePreview) {
        setPreviewCode(res.verificationCodePreview);
      }
      setForgotStep('verify');
      onNotify('info', 'Verification Code Sent', res.message);
    } catch (err) {
      setForgotError(
        err instanceof Error ? err.message : 'Could not verify account.'
      );
    } finally {
      setForgotLoading(false);
    }
  };

  const handleForgotReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotLoading(true);
    try {
      const res = await apiRequest<{ message: string }>(
        '/auth/forgot-password/reset',
        {
          method: 'POST',
          body: JSON.stringify({
            userId: forgotUserId,
            code: forgotCode,
            newPassword: forgotNewPassword,
            confirmPassword: forgotConfirmPassword,
          }),
        }
      );
      onNotify('success', 'Password Reset Complete', res.message);
      setLoginUserId(forgotUserId.trim().toUpperCase());
      setLoginPassword('');
      setMode('login');
      setForgotStep('request');
      setPreviewCode('');
      setForgotCode('');
      setForgotNewPassword('');
      setForgotConfirmPassword('');
    } catch (err) {
      setForgotError(
        err instanceof Error ? err.message : 'Could not reset password.'
      );
    } finally {
      setForgotLoading(false);
    }
  };

  const applyDemoUser = (role: 'ADMIN' | 'STUDENT') => {
    setMode('login');
    setLoginError('');
    if (role === 'ADMIN') {
      setLoginUserId('ADM202601');
      setLoginPassword('admin123');
    } else {
      setLoginUserId('STU202601');
      setLoginPassword('student123');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 lg:grid lg:grid-cols-12">
      <div className="relative hidden overflow-hidden bg-[#0B1F3A] lg:col-span-5 lg:flex lg:flex-col lg:justify-between">
        {!campusImgError ? (
          <img
            src="/src/assets/images/login_campus_courtyard_1794838748826.jpg"
            alt="SMART CAMPUS university administration building"
            referrerPolicy="no-referrer"
            onError={() => setCampusImgError(true)}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#0B1F3A] to-[#1D4ED8]">
            <Building2 className="h-24 w-24 text-blue-200/30" aria-hidden="true" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#071426]/95 via-[#0B1F3A]/65 to-[#0B1F3A]/45" />

        <div className="relative z-10 flex items-center gap-3.5 p-10">
          {!crestImgError ? (
            <img
              src="/src/assets/images/smart_campus_crest_1794839688853.jpg"
              alt="SMART CAMPUS Crest"
              referrerPolicy="no-referrer"
              onError={() => setCrestImgError(true)}
              className="h-11 w-11 rounded-xl object-cover ring-1 ring-white/30"
            />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">
              <ShieldCheck className="h-6 w-6" aria-hidden="true" />
            </div>
          )}
          <div>
            <span className="font-display text-lg font-bold tracking-tight text-white">
              SMART CAMPUS
            </span>
            <p className="text-xs text-blue-200">
              College Management & Academic ERP
            </p>
          </div>
        </div>

        <div className="relative z-10 max-w-lg p-10">
          <p className="text-xs font-semibold tracking-wide text-blue-200">
            Northbridge Institute of Technology
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold leading-tight text-white [text-wrap:balance]">
            Unified Portal for Administration, Faculty Scheduling, and Student Records
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-blue-100/90">
            Protected by bcrypt credential hashing, JWT session security, and role-based access control across 14 academic operations modules.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-5 border-t border-white/20 pt-6 text-white">
            <div>
              <p className="font-display text-lg font-bold">RBAC</p>
              <p className="mt-0.5 text-xs text-blue-200">Admin & Student roles</p>
            </div>
            <div>
              <p className="font-display text-lg font-bold">Conflict-Free</p>
              <p className="mt-0.5 text-xs text-blue-200">Room & exam checks</p>
            </div>
            <div>
              <p className="font-display text-lg font-bold">PDF / CSV</p>
              <p className="mt-0.5 text-xs text-blue-200">Transcripts & IDs</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex min-h-screen flex-col justify-between px-5 py-7 sm:px-10 lg:col-span-7 lg:px-16">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 lg:hidden">
            <img
              src="/src/assets/images/smart_campus_crest_1794839688853.jpg"
              alt="SMART CAMPUS Logo"
              referrerPolicy="no-referrer"
              className="h-9 w-9 rounded-lg object-cover"
            />
            <span className="font-display text-base font-bold text-[#0B1F3A] dark:text-white">
              SMART CAMPUS
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

        <div className="mx-auto w-full max-w-lg py-6">
          {mode === 'login' && (
            <div>
              <div className="flex items-center gap-3">
                <img
                  src="/src/assets/images/smart_campus_crest_1794839688853.jpg"
                  alt="SMART CAMPUS Institutional Logo"
                  referrerPolicy="no-referrer"
                  className="hidden h-11 w-11 rounded-xl object-cover sm:block"
                />
                <div>
                  <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    SMART CAMPUS Login
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Sign in with your Administrator or Student User ID.
                  </p>
                </div>
              </div>

              <form onSubmit={handleLoginSubmit} noValidate className="mt-7 space-y-4">
                {loginError && (
                  <div
                    role="alert"
                    className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{loginError}</span>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="login-userid"
                    className="mb-1.5 block text-sm font-medium text-slate-800 dark:text-slate-200"
                  >
                    User ID
                  </label>
                  <div className="relative">
                    <User
                      className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                      aria-hidden="true"
                    />
                    <input
                      id="login-userid"
                      type="text"
                      value={loginUserId}
                      onChange={(e) => setLoginUserId(e.target.value)}
                      placeholder="e.g., ADM202601 or STU202601"
                      className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 font-mono text-sm uppercase text-slate-900 focus-visible:border-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="login-pass"
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
                      id="login-pass"
                      type={showLoginPass ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-11 text-sm text-slate-900 focus-visible:border-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPass((v) => !v)}
                      aria-label={showLoginPass ? 'Hide password' : 'Show password'}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    >
                      {showLoginPass ? (
                        <EyeOff className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
                    />
                    <span>Remember me</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setForgotError('');
                      setForgotStep('request');
                      setMode('forgot');
                    }}
                    className="text-sm font-medium text-blue-700 hover:underline dark:text-blue-400"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0B1F3A] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#13325C] disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-500"
                >
                  <span>{loginLoading ? 'Signing In...' : 'Login'}</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </form>

              <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-5 text-sm dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">
                  New admitted student?
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setRegError('');
                    setMode('register');
                  }}
                  className="inline-flex items-center gap-1.5 font-semibold text-blue-700 hover:underline dark:text-blue-400"
                >
                  <UserPlus className="h-4 w-4" aria-hidden="true" />
                  <span>Create Account</span>
                </button>
              </div>

              <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50/70 p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Quick Role Demo Access
                </p>
                <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => applyDemoUser('ADMIN')}
                    className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-left transition-colors hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
                  >
                    <p className="text-xs font-bold text-[#0B1F3A] dark:text-blue-300">
                      Admin Role
                    </p>
                    <p className="font-mono text-xs text-slate-600 dark:text-slate-400">
                      ADM202601 / admin123
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyDemoUser('STUDENT')}
                    className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-left transition-colors hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
                  >
                    <p className="text-xs font-bold text-blue-700 dark:text-blue-400">
                      Student Role
                    </p>
                    <p className="font-mono text-xs text-slate-600 dark:text-slate-400">
                      STU202601 / student123
                    </p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {mode === 'register' && (
            <div>
              <button
                type="button"
                onClick={() => setMode('login')}
                className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:underline dark:text-blue-400"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Return to Login</span>
              </button>

              <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Create Student Account
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Link your portal account to your active college Student ID (e.g., STU202603–STU202609). Admin accounts require administrator authorization.
              </p>

              <form onSubmit={handleRegisterSubmit} noValidate className="mt-6 space-y-4">
                {regError && (
                  <div
                    role="alert"
                    className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{regError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="reg-name"
                      className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300"
                    >
                      Full Name *
                    </label>
                    <input
                      id="reg-name"
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Liam OConnor"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="reg-stuid"
                      className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300"
                    >
                      Student ID *
                    </label>
                    <input
                      id="reg-stuid"
                      type="text"
                      value={regStudentId}
                      onChange={(e) => setRegStudentId(e.target.value)}
                      placeholder="STU202603"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm uppercase text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="reg-email"
                      className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300"
                    >
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                      <input
                        id="reg-email"
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="liam@smartcampus.edu"
                        className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="reg-phone"
                      className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300"
                    >
                      Phone Number *
                    </label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                      <input
                        id="reg-phone"
                        type="tel"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="+1 650 319 4402"
                        className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 font-mono text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="reg-course"
                    className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300"
                  >
                    Enrolled Course *
                  </label>
                  <select
                    id="reg-course"
                    value={regCourse}
                    onChange={(e) => setRegCourse(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  >
                    {COURSE_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="reg-pass"
                      className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300"
                    >
                      Password *
                    </label>
                    <div className="relative">
                      <input
                        id="reg-pass"
                        type={showRegPass ? 'text' : 'password'}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pr-9 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPass((v) => !v)}
                        aria-label="Toggle password visibility"
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400"
                      >
                        {showRegPass ? (
                          <EyeOff className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="reg-confirm"
                      className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300"
                    >
                      Confirm Password *
                    </label>
                    <input
                      id="reg-confirm"
                      type={showRegPass ? 'text' : 'password'}
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={regLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:opacity-60"
                >
                  <UserPlus className="h-4 w-4" aria-hidden="true" />
                  <span>{regLoading ? 'Creating Account...' : 'Create Account'}</span>
                </button>
              </form>
            </div>
          )}

          {mode === 'forgot' && (
            <div>
              <button
                type="button"
                onClick={() => setMode('login')}
                className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:underline dark:text-blue-400"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Return to Login</span>
              </button>

              <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Reset Account Password
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Verify your User ID and registered institutional email to generate a 6-digit security code.
              </p>

              {forgotError && (
                <div
                  role="alert"
                  className="mt-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{forgotError}</span>
                </div>
              )}

              {forgotStep === 'request' ? (
                <form onSubmit={handleForgotRequest} className="mt-6 space-y-4">
                  <div>
                    <label
                      htmlFor="fp-userid"
                      className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300"
                    >
                      User ID
                    </label>
                    <input
                      id="fp-userid"
                      type="text"
                      value={forgotUserId}
                      onChange={(e) => setForgotUserId(e.target.value)}
                      placeholder="e.g., STU202601"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 font-mono text-sm uppercase text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="fp-email"
                      className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300"
                    >
                      Registered Email Address
                    </label>
                    <input
                      id="fp-email"
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="aarav.sharma@smartcampus.edu"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
                  >
                    <KeyRound className="h-4 w-4" aria-hidden="true" />
                    <span>{forgotLoading ? 'Verifying...' : 'Send Reset Code'}</span>
                  </button>
                </form>
              ) : (
                <form onSubmit={handleForgotReset} className="mt-6 space-y-4">
                  {previewCode && (
                    <div className="flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                      <div>
                        <p className="font-semibold">Security Verification Code Issued</p>
                        <p className="mt-0.5 font-mono text-sm font-bold">{previewCode}</p>
                      </div>
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="fp-code"
                      className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300"
                    >
                      6-Digit Verification Code
                    </label>
                    <input
                      id="fp-code"
                      type="text"
                      value={forgotCode}
                      onChange={(e) => setForgotCode(e.target.value)}
                      placeholder="Enter 6-digit code"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 font-mono text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="fp-newpass"
                        className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300"
                      >
                        New Password
                      </label>
                      <input
                        id="fp-newpass"
                        type="password"
                        value={forgotNewPassword}
                        onChange={(e) => setForgotNewPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="fp-confirmpass"
                        className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300"
                      >
                        Confirm New Password
                      </label>
                      <input
                        id="fp-confirmpass"
                        type="password"
                        value={forgotConfirmPassword}
                        onChange={(e) => setForgotConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
                  >
                    <span>{forgotLoading ? 'Updating Password...' : 'Confirm Password Reset'}</span>
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-500 dark:text-slate-400">
          SMART CAMPUS · Protected Academic ERP · Northbridge Institute of Technology
        </p>
      </div>
    </div>
  );
}
