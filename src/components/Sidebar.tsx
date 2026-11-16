import { useState } from 'react';
import {
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Search,
  Settings,
  SlidersHorizontal,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { AdminProfile, NavSection } from '../types/student';

interface SidebarProps {
  activeSection: NavSection;
  adminProfile: AdminProfile;
  studentCount: number;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onNavigate: (section: NavSection) => void;
  onLogout: () => void;
}

const NAV_ITEMS: {
  id: NavSection;
  label: string;
  icon: typeof LayoutDashboard;
}[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'add-student', label: 'Add Student', icon: UserPlus },
  { id: 'view-students', label: 'View Students', icon: Users },
  { id: 'search-student', label: 'Search Student', icon: Search },
  { id: 'manage-students', label: 'Manage Students', icon: SlidersHorizontal },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar({
  activeSection,
  adminProfile,
  studentCount,
  mobileOpen,
  onCloseMobile,
  onNavigate,
  onLogout,
}: SidebarProps) {
  const [avatarError, setAvatarError] = useState(false);

  const initials = adminProfile.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

  const handleNavClick = (section: NavSection) => {
    onNavigate(section);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-[#0B1F3A] text-slate-100">
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
        <button
          type="button"
          onClick={() => handleNavClick('dashboard')}
          className="flex items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded-lg"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
            <GraduationCap className="h-5 w-5" aria-hidden="true" />
          </div>
          <span className="font-display text-base font-bold tracking-tight text-white whitespace-nowrap">
            CampusCore
          </span>
        </button>

        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close navigation menu"
          className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10 hover:text-white lg:hidden"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <nav aria-label="Primary navigation" className="flex-1 space-y-1 px-3 py-5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex w-full items-center justify-between rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 whitespace-nowrap ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-blue-100/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-3">
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{item.label}</span>
              </span>
              {item.id === 'view-students' && (
                <span
                  className={`font-mono text-xs tabular-nums ${
                    isActive ? 'text-blue-100' : 'text-blue-200/70'
                  }`}
                >
                  {studentCount}
                </span>
              )}
            </button>
          );
        })}

        <div className="pt-3">
          <div className="border-t border-white/10 pt-3">
            <button
              type="button"
              onClick={onLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium text-blue-100/80 transition-colors hover:bg-red-500/15 hover:text-red-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 whitespace-nowrap"
            >
              <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3">
          {!avatarError ? (
            <img
              src="/src/assets/images/admin_registrar_avatar_1794838746324.jpg"
              alt={adminProfile.name}
              referrerPolicy="no-referrer"
              onError={() => setAvatarError(true)}
              className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-white/25"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 font-display text-xs font-bold text-white">
              {initials || 'AD'}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              {adminProfile.name}
            </p>
            <p className="truncate text-xs text-blue-200/75">
              {adminProfile.title}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden w-64 shrink-0 lg:block no-print">
        <div className="sticky top-0 h-screen">{sidebarContent}</div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 flex lg:hidden no-print"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
        >
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-[2px]"
            onClick={onCloseMobile}
          />
          <aside className="relative z-10 h-full w-64 max-w-[80vw] shadow-2xl">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
