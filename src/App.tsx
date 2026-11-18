import { useCallback, useEffect, useState } from 'react';
import { ToastContainer } from './components/ToastContainer';
import { AuthPortal } from './components/campus/AuthPortal';
import { AttendanceModule } from './components/campus/AttendanceModule';
import { CampusShell } from './components/campus/CampusShell';
import { ClassroomsModule } from './components/campus/ClassroomsModule';
import { CourseRegistrationModule } from './components/campus/CourseRegistrationModule';
import { CoursesModule } from './components/campus/CoursesModule';
import { DashboardModule } from './components/campus/DashboardModule';
import { ExaminationsModule } from './components/campus/ExaminationsModule';
import { IdCardModule } from './components/campus/IdCardModule';
import { NotificationsModule } from './components/campus/NotificationsModule';
import { ReportsModule } from './components/campus/ReportsModule';
import { ResultsModule } from './components/campus/ResultsModule';
import { SettingsSecurityModule } from './components/campus/SettingsSecurityModule';
import { StudentsModule } from './components/campus/StudentsModule';
import { TimetableModule } from './components/campus/TimetableModule';
import { NavModule, StudentRecord, UserAccount } from './types/campus';
import { ToastMessage } from './types/student';
import {
  apiRequest,
  clearStoredToken,
  getStoredTheme,
  getStoredToken,
  saveStoredTheme,
  setStoredToken,
} from './utils/api';

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => getStoredTheme());
  const [user, setUser] = useState<Omit<UserAccount, 'passwordHash'> | null>(
    null
  );
  const [bootstrapping, setBootstrapping] = useState(true);
  const [activeModule, setActiveModule] = useState<NavModule>('dashboard');
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    saveStoredTheme(theme);
  }, [theme]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (type: ToastMessage['type'], title: string, message?: string) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { id, type, title, message }]);
      window.setTimeout(() => {
        dismissToast(id);
      }, 4200);
    },
    [dismissToast]
  );

  const refreshUnreadCount = useCallback(async () => {
    try {
      const res = await apiRequest<{
        notifications: Array<{ isRead: boolean }>;
      }>('/notifications');
      setUnreadNotifications(
        res.notifications.filter((n) => !n.isRead).length
      );
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setBootstrapping(false);
      return;
    }

    apiRequest<{
      user: Omit<UserAccount, 'passwordHash'>;
      student: StudentRecord | null;
    }>('/auth/me')
      .then((res) => {
        setUser(res.user);
        refreshUnreadCount();
      })
      .catch(() => {
        clearStoredToken();
        setUser(null);
      })
      .finally(() => {
        setBootstrapping(false);
      });
  }, [refreshUnreadCount]);

  const handleAuthenticated = (payload: {
    token: string;
    user: Omit<UserAccount, 'passwordHash'>;
    student: StudentRecord | null;
    rememberMe: boolean;
  }) => {
    setStoredToken(payload.token, payload.rememberMe);
    setUser(payload.user);
    setActiveModule('dashboard');
    refreshUnreadCount();
    addToast(
      'success',
      'Signed In',
      `Welcome, ${payload.user.fullName} (${payload.user.role}).`
    );
  };

  const handleLogout = async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch {
      // continue local cleanup
    }
    clearStoredToken();
    setUser(null);
    setActiveModule('dashboard');
    setUnreadNotifications(0);
    addToast('info', 'Signed Out', 'Your NANI CAMPUS session has ended.');
  };

  const handleToggleTheme = (explicit?: 'light' | 'dark') => {
    setTheme((prev) => explicit || (prev === 'dark' ? 'light' : 'dark'));
  };

  if (bootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-700 dark:bg-slate-950 dark:text-slate-300">
        <div className="text-center">
          <p className="font-display text-lg font-bold text-[#0B1F3A] dark:text-white">
            NANI CAMPUS
          </p>
          <p className="mt-1 text-xs text-slate-500">Verifying session...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {!user ? (
        <AuthPortal
          theme={theme}
          onToggleTheme={() => handleToggleTheme()}
          onAuthenticated={handleAuthenticated}
          onNotify={addToast}
        />
      ) : (
        <CampusShell
          user={user}
          activeModule={activeModule}
          unreadNotifications={unreadNotifications}
          theme={theme}
          onToggleTheme={() => handleToggleTheme()}
          onNavigate={setActiveModule}
          onLogout={handleLogout}
        >
          {activeModule === 'dashboard' && (
            <DashboardModule user={user} onNavigate={setActiveModule} />
          )}

          {activeModule === 'students' && (
            <StudentsModule user={user} onNotify={addToast} />
          )}

          {activeModule === 'attendance' && (
            <AttendanceModule user={user} onNotify={addToast} />
          )}

          {activeModule === 'timetable' && (
            <TimetableModule user={user} onNotify={addToast} />
          )}

          {activeModule === 'classrooms' && (
            <ClassroomsModule user={user} onNotify={addToast} />
          )}

          {activeModule === 'course-registration' && (
            <CourseRegistrationModule user={user} onNotify={addToast} />
          )}

          {activeModule === 'courses' && user.role === 'ADMIN' && (
            <CoursesModule onNotify={addToast} />
          )}

          {activeModule === 'examinations' && (
            <ExaminationsModule user={user} onNotify={addToast} />
          )}

          {activeModule === 'results' && (
            <ResultsModule user={user} onNotify={addToast} />
          )}

          {activeModule === 'id-card' && (
            <IdCardModule user={user} onNotify={addToast} />
          )}

          {activeModule === 'notifications' && (
            <NotificationsModule
              user={user}
              onRefreshUnread={refreshUnreadCount}
              onNotify={addToast}
            />
          )}

          {activeModule === 'reports' && user.role === 'ADMIN' && (
            <ReportsModule onNotify={addToast} />
          )}

          {activeModule === 'settings' && (
            <SettingsSecurityModule
              user={user}
              theme={theme}
              onSetTheme={(m) => handleToggleTheme(m)}
              onUserUpdated={setUser}
              onLogout={handleLogout}
              onNotify={addToast}
            />
          )}
        </CampusShell>
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}
