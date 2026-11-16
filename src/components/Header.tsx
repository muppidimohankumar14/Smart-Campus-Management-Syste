import { Menu, Moon, Sun, UserPlus } from 'lucide-react';
import { NavSection, ThemeMode } from '../types/student';

interface HeaderProps {
  activeSection: NavSection;
  institution: string;
  theme: ThemeMode;
  onOpenMobileMenu: () => void;
  onToggleTheme: () => void;
  onQuickAddStudent: () => void;
}

const SECTION_LABELS: Record<NavSection, string> = {
  dashboard: 'Dashboard',
  'add-student': 'Add Student',
  'view-students': 'View Students',
  'search-student': 'Search Student',
  'manage-students': 'Manage Students',
  settings: 'Settings',
};

export function Header({
  activeSection,
  institution,
  theme,
  onOpenMobileMenu,
  onToggleTheme,
  onQuickAddStudent,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-4 backdrop-blur-sm sm:px-6 lg:px-8 dark:border-slate-800 dark:bg-slate-900/95 no-print">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Open navigation menu"
          className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 lg:hidden dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>

        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-sm">
          <span className="hidden truncate text-slate-500 sm:inline dark:text-slate-400">
            {institution}
          </span>
          <span
            aria-hidden="true"
            className="hidden text-slate-300 sm:inline dark:text-slate-700"
          >
            /
          </span>
          <span className="truncate font-display font-semibold text-slate-900 dark:text-white">
            {SECTION_LABELS[activeSection]}
          </span>
        </nav>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4 text-amber-400" aria-hidden="true" />
          ) : (
            <Moon className="h-4 w-4 text-blue-700" aria-hidden="true" />
          )}
        </button>

        {activeSection !== 'add-student' && (
          <button
            type="button"
            onClick={onQuickAddStudent}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 whitespace-nowrap shrink-0 dark:bg-blue-600 dark:hover:bg-blue-500"
          >
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            <span>Add Student</span>
          </button>
        )}
      </div>
    </header>
  );
}
