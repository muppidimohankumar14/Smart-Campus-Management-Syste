import { ArrowRight, UserPlus } from 'lucide-react';
import { NavSection, Student } from '../types/student';
import { StudentForm } from './StudentForm';

interface AddStudentViewProps {
  students: Student[];
  courses: string[];
  prefillId?: string;
  onAddStudent: (data: {
    id: string;
    fullName: string;
    age: number;
    course: string;
    email: string;
    phone: string;
  }) => void;
  onNavigate: (section: NavSection) => void;
  onViewProfile: (student: Student) => void;
}

export function AddStudentView({
  students,
  courses,
  prefillId,
  onAddStudent,
  onNavigate,
  onViewProfile,
}: AddStudentViewProps) {
  const latestThree = [...students]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 3);

  const suggestedNextId = `STU2026${String(students.length + 1).padStart(2, '0')}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Add New Student
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Enter verified student details below. Duplicate Student IDs are automatically prevented.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('view-students')}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          <span>View All Records ({students.length})</span>
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-8 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-6 flex items-center gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
              <UserPlus className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                Student Registration Form
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                All six fields are required and saved immediately to LocalStorage.
              </p>
            </div>
          </div>

          <StudentForm
            mode="create"
            prefillId={prefillId}
            existingStudents={students}
            courses={courses}
            onSubmit={onAddStudent}
          />
        </section>

        <aside className="space-y-6 lg:col-span-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
              ID Format Reference
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              Student IDs are normalized to uppercase and checked across all existing records to guarantee uniqueness.
            </p>
            <div className="mt-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-800/70">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Next suggested sequence
              </p>
              <p className="mt-0.5 font-mono text-sm font-semibold text-blue-700 dark:text-blue-400">
                {suggestedNextId}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
              Latest Registered
            </h3>
            {latestThree.length === 0 ? (
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                No students have been registered yet.
              </p>
            ) : (
              <div className="mt-3 divide-y divide-slate-200 dark:divide-slate-800">
                {latestThree.map((student) => (
                  <button
                    key={student.id}
                    type="button"
                    onClick={() => onViewProfile(student)}
                    className="block w-full py-2.5 text-left transition-colors hover:text-blue-700 dark:hover:text-blue-400"
                  >
                    <p className="font-mono text-xs font-semibold text-blue-700 dark:text-blue-400">
                      {student.id}
                    </p>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {student.fullName}
                    </p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {student.course}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
