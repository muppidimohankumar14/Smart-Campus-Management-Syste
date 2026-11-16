import React, { useEffect, useState } from 'react';
import { BookOpen, Pencil, Plus, Trash2, Users, X } from 'lucide-react';
import { apiRequest } from '../../utils/api';
import { CourseRecord, StudentRecord } from '../../types/campus';
import { ConfirmDialog } from '../ConfirmDialog';

interface EnrichedCourse extends CourseRecord {
  enrolledStudents: number;
  registeredSeats: number;
  availableSeats: number;
}

interface CoursesModuleProps {
  onNotify: (
    type: 'success' | 'error' | 'info',
    title: string,
    message?: string
  ) => void;
}

export function CoursesModule({ onNotify }: CoursesModuleProps) {
  const [courses, setCourses] = useState<EnrichedCourse[]>([]);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EnrichedCourse | null>(null);

  const [assignModalCourse, setAssignModalCourse] =
    useState<EnrichedCourse | null>(null);
  const [assignStudentId, setAssignStudentId] = useState('');

  const [formState, setFormState] = useState({
    courseCode: '',
    courseName: '',
    description: '',
    duration: '4 Years',
    semesters: '8',
    credits: '160',
    semester: '1',
    faculty: '',
    registrationDeadline: '2026-12-30',
    maxCapacity: '60',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [cRes, sRes] = await Promise.all([
        apiRequest<{ courses: EnrichedCourse[] }>('/courses'),
        apiRequest<{ students: StudentRecord[] }>('/students'),
      ]);
      setCourses(cRes.courses);
      setStudents(sRes.students);
      if (sRes.students.length > 0 && !assignStudentId) {
        setAssignStudentId(sRes.students[0].studentId);
      }
    } catch (err) {
      onNotify(
        'error',
        'Load Failed',
        err instanceof Error ? err.message : 'Unable to load courses.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreate = () => {
    setEditingCode(null);
    setFormState({
      courseCode: '',
      courseName: '',
      description: '',
      duration: '4 Years',
      semesters: '8',
      credits: '160',
      semester: '1',
      faculty: '',
      registrationDeadline: '2026-12-30',
      maxCapacity: '60',
    });
    setModalOpen(true);
  };

  const openEdit = (course: EnrichedCourse) => {
    setEditingCode(course.courseCode);
    setFormState({
      courseCode: course.courseCode,
      courseName: course.courseName,
      description: course.description,
      duration: course.duration,
      semesters: String(course.semesters),
      credits: String(course.credits),
      semester: String(course.semester),
      faculty: course.faculty,
      registrationDeadline: course.registrationDeadline,
      maxCapacity: String(course.maxCapacity),
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formState,
        semesters: Number(formState.semesters),
        credits: Number(formState.credits),
        semester: Number(formState.semester),
        maxCapacity: Number(formState.maxCapacity),
      };
      if (editingCode) {
        await apiRequest(`/courses/${editingCode}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        onNotify('success', 'Course Updated', `${formState.courseCode} updated.`);
      } else {
        await apiRequest('/courses', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        onNotify('success', 'Course Created', `${formState.courseName} added.`);
      }
      setModalOpen(false);
      await loadData();
    } catch (err) {
      onNotify(
        'error',
        'Save Failed',
        err instanceof Error ? err.message : 'Unable to save course.'
      );
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiRequest(`/courses/${deleteTarget.courseCode}`, {
        method: 'DELETE',
      });
      onNotify('success', 'Course Deleted', `${deleteTarget.courseCode} removed.`);
      setDeleteTarget(null);
      await loadData();
    } catch (err) {
      onNotify(
        'error',
        'Delete Failed',
        err instanceof Error ? err.message : 'Unable to delete course.'
      );
    }
  };

  const handleAssignStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignModalCourse || !assignStudentId) return;
    try {
      await apiRequest(`/students/${assignStudentId}`, {
        method: 'PUT',
        body: JSON.stringify({ course: assignModalCourse.courseName }),
      });
      onNotify(
        'success',
        'Student Assigned',
        `Assigned ${assignStudentId} to ${assignModalCourse.courseName}.`
      );
      setAssignModalCourse(null);
      await loadData();
    } catch (err) {
      onNotify(
        'error',
        'Assignment Failed',
        err instanceof Error ? err.message : 'Unable to assign student.'
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Course Management
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Configure academic programs, credit structures, capacity limits, and student enrollments.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800 whitespace-nowrap shrink-0"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>Add Course</span>
        </button>
      </div>

      {loading ? (
        <div className="h-56 animate-pulse rounded-xl bg-white dark:bg-slate-900" />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {courses.map((course) => (
            <section
              key={course.courseCode}
              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs font-semibold text-blue-700 dark:text-blue-400">
                      {course.courseCode} · {course.duration} · {course.semesters}{' '}
                      {course.semesters === 1 ? 'Sem' : 'Semesters'}
                    </p>
                    <h2 className="mt-1 font-display text-lg font-bold text-slate-900 dark:text-white">
                      {course.courseName}
                    </h2>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(course)}
                      aria-label={`Edit ${course.courseName}`}
                      className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-700 dark:hover:bg-slate-800"
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(course)}
                      aria-label={`Delete ${course.courseName}`}
                      className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  {course.description}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-3 text-xs dark:bg-slate-800/60">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Credits:</span>{' '}
                    <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                      {course.credits}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Lead Faculty:</span>{' '}
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {course.faculty}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Deadline:</span>{' '}
                    <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                      {course.registrationDeadline}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Capacity:</span>{' '}
                    <span className="font-mono font-semibold text-slate-900 tabular-nums dark:text-slate-100">
                      {course.enrolledStudents} enrolled / {course.maxCapacity} max
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3 dark:border-slate-800">
                <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <BookOpen className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
                  <span>{course.availableSeats} registration seats open</span>
                </span>
                <button
                  type="button"
                  onClick={() => setAssignModalCourse(course)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800 hover:bg-blue-100 dark:border-blue-900/60 dark:bg-blue-950/50 dark:text-blue-300"
                >
                  <Users className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Assign Student</span>
                </button>
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
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                {editingCode ? 'Edit Course' : 'Add New Course'}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Course Code *
                  </label>
                  <input
                    required
                    disabled={Boolean(editingCode)}
                    type="text"
                    value={formState.courseCode}
                    onChange={(e) =>
                      setFormState((p) => ({ ...p, courseCode: e.target.value }))
                    }
                    placeholder="CS601"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm uppercase disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Course Name *
                  </label>
                  <input
                    required
                    type="text"
                    value={formState.courseName}
                    onChange={(e) =>
                      setFormState((p) => ({ ...p, courseName: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Course Description
                </label>
                <textarea
                  rows={2}
                  value={formState.description}
                  onChange={(e) =>
                    setFormState((p) => ({ ...p, description: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Duration
                  </label>
                  <input
                    type="text"
                    value={formState.duration}
                    onChange={(e) =>
                      setFormState((p) => ({ ...p, duration: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Total Semesters
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={formState.semesters}
                    onChange={(e) =>
                      setFormState((p) => ({ ...p, semesters: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Credits
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={300}
                    value={formState.credits}
                    onChange={(e) =>
                      setFormState((p) => ({ ...p, credits: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Max Capacity
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={500}
                    value={formState.maxCapacity}
                    onChange={(e) =>
                      setFormState((p) => ({ ...p, maxCapacity: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Assigned Faculty
                  </label>
                  <input
                    type="text"
                    value={formState.faculty}
                    onChange={(e) =>
                      setFormState((p) => ({ ...p, faculty: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Reg. Deadline
                  </label>
                  <input
                    type="date"
                    value={formState.registrationDeadline}
                    onChange={(e) =>
                      setFormState((p) => ({
                        ...p,
                        registrationDeadline: e.target.value,
                      }))
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
                  {editingCode ? 'Update Course' : 'Save Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {assignModalCourse && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          onClick={() => setAssignModalCourse(null)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
              Assign Student to {assignModalCourse.courseName}
            </h2>
            <form onSubmit={handleAssignStudent} className="mt-4 space-y-4">
              <select
                value={assignStudentId}
                onChange={(e) => setAssignStudentId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                {students.map((s) => (
                  <option key={s.studentId} value={s.studentId}>
                    {s.studentId} — {s.fullName} ({s.course})
                  </option>
                ))}
              </select>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAssignModalCourse(null)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800"
                >
                  Assign to Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete Course"
        description={`Delete ${deleteTarget?.courseName} (${deleteTarget?.courseCode}) from the course catalog?`}
        confirmLabel="Delete Course"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
