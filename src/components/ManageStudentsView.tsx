import { useEffect, useMemo, useState } from 'react';
import {
  Eye,
  Pencil,
  Search,
  SlidersHorizontal,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { NavSection, Student } from '../types/student';
import { StudentForm } from './StudentForm';

interface ManageStudentsViewProps {
  students: Student[];
  courses: string[];
  onNavigate: (section: NavSection) => void;
  onUpdateStudent: (
    originalId: string,
    updated: {
      id: string;
      fullName: string;
      age: number;
      course: string;
      email: string;
      phone: string;
    }
  ) => void;
  onDeleteStudent: (student: Student) => void;
  onViewProfile: (student: Student) => void;
}

export function ManageStudentsView({
  students,
  courses,
  onNavigate,
  onUpdateStudent,
  onDeleteStudent,
  onViewProfile,
}: ManageStudentsViewProps) {
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(
    students[0]?.id || null
  );

  const filteredStudents = useMemo(() => {
    const query = filterQuery.trim().toLowerCase();
    if (!query) return students;
    return students.filter(
      (s) =>
        s.id.toLowerCase().includes(query) ||
        s.fullName.toLowerCase().includes(query) ||
        s.course.toLowerCase().includes(query)
    );
  }, [students, filterQuery]);

  useEffect(() => {
    if (students.length === 0) {
      setSelectedId(null);
      return;
    }
    const stillExists = students.some((s) => s.id === selectedId);
    if (!stillExists) {
      setSelectedId(students[0].id);
    }
  }, [students, selectedId]);

  const selectedStudent =
    students.find((s) => s.id === selectedId) || null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Manage Students
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Select a student record to edit details inline or remove it from the registry.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('add-student')}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-800 whitespace-nowrap shrink-0 dark:bg-blue-600 dark:hover:bg-blue-500"
        >
          <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Add New Student</span>
        </button>
      </div>

      {students.length === 0 ? (
        <section className="rounded-xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
            <SlidersHorizontal className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="mt-4 font-display text-lg font-bold text-slate-900 dark:text-white">
            No Records Available to Manage
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Add a student record first, then return here to edit or delete entries.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('add-student')}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800"
          >
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            <span>Add First Student</span>
          </button>
        </section>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <section className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white lg:col-span-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-200 p-4 dark:border-slate-800">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  placeholder="Find student to edit..."
                  aria-label="Filter student list"
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 focus-visible:border-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="max-h-[540px] divide-y divide-slate-200 overflow-y-auto dark:divide-slate-800">
              {filteredStudents.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
                  No students match "{filterQuery}".
                </div>
              ) : (
                filteredStudents.map((student) => {
                  const isSelected = student.id === selectedStudent?.id;
                  return (
                    <div
                      key={student.id}
                      className={`flex items-center justify-between gap-3 px-4 py-3 transition-colors ${
                        isSelected
                          ? 'bg-blue-50/80 dark:bg-blue-950/35'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedId(student.id)}
                        className="min-w-0 flex-1 text-left focus-visible:outline-none"
                      >
                        <p className="font-mono text-xs font-semibold text-blue-700 dark:text-blue-400">
                          {student.id}
                        </p>
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {student.fullName}
                        </p>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                          {student.course}
                        </p>
                      </button>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => onViewProfile(student)}
                          aria-label={`View profile for ${student.fullName}`}
                          className="rounded-md p-1.5 text-slate-500 hover:bg-white hover:text-blue-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-blue-400"
                        >
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteStudent(student)}
                          aria-label={`Delete ${student.fullName}`}
                          className="rounded-md p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-7 dark:border-slate-800 dark:bg-slate-900">
            {selectedStudent ? (
              <>
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <div>
                      <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                        Edit Student Details
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Currently editing{' '}
                        <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                          {selectedStudent.id}
                        </span>{' '}
                        · {selectedStudent.fullName}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onDeleteStudent(selectedStudent)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 whitespace-nowrap shrink-0 dark:border-red-900/60 dark:bg-slate-800 dark:text-red-400 dark:hover:bg-red-950/40"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Delete Record</span>
                  </button>
                </div>

                <StudentForm
                  mode="edit"
                  initialStudent={selectedStudent}
                  existingStudents={students}
                  courses={courses}
                  onSubmit={(data) => {
                    onUpdateStudent(selectedStudent.id, data);
                    setSelectedId(data.id);
                  }}
                />
              </>
            ) : (
              <div className="py-16 text-center text-sm text-slate-500 dark:text-slate-400">
                Select a student from the left list to edit or delete their record.
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
