import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Pencil, Plus, Trash2, X } from 'lucide-react';
import { apiRequest } from '../../utils/api';
import {
  ClassroomRecord,
  CourseRecord,
  DayOfWeek,
  TimetableEntry,
  UserAccount,
} from '../../types/campus';
import { ConfirmDialog } from '../ConfirmDialog';

interface TimetableModuleProps {
  user: Omit<UserAccount, 'passwordHash'>;
  onNotify: (
    type: 'success' | 'error' | 'info',
    title: string,
    message?: string
  ) => void;
}

const DAYS: DayOfWeek[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export function TimetableModule({ user, onNotify }: TimetableModuleProps) {
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [courses, setCourses] = useState<CourseRecord[]>([]);
  const [classrooms, setClassrooms] = useState<ClassroomRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [courseFilter, setCourseFilter] = useState('all');
  const [sectionFilter, setSectionFilter] = useState('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TimetableEntry | null>(null);

  const [formState, setFormState] = useState({
    day: 'Monday' as DayOfWeek,
    periodNumber: '1',
    subjectName: '',
    facultyName: '',
    startTime: '09:00',
    endTime: '10:00',
    classroomNumber: 'A-204',
    buildingName: 'Turing Academic Block',
    course: 'B.Tech Computer Science',
    section: 'A',
  });

  const loadTimetable = async () => {
    setLoading(true);
    try {
      const [ttRes, courseRes, roomRes] = await Promise.all([
        apiRequest<{ entries: TimetableEntry[] }>('/timetable'),
        apiRequest<{ courses: CourseRecord[] }>('/courses'),
        apiRequest<{ classrooms: ClassroomRecord[] }>('/classrooms'),
      ]);
      setEntries(ttRes.entries);
      setCourses(courseRes.courses);
      setClassrooms(roomRes.classrooms);
    } catch (err) {
      onNotify(
        'error',
        'Load Failed',
        err instanceof Error ? err.message : 'Unable to load timetable.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimetable();
  }, [user.userId]);

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      if (courseFilter !== 'all' && entry.course !== courseFilter) return false;
      if (sectionFilter !== 'all' && entry.section !== sectionFilter)
        return false;
      return true;
    });
  }, [entries, courseFilter, sectionFilter]);

  const openCreateModal = () => {
    setEditingEntry(null);
    setFormState({
      day: 'Monday',
      periodNumber: '1',
      subjectName: '',
      facultyName: '',
      startTime: '09:00',
      endTime: '10:00',
      classroomNumber: classrooms[0]?.roomNumber || 'A-204',
      buildingName: classrooms[0]?.buildingName || 'Turing Academic Block',
      course: courses[0]?.courseName || 'B.Tech Computer Science',
      section: 'A',
    });
    setModalOpen(true);
  };

  const openEditModal = (entry: TimetableEntry) => {
    setEditingEntry(entry);
    setFormState({
      day: entry.day,
      periodNumber: String(entry.periodNumber),
      subjectName: entry.subjectName,
      facultyName: entry.facultyName,
      startTime: entry.startTime,
      endTime: entry.endTime,
      classroomNumber: entry.classroomNumber,
      buildingName: entry.buildingName,
      course: entry.course,
      section: entry.section,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formState,
        periodNumber: Number(formState.periodNumber),
      };
      if (editingEntry) {
        await apiRequest(`/timetable/${editingEntry.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        onNotify('success', 'Timetable Updated', `${formState.subjectName} updated.`);
      } else {
        await apiRequest('/timetable', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        onNotify('success', 'Timetable Entry Added', `${formState.subjectName} scheduled.`);
      }
      setModalOpen(false);
      await loadTimetable();
    } catch (err) {
      onNotify(
        'error',
        'Schedule Conflict',
        err instanceof Error ? err.message : 'Unable to save timetable slot.'
      );
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiRequest(`/timetable/${deleteTarget.id}`, { method: 'DELETE' });
      onNotify('success', 'Slot Removed', `${deleteTarget.subjectName} deleted.`);
      setDeleteTarget(null);
      await loadTimetable();
    } catch (err) {
      onNotify(
        'error',
        'Delete Failed',
        err instanceof Error ? err.message : 'Unable to delete slot.'
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {user.role === 'ADMIN' ? 'Timetable Management' : 'My Weekly Timetable'}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Monday to Saturday class schedule with classroom and faculty conflict detection.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {user.role === 'ADMIN' && (
            <>
              <select
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                aria-label="Filter timetable by course"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="all">All Courses</option>
                {courses.map((c) => (
                  <option key={c.courseCode} value={c.courseName}>
                    {c.courseName}
                  </option>
                ))}
              </select>

              <select
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value)}
                aria-label="Filter timetable by section"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="all">All Sections</option>
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
              </select>

              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-800 whitespace-nowrap shrink-0"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span>Add Timetable Slot</span>
              </button>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className="h-64 animate-pulse rounded-xl bg-white dark:bg-slate-900" />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {DAYS.map((day) => {
            const daySlots = filteredEntries
              .filter((e) => e.day === day)
              .sort((a, b) => a.periodNumber - b.periodNumber || a.startTime.localeCompare(b.startTime));

            return (
              <section
                key={day}
                className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-center justify-between border-b border-slate-200 bg-[#0B1F3A] px-4 py-3 text-white dark:border-slate-800">
                  <span className="flex items-center gap-2 font-display text-sm font-bold">
                    <CalendarDays className="h-4 w-4 text-blue-300" aria-hidden="true" />
                    <span>{day}</span>
                  </span>
                  <span className="font-mono text-xs text-blue-200 tabular-nums">
                    {daySlots.length} {daySlots.length === 1 ? 'period' : 'periods'}
                  </span>
                </div>

                {daySlots.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center p-8 text-xs text-slate-400">
                    No classes scheduled
                  </div>
                ) : (
                  <div className="divide-y divide-slate-200 dark:divide-slate-800">
                    {daySlots.map((slot) => (
                      <div key={slot.id} className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-mono text-xs font-semibold text-blue-700 tabular-nums dark:text-blue-400">
                              Period {slot.periodNumber} · {slot.startTime}–{slot.endTime}
                            </p>
                            <h3 className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                              {slot.subjectName}
                            </h3>
                          </div>

                          {user.role === 'ADMIN' && (
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => openEditModal(slot)}
                                aria-label={`Edit ${slot.subjectName}`}
                                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-blue-700 dark:hover:bg-slate-800"
                              >
                                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(slot)}
                                aria-label={`Delete ${slot.subjectName}`}
                                className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                              >
                                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                              </button>
                            </div>
                          )}
                        </div>

                        <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400">
                          Faculty: <span className="font-medium text-slate-800 dark:text-slate-200">{slot.facultyName}</span>
                        </p>
                        <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                          Room <span className="font-mono font-semibold">{slot.classroomNumber}</span> · {slot.buildingName}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {slot.course} · Sec {slot.section}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
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
                {editingEntry ? 'Edit Timetable Slot' : 'Add Timetable Slot'}
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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Day (Mon–Sat)
                  </label>
                  <select
                    value={formState.day}
                    onChange={(e) =>
                      setFormState((p) => ({
                        ...p,
                        day: e.target.value as DayOfWeek,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Period Number
                  </label>
                  <input
                    required
                    type="number"
                    min={1}
                    max={8}
                    value={formState.periodNumber}
                    onChange={(e) =>
                      setFormState((p) => ({ ...p, periodNumber: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Subject Name *
                  </label>
                  <input
                    required
                    type="text"
                    value={formState.subjectName}
                    onChange={(e) =>
                      setFormState((p) => ({ ...p, subjectName: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Faculty Name *
                  </label>
                  <input
                    required
                    type="text"
                    value={formState.facultyName}
                    onChange={(e) =>
                      setFormState((p) => ({ ...p, facultyName: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Classroom *
                  </label>
                  <select
                    value={formState.classroomNumber}
                    onChange={(e) => {
                      const room = classrooms.find(
                        (r) => r.roomNumber === e.target.value
                      );
                      setFormState((p) => ({
                        ...p,
                        classroomNumber: e.target.value,
                        buildingName: room?.buildingName || p.buildingName,
                      }));
                    }}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    {classrooms.map((r) => (
                      <option key={r.classroomId} value={r.roomNumber}>
                        {r.roomNumber} — {r.buildingName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Building Name
                  </label>
                  <input
                    type="text"
                    value={formState.buildingName}
                    onChange={(e) =>
                      setFormState((p) => ({
                        ...p,
                        buildingName: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2">
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
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Section *
                  </label>
                  <input
                    required
                    type="text"
                    value={formState.section}
                    onChange={(e) =>
                      setFormState((p) => ({ ...p, section: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 uppercase text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
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
                  {editingEntry ? 'Update Slot' : 'Save Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete Timetable Slot"
        description={`Remove ${deleteTarget?.subjectName} (${deleteTarget?.day} ${deleteTarget?.startTime}–${deleteTarget?.endTime}) from the weekly timetable?`}
        confirmLabel="Delete Slot"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
