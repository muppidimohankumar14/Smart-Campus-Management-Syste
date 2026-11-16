import React, { useRef, useState } from 'react';
import {
  BookOpen,
  Check,
  Download,
  Moon,
  Plus,
  RotateCcw,
  Sun,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { AdminProfile, Student, ThemeMode } from '../types/student';
import {
  exportStudentsToCsv,
  exportStudentsToJson,
} from '../utils/storage';

interface SettingsViewProps {
  theme: ThemeMode;
  adminProfile: AdminProfile;
  courses: string[];
  students: Student[];
  onToggleTheme: (mode: ThemeMode) => void;
  onSaveAdminProfile: (profile: AdminProfile) => void;
  onAddCourse: (courseName: string) => void;
  onRemoveCourse: (courseName: string) => void;
  onImportStudents: (imported: Student[]) => void;
  onRequestRestoreSample: () => void;
  onRequestClearAll: () => void;
  onNotify: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export function SettingsView({
  theme,
  adminProfile,
  courses,
  students,
  onToggleTheme,
  onSaveAdminProfile,
  onAddCourse,
  onRemoveCourse,
  onImportStudents,
  onRequestRestoreSample,
  onRequestClearAll,
  onNotify,
}: SettingsViewProps) {
  const [profileForm, setProfileForm] = useState<AdminProfile>(adminProfile);
  const [newCourse, setNewCourse] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleProfileSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!profileForm.name.trim() || !profileForm.institution.trim()) {
      onNotify('error', 'Missing Profile Fields', 'Administrator name and institution are required.');
      return;
    }
    onSaveAdminProfile({
      ...profileForm,
      name: profileForm.name.trim(),
      title: profileForm.title.trim() || 'Academic Registrar',
      institution: profileForm.institution.trim(),
      email: profileForm.email.trim(),
      username: profileForm.username.trim() || 'admin',
    });
  };

  const handleCreateCourse = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = newCourse.trim();
    if (!trimmed) return;
    if (courses.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      onNotify('error', 'Duplicate Course', `"${trimmed}" is already in the course catalog.`);
      return;
    }
    onAddCourse(trimmed);
    setNewCourse('');
  };

  const handleImportJson = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) {
        throw new Error('JSON file must contain an array of student records.');
      }
      const validRecords: Student[] = parsed.filter(
        (item) =>
          item &&
          typeof item.id === 'string' &&
          typeof item.fullName === 'string' &&
          typeof item.age === 'number' &&
          typeof item.course === 'string' &&
          typeof item.email === 'string' &&
          typeof item.phone === 'string'
      );

      if (validRecords.length === 0) {
        onNotify('error', 'Invalid Backup File', 'No valid student records were found in the selected JSON file.');
      } else {
        onImportStudents(validRecords);
      }
    } catch {
      onNotify('error', 'Import Failed', 'Unable to parse the selected JSON backup file.');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          System Settings
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Customize appearance, registrar profile, course catalog, and browser LocalStorage backups.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
            Appearance & Theme
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Choose between crisp daylight mode and low-glare dark mode.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onToggleTheme('light')}
              className={`flex items-center justify-center gap-2.5 rounded-lg border px-4 py-3 text-sm font-semibold transition-colors ${
                theme === 'light'
                  ? 'border-blue-600 bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              <Sun className="h-4 w-4" aria-hidden="true" />
              <span>Light Mode</span>
            </button>

            <button
              type="button"
              onClick={() => onToggleTheme('dark')}
              className={`flex items-center justify-center gap-2.5 rounded-lg border px-4 py-3 text-sm font-semibold transition-colors ${
                theme === 'dark'
                  ? 'border-blue-500 bg-blue-950/60 text-blue-300'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              <Moon className="h-4 w-4" aria-hidden="true" />
              <span>Dark Mode</span>
            </button>
          </div>

          <div className="mt-8 border-t border-slate-200 pt-6 dark:border-slate-800">
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
              Registrar Profile
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Displayed in the sidebar and institutional headers.
            </p>

            <form onSubmit={handleProfileSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="admin-name"
                    className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300"
                  >
                    Administrator Name
                  </label>
                  <input
                    id="admin-name"
                    type="text"
                    value={profileForm.name}
                    onChange={(e) =>
                      setProfileForm((p) => ({ ...p, name: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:border-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label
                    htmlFor="admin-title"
                    className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300"
                  >
                    Role / Title
                  </label>
                  <input
                    id="admin-title"
                    type="text"
                    value={profileForm.title}
                    onChange={(e) =>
                      setProfileForm((p) => ({ ...p, title: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:border-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="admin-institution"
                  className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  Institution Name
                </label>
                <input
                  id="admin-institution"
                  type="text"
                  value={profileForm.institution}
                  onChange={(e) =>
                    setProfileForm((p) => ({
                      ...p,
                      institution: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:border-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="admin-email"
                    className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300"
                  >
                    Contact Email
                  </label>
                  <input
                    id="admin-email"
                    type="email"
                    value={profileForm.email}
                    onChange={(e) =>
                      setProfileForm((p) => ({ ...p, email: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:border-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label
                    htmlFor="admin-username"
                    className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300"
                  >
                    Login Username
                  </label>
                  <input
                    id="admin-username"
                    type="text"
                    value={profileForm.username}
                    onChange={(e) =>
                      setProfileForm((p) => ({
                        ...p,
                        username: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm text-slate-900 focus-visible:border-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
                >
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Save Profile</span>
                </button>
              </div>
            </form>
          </div>
        </section>

        <div className="space-y-6 lg:col-span-6">
          <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                  Course Catalog
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Manage courses available in student registration dropdowns.
                </p>
              </div>
              <span className="font-mono text-xs text-slate-500 tabular-nums dark:text-slate-400">
                {courses.length} courses
              </span>
            </div>

            <form onSubmit={handleCreateCourse} className="mt-4 flex gap-2">
              <input
                type="text"
                value={newCourse}
                onChange={(e) => setNewCourse(e.target.value)}
                placeholder="Add new course (e.g., B.Tech Robotics)"
                aria-label="New course name"
                className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:border-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-800 whitespace-nowrap shrink-0 dark:bg-blue-600 dark:hover:bg-blue-500"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Add</span>
              </button>
            </form>

            <div className="mt-4 max-h-56 divide-y divide-slate-200 overflow-y-auto rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
              {courses.map((course) => (
                <div
                  key={course}
                  className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm"
                >
                  <span className="flex items-center gap-2 truncate text-slate-800 dark:text-slate-200">
                    <BookOpen className="h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                    <span className="truncate">{course}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemoveCourse(course)}
                    disabled={courses.length <= 1}
                    aria-label={`Remove ${course}`}
                    className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
              LocalStorage Data Management
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Currently storing{' '}
              <span className="font-mono font-semibold text-slate-800 tabular-nums dark:text-slate-200">
                {students.length}
              </span>{' '}
              student records locally in your browser.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  exportStudentsToCsv(students);
                  onNotify('success', 'CSV Exported', `${students.length} student records downloaded.`);
                }}
                disabled={students.length === 0}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Export CSV</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  exportStudentsToJson(students);
                  onNotify('success', 'JSON Backup Exported', `${students.length} records saved as JSON.`);
                }}
                disabled={students.length === 0}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Backup JSON</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Import JSON</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                onChange={handleImportJson}
                className="hidden"
              />

              <button
                type="button"
                onClick={onRequestRestoreSample}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-2.5 text-xs font-semibold text-blue-800 transition-colors hover:bg-blue-100 dark:border-blue-900/70 dark:bg-blue-950/50 dark:text-blue-300 dark:hover:bg-blue-900/60"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Restore Sample Data</span>
              </button>
            </div>

            <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800">
              <button
                type="button"
                onClick={onRequestClearAll}
                disabled={students.length === 0}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-red-900/60 dark:bg-slate-800 dark:text-red-400 dark:hover:bg-red-950/40"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Clear All Student Records</span>
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
