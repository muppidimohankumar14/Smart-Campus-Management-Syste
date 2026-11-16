import { useEffect } from 'react';
import {
  BookOpen,
  Calendar,
  Copy,
  Mail,
  Pencil,
  Phone,
  Printer,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { Student } from '../types/student';

interface StudentProfileModalProps {
  student: Student | null;
  onClose: () => void;
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
  onCopySuccess: (label: string) => void;
}

export function StudentProfileModal({
  student,
  onClose,
  onEdit,
  onDelete,
  onCopySuccess,
}: StudentProfileModalProps) {
  useEffect(() => {
    if (!student) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [student, onClose]);

  if (!student) return null;

  const initials = student.fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      onCopySuccess(label);
    } catch {
      onCopySuccess(label);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="student-profile-heading"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-[#0B1F3A] px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-500/25 font-display text-lg font-bold text-blue-100 ring-1 ring-blue-300/30">
                {initials || 'ST'}
              </div>
              <div>
                <p className="font-mono text-xs font-medium tracking-wide text-blue-200">
                  {student.id}
                </p>
                <h2
                  id="student-profile-heading"
                  className="mt-0.5 font-display text-xl font-bold text-white"
                >
                  {student.fullName}
                </h2>
                <p className="mt-0.5 text-sm text-blue-100/90">
                  {student.course}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close student profile"
              className="rounded-lg p-1.5 text-blue-200 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 no-print"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="divide-y divide-slate-200 px-6 py-4 dark:divide-slate-800">
          <div className="grid grid-cols-1 gap-4 py-3 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Student ID
              </p>
              <div className="mt-1 flex items-center gap-2">
                <span className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {student.id}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(student.id, 'Student ID')}
                  aria-label="Copy Student ID"
                  className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-blue-700 dark:hover:bg-slate-800 dark:hover:text-blue-400 no-print"
                >
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Age
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-slate-900 tabular-nums dark:text-slate-100">
                <User className="h-4 w-4 text-slate-400" aria-hidden="true" />
                <span>{student.age} years</span>
              </p>
            </div>
          </div>

          <div className="py-3">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Enrolled Program
            </p>
            <p className="mt-1 flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-slate-100">
              <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
              <span>{student.course}</span>
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 py-3 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Email Address
              </p>
              <div className="mt-1 flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                <a
                  href={`mailto:${student.email}`}
                  className="truncate text-sm font-medium text-blue-700 hover:underline dark:text-blue-400"
                >
                  {student.email}
                </a>
                <button
                  type="button"
                  onClick={() => handleCopy(student.email, 'Email address')}
                  aria-label="Copy Email Address"
                  className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-blue-700 dark:hover:bg-slate-800 dark:hover:text-blue-400 no-print"
                >
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Phone Number
              </p>
              <p className="mt-1 flex items-center gap-2 font-mono text-sm font-medium text-slate-900 tabular-nums dark:text-slate-100">
                <Phone className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                <span>{student.phone}</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 py-3 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Record Created
              </p>
              <p className="mt-1 flex items-center gap-2 text-xs text-slate-700 tabular-nums dark:text-slate-300">
                <Calendar className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                <span>{new Date(student.createdAt).toLocaleDateString()}</span>
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Last Modified
              </p>
              <p className="mt-1 flex items-center gap-2 text-xs text-slate-700 tabular-nums dark:text-slate-300">
                <Calendar className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                <span>{new Date(student.updatedAt).toLocaleDateString()}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/70 no-print">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 whitespace-nowrap shrink-0 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <Printer className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Print Summary</span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                onClose();
                onDelete(student);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3.5 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 whitespace-nowrap shrink-0 dark:border-red-900/60 dark:bg-slate-800 dark:text-red-400 dark:hover:bg-red-950/40"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Delete</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(student);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-800 whitespace-nowrap shrink-0 dark:bg-blue-600 dark:hover:bg-blue-500"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Edit Record</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
