import React, { useEffect, useState } from 'react';
import { Calendar, Clock, MapPin, Plus, Trash2, X } from 'lucide-react';
import { apiRequest } from '../../utils/api';
import {
  ClassroomRecord,
  CourseRecord,
  ExaminationRecord,
  UserAccount,
} from '../../types/campus';
import { ConfirmDialog } from '../ConfirmDialog';

interface ExaminationsModuleProps {
  user: Omit<UserAccount, 'passwordHash'>;
  onNotify: (
    type: 'success' | 'error' | 'info',
    title: string,
    message?: string
  ) => void;
}

export function ExaminationsModule({
  user,
  onNotify,
}: ExaminationsModuleProps) {
  const [exams, setExams] = useState<ExaminationRecord[]>([]);
  const [courses, setCourses] = useState<CourseRecord[]>([]);
  const [classrooms, setClassrooms] = useState<ClassroomRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ExaminationRecord | null>(
    null
  );

  const [formState, setFormState] = useState({
    examName: 'End-Semester Theory Examination',
    examType: 'Final' as ExaminationRecord['examType'],
    subject: '',
    course: 'B.Tech Computer Science',
    semester: '5',
    examDate: '2026-12-12',
    startTime: '09:30',
    endTime: '12:30',
    classroomNumber: 'AUD-01',
    maxMarks: '100',
  });

  const loadExams = async () => {
    setLoading(true);
    try {
      const [exRes, cRes, rRes] = await Promise.all([
        apiRequest<{ examinations: ExaminationRecord[] }>('/examinations'),
        apiRequest<{ courses: CourseRecord[] }>('/courses'),
        apiRequest<{ classrooms: ClassroomRecord[] }>('/classrooms'),
      ]);
      setExams(exRes.examinations);
      setCourses(cRes.courses);
      setClassrooms(rRes.classrooms);
    } catch (err) {
      onNotify(
        'error',
        'Load Failed',
        err instanceof Error ? err.message : 'Unable to fetch examinations.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, [user.userId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/examinations', {
        method: 'POST',
        body: JSON.stringify({
          ...formState,
          semester: Number(formState.semester),
          maxMarks: Number(formState.maxMarks),
        }),
      });
      onNotify(
        'success',
        'Examination Scheduled',
        `${formState.subject} scheduled in Room ${formState.classroomNumber}.`
      );
      setModalOpen(false);
      await loadExams();
    } catch (err) {
      onNotify(
        'error',
        'Schedule Conflict',
        err instanceof Error ? err.message : 'Unable to schedule examination.'
      );
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiRequest(`/examinations/${deleteTarget.id}`, { method: 'DELETE' });
      onNotify('success', 'Examination Cancelled', `${deleteTarget.subject} removed.`);
      setDeleteTarget(null);
      await loadExams();
    } catch (err) {
      onNotify(
        'error',
        'Delete Failed',
        err instanceof Error ? err.message : 'Unable to cancel examination.'
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {user.role === 'ADMIN'
              ? 'Examination Management'
              : 'Upcoming Examinations'}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {user.role === 'ADMIN'
              ? 'Schedule examinations and assign rooms with automatic classroom and timetable conflict detection.'
              : 'View upcoming exam dates, subject timings, and assigned examination halls.'}
          </p>
        </div>

        {user.role === 'ADMIN' && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800 whitespace-nowrap shrink-0"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Schedule Examination</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="h-56 animate-pulse rounded-xl bg-white dark:bg-slate-900" />
      ) : exams.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            No examinations scheduled
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Scheduled exams will appear here with room assignments.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {exams.map((exam) => (
            <section
              key={exam.id}
              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs font-semibold text-blue-700 dark:text-blue-400">
                      {exam.examType} · Semester {exam.semester} · Max {exam.maxMarks} Marks
                    </p>
                    <h2 className="mt-1 font-display text-lg font-bold text-slate-900 dark:text-white">
                      {exam.subject}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {exam.examName} · {exam.course}
                    </p>
                  </div>

                  {user.role === 'ADMIN' && (
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(exam)}
                      aria-label={`Delete ${exam.subject}`}
                      className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  )}
                </div>

                <div className="mt-4 space-y-2 border-t border-slate-200 pt-3 text-xs text-slate-700 dark:border-slate-800 dark:text-slate-300">
                  <p className="flex items-center gap-2 font-mono tabular-nums">
                    <Calendar className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                    <span>{exam.examDate}</span>
                  </p>
                  <p className="flex items-center gap-2 font-mono tabular-nums">
                    <Clock className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                    <span>
                      {exam.startTime} – {exam.endTime}
                    </span>
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                    <span>
                      Examination Room:{' '}
                      <strong className="font-mono">{exam.classroomNumber}</strong>
                    </span>
                  </p>
                </div>
              </div>
            </section>
          ))}
        </div>
      )}

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="w-full max-w-xl rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                Schedule Examination
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Examination Name *
                  </label>
                  <input
                    required
                    type="text"
                    value={formState.examName}
                    onChange={(e) =>
                      setFormState((p) => ({ ...p, examName: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Exam Type
                  </label>
                  <select
                    value={formState.examType}
                    onChange={(e) =>
                      setFormState((p) => ({
                        ...p,
                        examType: e.target.value as ExaminationRecord['examType'],
                      }))
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="Final">Final</option>
                    <option value="Mid-Term">Mid-Term</option>
                    <option value="Practical">Practical</option>
                    <option value="Internal Assessment">Internal Assessment</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Subject *
                  </label>
                  <input
                    required
                    type="text"
                    value={formState.subject}
                    onChange={(e) =>
                      setFormState((p) => ({ ...p, subject: e.target.value }))
                    }
                    placeholder="e.g., Computer Networks"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Course *
                  </label>
                  <select
                    value={formState.course}
                    onChange={(e) =>
                      setFormState((p) => ({ ...p, course: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    {courses.map((c) => (
                      <option key={c.courseCode} value={c.courseName}>
                        {c.courseName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Semester
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={8}
                    value={formState.semester}
                    onChange={(e) =>
                      setFormState((p) => ({ ...p, semester: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Max Marks
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={500}
                    value={formState.maxMarks}
                    onChange={(e) =>
                      setFormState((p) => ({ ...p, maxMarks: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div className="col-span-2">
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Classroom *
                  </label>
                  <select
                    value={formState.classroomNumber}
                    onChange={(e) =>
                      setFormState((p) => ({
                        ...p,
                        classroomNumber: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    {classrooms.map((r) => (
                      <option key={r.classroomId} value={r.roomNumber}>
                        {r.roomNumber} ({r.buildingName} · {r.capacity} seats)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Exam Date *
                  </label>
                  <input
                    required
                    type="date"
                    value={formState.examDate}
                    onChange={(e) =>
                      setFormState((p) => ({ ...p, examDate: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Start Time *
                  </label>
                  <input
                    required
                    type="time"
                    value={formState.startTime}
                    onChange={(e) =>
                      setFormState((p) => ({ ...p, startTime: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    End Time *
                  </label>
                  <input
                    required
                    type="time"
                    value={formState.endTime}
                    onChange={(e) =>
                      setFormState((p) => ({ ...p, endTime: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-700 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-800"
                >
                  Save Examination
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Cancel Examination"
        description={`Remove "${deleteTarget?.subject}" (${deleteTarget?.examDate}) from scheduled examinations?`}
        confirmLabel="Cancel Exam"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
