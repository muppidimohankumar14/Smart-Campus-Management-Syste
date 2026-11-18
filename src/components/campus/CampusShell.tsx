import React, { useState } from 'react';
import {
  Award,
  Bell,
  BookOpen,
  Building2,
  CalendarDays,
  ClipboardCheck,
  CreditCard,
  FileBarChart2,
  FileSpreadsheet,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Settings,
  Sun,
  Users,
  X,
} from 'lucide-react';
import { NavModule, UserAccount } from '../../types/campus';

interface CampusShellProps {
  user: Omit<UserAccount, 'passwordHash'>;
  activeModule: NavModule;
  unreadNotifications: number;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onNavigate: (module: NavModule) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

interface NavItemConfig {
  id: NavModule;
  label: string;
  studentLabel?: string;
  icon: typeof LayoutDashboard;
  roles: ('ADMIN' | 'STUDENT')[];
}

const NAV_ITEMS: NavItemConfig[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    roles: ['ADMIN', 'STUDENT'],
  },
  {
    id: 'students',
    label: 'Student Management',
    studentLabel: 'My Profile',
    icon: Users,
    roles: ['ADMIN', 'STUDENT'],
  },
  {
    id: 'attendance',
    label: 'Attendance',
    studentLabel: 'My Attendance',
    icon: ClipboardCheck,
    roles: ['ADMIN', 'STUDENT'],
  },
  {
    id: 'timetable',
    label: 'Timetable',
    studentLabel: 'My Timetable',
    icon: CalendarDays,
    roles: ['ADMIN', 'STUDENT'],
  },
  {
    id: 'classrooms',
    label: 'Classrooms',
    icon: Building2,
    roles: ['ADMIN', 'STUDENT'],
  },
  {
    id: 'course-registration',
    label: 'Course Registration',
    icon: BookOpen,
    roles: ['ADMIN', 'STUDENT'],
  },
  {
    id: 'courses',
    label: 'Course Management',
    icon: GraduationCap,
    roles: ['ADMIN'],
  },
  {
    id: 'examinations',
    label: 'Examinations',
    icon: FileSpreadsheet,
    roles: ['ADMIN', 'STUDENT'],
  },
  {
    id: 'results',
    label: 'Exam Results',
    icon: Award,
    roles: ['ADMIN', 'STUDENT'],
  },
  {
    id: 'id-card',
    label: 'ID Card Generator',
    studentLabel: 'My ID Card',
    icon: CreditCard,
    roles: ['ADMIN', 'STUDENT'],
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell,
    roles: ['ADMIN', 'STUDENT'],
  },
  {
    id: 'reports',
    label: 'Reports & Export',
    icon: FileBarChart2,
    roles: ['ADMIN'],
  },
  {
    id: 'settings',
    label: 'Settings & Security',
    icon: Settings,
    roles: ['ADMIN', 'STUDENT'],
  },
];

export function CampusShell({
  user,
  activeModule,
  unreadNotifications,
  theme,
  onToggleTheme,
  onNavigate,
  onLogout,
  children,
}: CampusShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [crestError, setCrestError] = useState(false);

  const visibleNav = NAV_ITEMS.filter((item) => item.roles.includes(user.role));
  const activeConfig = visibleNav.find((n) => n.id === activeModule);
  const activeTitle =
    user.role === 'STUDENT' && activeConfig?.studentLabel
      ? activeConfig.studentLabel
      : activeConfig?.label || 'Dashboard';

  const initials = user.fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

  const handleNav = (id: NavModule) => {
    onNavigate(id);
    setMobileOpen(false);
  };

  const sidebarBody = (
    <div className="flex h-full flex-col bg-[#0B1F3A] text-slate-100">
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
        <button
          type="button"
          onClick={() => handleNav('dashboard')}
          className="flex items-center gap-2.5 text-left"
        >
          {!crestError ? (
            <img
              src="/src/assets/images/smart_campus_crest_1794839688853.jpg"
              alt="NANI CAMPUS Logo"
              referrerPolicy="no-referrer"
              onError={() => setCrestError(true)}
              className="h-9 w-9 shrink-0 rounded-lg object-cover ring-1 ring-white/20"
            />
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
              <GraduationCap className="h-5 w-5" aria-hidden="true" />
            </div>
          )}
          <div>
            <span className="block font-display text-sm font-bold tracking-tight text-white">
              NANI CAMPUS
            </span>
            <span className="block text-[11px] text-blue-200/80">
              {user.role === 'ADMIN' ? 'Admin Console' : 'Student Portal'}
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation"
          className="rounded-lg p-1.5 text-blue-200 hover:bg-white/10 lg:hidden"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <nav
        aria-label="Campus modules"
        className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4"
      >
        {visibleNav.map((item) => {
          const Icon = item.icon;
          const label =
            user.role === 'STUDENT' && item.studentLabel
              ? item.studentLabel
              : item.label;
          const isActive = activeModule === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNav(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-blue-100/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2.5 truncate">
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{label}</span>
              </span>
              {item.id === 'notifications' && unreadNotifications > 0 && (
                <span className="ml-2 rounded-md bg-blue-500 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-white tabular-nums">
                  {unreadNotifications}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3.5">
        <div className="mb-3 flex items-center gap-3 px-1">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 font-display text-xs font-bold text-white">
            {initials || 'NC'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              {user.fullName}
            </p>
            <p className="truncate font-mono text-xs text-blue-200/80">
              {user.userId} · {user.role}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-blue-100/80 transition-colors hover:bg-red-500/20 hover:text-red-200"
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <aside className="hidden w-64 shrink-0 lg:block no-print">
        <div className="sticky top-0 h-screen">{sidebarBody}</div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 flex lg:hidden no-print"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-[2px]"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative z-10 h-full w-64 max-w-[82vw] shadow-2xl">
            {sidebarBody}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-4 backdrop-blur-sm sm:px-6 lg:px-8 dark:border-slate-800 dark:bg-slate-900/95 no-print">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
            <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-sm">
              <span className="hidden text-slate-500 sm:inline dark:text-slate-400">
                NANI CAMPUS
              </span>
              <span
                aria-hidden="true"
                className="hidden text-slate-300 sm:inline dark:text-slate-700"
              >
                /
              </span>
              <span className="truncate font-display font-semibold text-slate-900 dark:text-white">
                {activeTitle}
              </span>
            </nav>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => handleNav('notifications')}
              aria-label="Open notifications"
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <Bell className="h-4 w-4" aria-hidden="true" />
              {unreadNotifications > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-700 px-1 font-mono text-[10px] font-bold text-white">
                  {unreadNotifications}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 text-amber-400" aria-hidden="true" />
              ) : (
                <Moon className="h-4 w-4 text-blue-700" aria-hidden="true" />
              )}
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
