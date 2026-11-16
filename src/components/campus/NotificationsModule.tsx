import React, { useEffect, useState } from 'react';
import { Bell, Check, CheckCheck, Plus, X } from 'lucide-react';
import { apiRequest } from '../../utils/api';
import {
  NotificationCategory,
  NotificationRecord,
  UserAccount,
} from '../../types/campus';

interface NotificationItem extends NotificationRecord {
  isRead: boolean;
}

interface NotificationsModuleProps {
  user: Omit<UserAccount, 'passwordHash'>;
  onRefreshUnread: () => void;
  onNotify: (
    type: 'success' | 'error' | 'info',
    title: string,
    message?: string
  ) => void;
}

export function NotificationsModule({
  user,
  onRefreshUnread,
  onNotify,
}: NotificationsModuleProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [composeOpen, setComposeOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState<NotificationCategory>('Announcement');
  const [targetRole, setTargetRole] = useState<'ALL' | 'STUDENT' | 'ADMIN'>('ALL');

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{ notifications: NotificationItem[] }>(
        '/notifications'
      );
      setNotifications(res.notifications);
    } catch (err) {
      onNotify(
        'error',
        'Load Failed',
        err instanceof Error ? err.message : 'Unable to fetch notifications.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [user.userId]);

  const handleMarkRead = async (id: string) => {
    try {
      await apiRequest(`/notifications/${id}/read`, { method: 'PUT' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      onRefreshUnread();
    } catch {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiRequest('/notifications/read-all', { method: 'PUT' });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      onRefreshUnread();
      onNotify('success', 'Notifications Updated', 'All notifications marked as read.');
    } catch {
      // ignore
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/notifications', {
        method: 'POST',
        body: JSON.stringify({ title, message, category, targetRole }),
      });
      onNotify('success', 'Notification Sent', 'Broadcast published to campus users.');
      setComposeOpen(false);
      setTitle('');
      setMessage('');
      await loadNotifications();
      onRefreshUnread();
    } catch (err) {
      onNotify(
        'error',
        'Publish Failed',
        err instanceof Error ? err.message : 'Unable to publish notification.'
      );
    }
  };

  const filtered = notifications.filter((n) =>
    filterCategory === 'ALL' ? true : n.category === filterCategory
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Notifications & Announcements
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Campus announcements, attendance alerts, exam reminders, and result publications.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Mark All Read</span>
          </button>
          {user.role === 'ADMIN' && (
            <button
              type="button"
              onClick={() => setComposeOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>New Announcement</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {[
          'ALL',
          'Announcement',
          'Attendance',
          'Examination',
          'Result',
          'Registration',
          'Timetable',
        ].map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilterCategory(cat)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              filterCategory === cat
                ? 'bg-[#0B1F3A] text-white dark:bg-blue-600'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
            }`}
          >
            {cat === 'ALL' ? 'All Categories' : cat}
          </button>
        ))}
      </div>

      <section className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Loading notifications...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" />
            <p className="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
              No notifications in this category
            </p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className={`flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-start ${
                !item.isRead ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
              }`}
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-semibold text-blue-700 dark:text-blue-400">
                    {item.category}
                  </span>
                  <span aria-hidden="true" className="text-slate-300">
                    ·
                  </span>
                  <span className="font-mono text-slate-500 tabular-nums">
                    {new Date(item.createdAt).toLocaleString()}
                  </span>
                  <span aria-hidden="true" className="text-slate-300">
                    ·
                  </span>
                  <span
                    className={`font-semibold ${
                      item.isRead
                        ? 'text-slate-400'
                        : 'text-emerald-700 dark:text-emerald-400'
                    }`}
                  >
                    {item.isRead ? 'Read' : 'Unread'}
                  </span>
                </div>
                <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                  {item.title}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {item.message}
                </p>
              </div>

              {!item.isRead && (
                <button
                  type="button"
                  onClick={() => handleMarkRead(item.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Mark Read</span>
                </button>
              )}
            </div>
          ))
        )}
      </section>

      {composeOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          onClick={() => setComposeOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                Publish Campus Notification
              </h2>
              <button
                type="button"
                onClick={() => setComposeOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handlePublish} className="space-y-4 p-6">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Title *
                </label>
                <input
                  required
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) =>
                      setCategory(e.target.value as NotificationCategory)
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="Announcement">Announcement</option>
                    <option value="Attendance">Attendance</option>
                    <option value="Examination">Examination</option>
                    <option value="Result">Result</option>
                    <option value="Registration">Registration</option>
                    <option value="Timetable">Timetable</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Target Audience
                  </label>
                  <select
                    value={targetRole}
                    onChange={(e) =>
                      setTargetRole(e.target.value as 'ALL' | 'STUDENT' | 'ADMIN')
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="ALL">All Users</option>
                    <option value="STUDENT">Students Only</option>
                    <option value="ADMIN">Admins Only</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Message *
                </label>
                <textarea
                  required
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setComposeOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-700 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-800"
                >
                  Send Notification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
