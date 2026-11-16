import React, { useEffect, useState } from 'react';
import { Building2, Pencil, Plus, Trash2, Users, X } from 'lucide-react';
import { apiRequest } from '../../utils/api';
import { ClassroomRecord, UserAccount } from '../../types/campus';
import { ConfirmDialog } from '../ConfirmDialog';

interface EnrichedClassroom extends ClassroomRecord {
  scheduledClasses: number;
  scheduledExams: number;
}

interface ClassroomsModuleProps {
  user: Omit<UserAccount, 'passwordHash'>;
  onNotify: (
    type: 'success' | 'error' | 'info',
    title: string,
    message?: string
  ) => void;
}

export function ClassroomsModule({ user, onNotify }: ClassroomsModuleProps) {
  const [classrooms, setClassrooms] = useState<EnrichedClassroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EnrichedClassroom | null>(
    null
  );

  const [formState, setFormState] = useState({
    classroomId: '',
    roomNumber: '',
    buildingName: '',
    floor: '1st Floor',
    capacity: '60',
    classroomType: 'Lecture Hall' as ClassroomRecord['classroomType'],
    facilities: 'Projector, AC, Smart Board',
    assignedCourseSection: '',
  });

  const loadClassrooms = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{ classrooms: EnrichedClassroom[] }>(
        '/classrooms'
      );
      setClassrooms(res.classrooms);
    } catch (err) {
      onNotify(
        'error',
        'Load Failed',
        err instanceof Error ? err.message : 'Unable to fetch classrooms.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClassrooms();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setFormState({
      classroomId: `CLS-${101 + classrooms.length}`,
      roomNumber: '',
      buildingName: 'Turing Academic Block',
      floor: '2nd Floor',
      capacity: '60',
      classroomType: 'Lecture Hall',
      facilities: 'Projector, Smart Podium, AC',
      assignedCourseSection: '',
    });
    setModalOpen(true);
  };

  const openEdit = (room: EnrichedClassroom) => {
    setEditingId(room.classroomId);
    setFormState({
      classroomId: room.classroomId,
      roomNumber: room.roomNumber,
      buildingName: room.buildingName,
      floor: room.floor,
      capacity: String(room.capacity),
      classroomType: room.classroomType,
      facilities: room.facilities.join(', '),
      assignedCourseSection: room.assignedCourseSection,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formState,
        capacity: Number(formState.capacity),
        facilities: formState.facilities
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      };
      if (editingId) {
        await apiRequest(`/classrooms/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        onNotify('success', 'Classroom Updated', `Room ${formState.roomNumber} updated.`);
      } else {
        await apiRequest('/classrooms', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        onNotify('success', 'Classroom Added', `Room ${formState.roomNumber} created.`);
      }
      setModalOpen(false);
      await loadClassrooms();
    } catch (err) {
      onNotify(
        'error',
        'Save Failed',
        err instanceof Error ? err.message : 'Unable to save classroom.'
      );
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiRequest(`/classrooms/${deleteTarget.classroomId}`, {
        method: 'DELETE',
      });
      onNotify('success', 'Classroom Deleted', `Room ${deleteTarget.roomNumber} removed.`);
      setDeleteTarget(null);
      await loadClassrooms();
    } catch (err) {
      onNotify(
        'error',
        'Delete Failed',
        err instanceof Error ? err.message : 'Unable to delete classroom.'
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Classroom Management
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Campus rooms, seating capacities, facilities, and active timetable/exam allocation.
          </p>
        </div>

        {user.role === 'ADMIN' && (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800 whitespace-nowrap shrink-0"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Add Classroom</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="h-56 animate-pulse rounded-xl bg-white dark:bg-slate-900" />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {classrooms.map((room) => (
            <section
              key={room.classroomId}
              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
                      <Building2 className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
                        {room.classroomId} · {room.classroomType}
                      </p>
                      <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                        Room {room.roomNumber}
                      </h2>
                    </div>
                  </div>

                  {user.role === 'ADMIN' && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(room)}
                        aria-label={`Edit room ${room.roomNumber}`}
                        className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-700 dark:hover:bg-slate-800"
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(room)}
                        aria-label={`Delete room ${room.roomNumber}`}
                        className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  <p>
                    <span className="text-slate-500 dark:text-slate-400">Building:</span>{' '}
                    <span className="font-semibold">{room.buildingName}</span> ({room.floor})
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                    <span>Capacity:</span>{' '}
                    <span className="font-mono font-semibold tabular-nums">
                      {room.capacity} seats
                    </span>
                  </p>
                  <p>
                    <span className="text-slate-500 dark:text-slate-400">Assigned:</span>{' '}
                    <span className="font-medium text-blue-700 dark:text-blue-400">
                      {room.assignedCourseSection || 'Open / Shared Pool'}
                    </span>
                  </p>
                  <p>
                    <span className="text-slate-500 dark:text-slate-400">Facilities:</span>{' '}
                    {room.facilities.join(' · ') || 'Standard Seating'}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3 font-mono text-xs tabular-nums dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">
                  {room.scheduledClasses} timetable slots
                </span>
                <span className="text-slate-600 dark:text-slate-400">
                  {room.scheduledExams} scheduled exams
                </span>
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
                {editingId ? 'Edit Classroom' : 'Add Classroom'}
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
                    Classroom ID *
                  </label>
                  <input
                    required
                    disabled={Boolean(editingId)}
                    type="text"
                    value={formState.classroomId}
                    onChange={(e) =>
                      setFormState((p) => ({ ...p, classroomId: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm uppercase disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Room Number *
                  </label>
                  <input
                    required
                    type="text"
                    value={formState.roomNumber}
                    onChange={(e) =>
                      setFormState((p) => ({ ...p, roomNumber: e.target.value }))
                    }
                    placeholder="e.g., B-201"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm uppercase dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Building Name *
                  </label>
                  <input
                    required
                    type="text"
                    value={formState.buildingName}
                    onChange={(e) =>
                      setFormState((p) => ({ ...p, buildingName: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Floor
                  </label>
                  <input
                    type="text"
                    value={formState.floor}
                    onChange={(e) =>
                      setFormState((p) => ({ ...p, floor: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Room Capacity *
                  </label>
                  <input
                    required
                    type="number"
                    min={10}
                    max={1000}
                    value={formState.capacity}
                    onChange={(e) =>
                      setFormState((p) => ({ ...p, capacity: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Classroom Type
                  </label>
                  <select
                    value={formState.classroomType}
                    onChange={(e) =>
                      setFormState((p) => ({
                        ...p,
                        classroomType: e.target.value as ClassroomRecord['classroomType'],
                      }))
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="Lecture Hall">Lecture Hall</option>
                    <option value="Computer Lab">Computer Lab</option>
                    <option value="Seminar Room">Seminar Room</option>
                    <option value="Auditorium">Auditorium</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Available Facilities (comma-separated)
                </label>
                <input
                  type="text"
                  value={formState.facilities}
                  onChange={(e) =>
                    setFormState((p) => ({ ...p, facilities: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Assigned Course or Section (optional)
                </label>
                <input
                  type="text"
                  value={formState.assignedCourseSection}
                  onChange={(e) =>
                    setFormState((p) => ({
                      ...p,
                      assignedCourseSection: e.target.value,
                    }))
                  }
                  placeholder="e.g., B.Tech Computer Science - Sec B"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
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
                  {editingId ? 'Save Changes' : 'Create Classroom'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete Classroom"
        description={`Remove Room ${deleteTarget?.roomNumber} (${deleteTarget?.classroomId}) from campus rooms?`}
        confirmLabel="Delete Room"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
