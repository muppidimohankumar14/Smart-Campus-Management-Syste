import React, { useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  Calendar,
  Eye,
  Mail,
  Pencil,
  Phone,
  Search,
  Trash2,
  User,
  UserPlus,
} from 'lucide-react';
import { Student } from '../types/student';
import { normalizeStudentId } from '../utils/validation';

interface SearchStudentViewProps {
  students: Student[];
  onViewProfile: (student: Student) => void;
  onEditStudent: (student: Student) => void;
  onDeleteStudent: (student: Student) => void;
  onRegisterMissingId: (studentId: string) => void;
}

export function SearchStudentView({
  students,
  onViewProfile,
  onEditStudent,
  onDeleteStudent,
  onRegisterMissingId,
}: SearchStudentViewProps) {
  const [queryId, setQueryId] = useState('');
  const [searchedId, setSearchedId] = useState<string | null>(null);

  const performLookup = (idToSearch: string) => {
    const normalized = normalizeStudentId(idToSearch);
    if (!normalized) {
      setSearchedId('');
      return;
    }
    setQueryId(normalized);
    setSearchedId(normalized);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    performLookup(queryId);
  };

  const matchedStudent =
    searchedId && searchedId.length > 0
      ? students.find(
          (student) => normalizeStudentId(student.id) === searchedId
        ) || null
      : null;

  const quickIds = students.slice(0, 5).map((s) => s.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Search Student by ID
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Enter an exact Student ID to retrieve complete academic and contact details.
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="text"
              value={queryId}
              onChange={(e) => setQueryId(e.target.value)}
              placeholder="Enter Student ID (e.g., STU202601)"
              aria-label="Student ID to search"
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 font-mono text-sm uppercase text-slate-900 transition-colors focus-visible:border-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 whitespace-nowrap shrink-0 dark:bg-blue-600 dark:hover:bg-blue-500"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            <span>Search Record</span>
          </button>
        </form>

        {quickIds.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Quick lookup:
            </span>
            {quickIds.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => performLookup(id)}
                className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-xs font-medium text-slate-700 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-blue-700 dark:hover:bg-blue-950/50 dark:hover:text-blue-400"
              >
                {id}
              </button>
            ))}
          </div>
        )}
      </section>

      {searchedId === '' && (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300"
        >
          <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span>Please enter a Student ID before searching.</span>
        </div>
      )}

      {searchedId && searchedId.length > 0 && !matchedStudent && (
        <section className="rounded-xl border border-red-200 bg-white p-8 text-center dark:border-red-900/50 dark:bg-slate-900">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
            <AlertCircle className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="mt-4 font-display text-lg font-bold text-slate-900 dark:text-white">
            Student Not Found
          </h2>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-600 dark:text-slate-400">
            No student record matches ID{' '}
            <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
              {searchedId}
            </span>
            . Verify the ID or register a new student with this identifier.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => onRegisterMissingId(searchedId)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
            >
              <UserPlus className="h-4 w-4" aria-hidden="true" />
              <span>Register {searchedId}</span>
            </button>
          </div>
        </section>
      )}

      {matchedStudent && (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-[#0B1F3A] px-6 py-5 text-white dark:border-slate-800">
            <div>
              <p className="font-mono text-xs font-semibold text-blue-200">
                {matchedStudent.id}
              </p>
              <h2 className="mt-0.5 font-display text-xl font-bold text-white">
                {matchedStudent.fullName}
              </h2>
              <p className="mt-0.5 text-sm text-blue-100/90">
                {matchedStudent.course}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onViewProfile(matchedStudent)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/25 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/20 whitespace-nowrap shrink-0"
              >
                <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Full Profile</span>
              </button>
              <button
                type="button"
                onClick={() => onEditStudent(matchedStudent)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-500 whitespace-nowrap shrink-0"
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Edit</span>
              </button>
              <button
                type="button"
                onClick={() => onDeleteStudent(matchedStudent)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-700 whitespace-nowrap shrink-0"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Delete</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Student ID
              </p>
              <p className="mt-1 font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">
                {matchedStudent.id}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Age
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-slate-900 tabular-nums dark:text-slate-100">
                <User className="h-4 w-4 text-slate-400" aria-hidden="true" />
                <span>{matchedStudent.age} years</span>
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Course
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-slate-900 dark:text-slate-100">
                <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                <span>{matchedStudent.course}</span>
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Email Address
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-900 dark:text-slate-100">
                <Mail className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                <a
                  href={`mailto:${matchedStudent.email}`}
                  className="truncate font-medium text-blue-700 hover:underline dark:text-blue-400"
                >
                  {matchedStudent.email}
                </a>
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Phone Number
              </p>
              <p className="mt-1 flex items-center gap-1.5 font-mono text-sm text-slate-900 tabular-nums dark:text-slate-100">
                <Phone className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                <span>{matchedStudent.phone}</span>
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Added On
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-700 tabular-nums dark:text-slate-300">
                <Calendar className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                <span>
                  {new Date(matchedStudent.createdAt).toLocaleDateString()}
                </span>
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
