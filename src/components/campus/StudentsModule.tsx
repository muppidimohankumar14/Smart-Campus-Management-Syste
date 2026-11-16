import React, { useEffect, useMemo, useState } from 'react';
import {
  ArchiveRestore,
  Eye,
  Mail,
  MapPin,
  Pencil,
  Phone,
  RotateCcw,
  Search,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react';
import { apiRequest } from '../../utils/api';
import { CourseRecord, StudentRecord, UserAccount } from '../../types/campus';
import { ConfirmDialog } from '../ConfirmDialog';

interface StudentsModuleProps {
  user: Omit<UserAccount, 'passwordHash'>;
  onNotify: (
    type: 'success' | 'error' | 'info',
    title: string,
    message?: string
  ) => void;
}

const PHOTO_PRESETS = [
  { label: 'Default Initials', value: '' },
  {
    label: 'Student Portrait A',
    value: '/src/assets/images/student_portrait_one_1794839688121.jpg',
  },
  {
    label: 'Student Portrait B',
    value: '/src/assets/images/student_portrait_two_1794839690045.jpg',
  },
];

export function StudentsModule({ user, onNotify }: StudentsModuleProps) {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [courses, setCourses] = useState<CourseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'active' | 'deleted'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');

  const [selectedProfile, setSelectedProfile] = useState<StudentRecord | null>(
    null
  );
  const [formOpen, setFormOpen] = useState(false);
  const [editingOriginalId, setEditingOriginalId] = useState<string | null>(
    null
  );
  const [deleteTarget, setDeleteTarget] = useState<{
    student: StudentRecord;
    permanent: boolean;
  } | null>(null);

  const [formState, setFormState] = useState({
    studentId: '',
    fullName: '',
    age: '20',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    dateOfBirth: '2006-05-15',
    email: '',
    phone: '',
    address: '',
    course: 'B.Tech Computer Science',
    admissionDate: new Date().toISOString().slice(0, 10),
    academicYear: '2026-2027',
    semester: '1',
    section: 'A',
    photoUrl: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [stuRes, courseRes] = await Promise.all([
        apiRequest<{ students: StudentRecord[] }>(
          user.role === 'ADMIN'
            ? '/students?includeDeleted=true'
            : '/students'
        ),
        apiRequest<{ courses: CourseRecord[] }>('/courses'),
      ]);
      setStudents(stuRes.students);
      setCourses(courseRes.courses);
    } catch (err) {
      onNotify(
        'error',
        'Load Failed',
        err instanceof Error ? err.message : 'Unable to fetch student records.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user.userId]);

  const activeStudents = useMemo(
    () => students.filter((s) => !s.isDeleted),
    [students]
  );
  const deletedStudents = useMemo(
    () => students.filter((s) => s.isDeleted),
    [students]
  );

  const filteredList = useMemo(() => {
    const base = viewMode === 'active' ? activeStudents : deletedStudents;
    const q = searchQuery.trim().toLowerCase();
    return base.filter((s) => {
      const matchesCourse =
        courseFilter === 'all' || s.course === courseFilter;
      if (!matchesCourse) return false;
      if (!q) return true;
      return (
        s.studentId.toLowerCase().includes(q) ||
        s.fullName.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.course.toLowerCase().includes(q) ||
        s.phone.toLowerCase().includes(q)
      );
    });
  }, [viewMode, activeStudents, deletedStudents, searchQuery, courseFilter]);

  const openCreateForm = () => {
    setEditingOriginalId(null);
    setFormState({
      studentId: `STU2026${String(students.length + 1).padStart(2, '0')}`,
      fullName: '',
      age: '19',
      gender: 'Male',
      dateOfBirth: '2007-01-10',
      email: '',
      phone: '',
      address: '',
      course: courses[0]?.courseName || 'B.Tech Computer Science',
      admissionDate: new Date().toISOString().slice(0, 10),
      academicYear: '2026-2027',
      semester: '1',
      section: 'A',
      photoUrl: '',
    });
    setFormOpen(true);
  };

  const openEditForm = (stu: StudentRecord) => {
    setEditingOriginalId(stu.studentId);
    setFormState({
      studentId: stu.studentId,
      fullName: stu.fullName,
      age: String(stu.age),
      gender: stu.gender,
      dateOfBirth: stu.dateOfBirth,
      email: stu.email,
      phone: stu.phone,
      address: stu.address,
      course: stu.course,
      admissionDate: stu.admissionDate,
      academicYear: stu.academicYear,
      semester: String(stu.semester),
      section: stu.section,
      photoUrl: stu.photoUrl || '',
    });
    setFormOpen(true);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      onNotify('error', 'Image Too Large', 'Please choose an image under 1 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFormState((p) => ({ ...p, photoUrl: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingOriginalId) {
        await apiRequest(`/students/${editingOriginalId}`, {
          method: 'PUT',
          body: JSON.stringify({
            ...formState,
            age: Number(formState.age),
            semester: Number(formState.semester),
          }),
        });
        onNotify(
          'success',
          'Student Updated',
          `${formState.fullName} (${formState.studentId}) saved.`
        );
      } else {
        await apiRequest('/students', {
          method: 'POST',
          body: JSON.stringify({
            ...formState,
            age: Number(formState.age),
            semester: Number(formState.semester),
          }),
        });
        onNotify(
          'success',
          'Student Added',
          `${formState.fullName} (${formState.studentId}) admitted.`
        );
      }
      setFormOpen(false);
      await loadData();
    } catch (err) {
      onNotify(
        'error',
        'Save Failed',
        err instanceof Error ? err.message : 'Unable to save student.'
      );
    }
  };

  const handleRestore = async (stu: StudentRecord) => {
    try {
      await apiRequest(`/students/${stu.studentId}/restore`, {
        method: 'POST',
      });
      onNotify(
        'success',
        'Student Restored',
        `${stu.fullName} (${stu.studentId}) restored to active directory.`
      );
      await loadData();
    } catch (err) {
      onNotify(
        'error',
        'Restore Failed',
        err instanceof Error ? err.message : 'Unable to restore student.'
      );
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const url = deleteTarget.permanent
        ? `/students/${deleteTarget.student.studentId}?permanent=true`
        : `/students/${deleteTarget.student.studentId}`;
      await apiRequest(url, { method: 'DELETE' });
      onNotify(
        'success',
        deleteTarget.permanent ? 'Permanently Deleted' : 'Moved to Deleted Archive',
        `${deleteTarget.student.fullName} (${deleteTarget.student.studentId}) updated.`
      );
      setDeleteTarget(null);
      if (selectedProfile?.studentId === deleteTarget.student.studentId) {
        setSelectedProfile(null);
      }
      await loadData();
    } catch (err) {
      onNotify(
        'error',
        'Delete Failed',
        err instanceof Error ? err.message : 'Unable to delete student.'
      );
    }
  };

  // STUDENT VIEW: Own Profile Card
  if (user.role === 'STUDENT') {
    const myRecord = activeStudents[0];
    if (loading) {
      return <div className="h-64 animate-pulse rounded-xl bg-white dark:bg-slate-900" />;
    }
    if (!myRecord) {
      return (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Student profile record not found.
          </p>
        </div>
      );
    }
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            My Student Profile
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Official academic enrollment and personal contact details.
          </p>
        </div>

        <StudentProfileCard student={myRecord} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Student Management
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Add, search, update, archive, or restore student admission records.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-800 whitespace-nowrap shrink-0"
        >
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          <span>Add Student</span>
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
          <button
            type="button"
            onClick={() => setViewMode('active')}
            className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              viewMode === 'active'
                ? 'bg-[#0B1F3A] text-white dark:bg-blue-600'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Active Students ({activeStudents.length})
          </button>
          <button
            type="button"
            onClick={() => setViewMode('deleted')}
            className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              viewMode === 'deleted'
                ? 'bg-[#0B1F3A] text-white dark:bg-blue-600'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Deleted Archive ({deletedStudents.length})
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ID, name, email..."
              className="w-60 rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            aria-label="Filter by course"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            <option value="all">All Courses</option>
            {courses.map((c) => (
              <option key={c.courseCode} value={c.courseName}>
                {c.courseName}
              </option>
            ))}
          </select>
        </div>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        {loading ? (
          <div className="p-10 text-center text-sm text-slate-500">
            Loading student records...
          </div>
        ) : filteredList.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {viewMode === 'active'
                ? 'No matching active students found'
                : 'Deleted archive is empty'}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {viewMode === 'active'
                ? 'Try clearing your search or admit a new student.'
                : 'Soft-deleted students appear here and can be restored anytime.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
                <tr>
                  <th className="px-5 py-3">Student ID</th>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Course & Batch</th>
                  <th className="px-4 py-3 text-right">Age</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredList.map((stu) => (
                  <tr
                    key={stu.studentId}
                    className="transition-colors hover:bg-blue-50/40 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-5 py-3 font-mono text-xs font-semibold text-blue-700 dark:text-blue-400">
                      {stu.studentId}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setSelectedProfile(stu)}
                        className="flex items-center gap-3 text-left hover:text-blue-700 dark:hover:text-blue-400"
                      >
                        <StudentAvatar student={stu} size="sm" />
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-100">
                            {stu.fullName}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {stu.gender} · DOB {stu.dateOfBirth}
                          </p>
                        </div>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800 dark:text-slate-200">
                        {stu.course}
                      </p>
                      <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
                        Sem {stu.semester} · Sec {stu.section} · {stu.academicYear}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs tabular-nums text-slate-700 dark:text-slate-300">
                      {stu.age}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
                      <p>{stu.email}</p>
                      <p className="font-mono">{stu.phone}</p>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {viewMode === 'active' ? (
                          <>
                            <button
                              type="button"
                              onClick={() => setSelectedProfile(stu)}
                              aria-label={`View ${stu.fullName}`}
                              className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-700 dark:text-slate-400 dark:hover:bg-slate-800"
                            >
                              <Eye className="h-4 w-4" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditForm(stu)}
                              aria-label={`Edit ${stu.fullName}`}
                              className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-700 dark:text-slate-400 dark:hover:bg-slate-800"
                            >
                              <Pencil className="h-4 w-4" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setDeleteTarget({ student: stu, permanent: false })
                              }
                              aria-label={`Archive ${stu.fullName}`}
                              className="rounded-md p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-950/40"
                            >
                              <Trash2 className="h-4 w-4" aria-hidden="true" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleRestore(stu)}
                              className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300"
                            >
                              <ArchiveRestore className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>Restore</span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setDeleteTarget({ student: stu, permanent: true })
                              }
                              className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-white px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 dark:border-red-900/60 dark:bg-slate-800 dark:text-red-400"
                            >
                              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>Purge</span>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedProfile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedProfile(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                Complete Student Profile
              </h2>
              <button
                type="button"
                onClick={() => setSelectedProfile(null)}
                aria-label="Close profile"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <StudentProfileCard student={selectedProfile} />
          </div>
        </div>
      )}

      {formOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          onClick={() => setFormOpen(false)}
        >
          <div
            className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                {editingOriginalId ? 'Update Student Record' : 'Add New Student'}
              </h2>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                aria-label="Close modal"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Student ID *
                  </label>
                  <input
                    required
                    type="text"
                    value={formState.studentId}
                    onChange={(e) =>
                      setFormState((p) => ({ ...p, studentId: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm uppercase dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Full Name *
                  </label>
                  <input
                    required
                    type="text"
                    value={formState.fullName}
                    onChange={(e) =>
                      setFormState((p) => ({ ...p, fullName: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Age *
                  </label>
                  <input
                    required
                    type="number"
                    min={16}
                    max={80}
                    value={formState.age}
                    onChange={(e) =>
                      setFormState((p) => ({ ...p, age: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Gender *
                  </label>
                  <select
                    value={formState.gender}
                    onChange={(e) =>
                      setFormState((p) => ({
                        ...p,
                        gender: e.target.value as 'Male' | 'Female' | 'Other',
                      }))
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Date of Birth *
                  </label>
                  <input
                    required
                    type="date"
                    value={formState.dateOfBirth}
                    onChange={(e) =>
                      setFormState((p) => ({ ...p, dateOfBirth: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Email *
                  </label>
                  <input
                    required
                    type="email"
                    value={formState.email}
                    onChange={(e) =>
                      setFormState((p) => ({ ...p, email: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Phone Number *
                  </label>
                  <input
                    required
                    type="tel"
                    value={formState.phone}
                    onChange={(e) =>
                      setFormState((p) => ({ ...p, phone: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Address *
                </label>
                <input
                  required
                  type="text"
                  value={formState.address}
                  onChange={(e) =>
                    setFormState((p) => ({ ...p, address: e.target.value }))
                  }
                  placeholder="Street, Residence Hall, City, State"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
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
                    Section
                  </label>
                  <input
                    type="text"
                    value={formState.section}
                    onChange={(e) =>
                      setFormState((p) => ({ ...p, section: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 uppercase text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Admission Date
                  </label>
                  <input
                    type="date"
                    value={formState.admissionDate}
                    onChange={(e) =>
                      setFormState((p) => ({
                        ...p,
                        admissionDate: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Academic Year
                  </label>
                  <input
                    type="text"
                    value={formState.academicYear}
                    onChange={(e) =>
                      setFormState((p) => ({
                        ...p,
                        academicYear: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Profile Photo Preset / Upload
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={
                        PHOTO_PRESETS.some((p) => p.value === formState.photoUrl)
                          ? formState.photoUrl
                          : ''
                      }
                      onChange={(e) =>
                        setFormState((p) => ({ ...p, photoUrl: e.target.value }))
                      }
                      className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    >
                      {PHOTO_PRESETS.map((p) => (
                        <option key={p.label} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                    <label className="cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      Upload
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-800"
                >
                  <RotateCcw className="h-3.5 w-3.5 hidden" aria-hidden="true" />
                  <span>{editingOriginalId ? 'Save Changes' : 'Save Student'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title={
          deleteTarget?.permanent
            ? 'Permanently Delete Student'
            : 'Archive Student Record'
        }
        description={
          deleteTarget?.permanent
            ? `Permanently purge ${deleteTarget.student.fullName} (${deleteTarget.student.studentId})? This cannot be undone.`
            : `Move ${deleteTarget?.student.fullName} (${deleteTarget?.student.studentId}) to the Deleted Archive? You can restore this record later.`
        }
        confirmLabel={deleteTarget?.permanent ? 'Delete Permanently' : 'Move to Archive'}
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function StudentAvatar({
  student,
  size = 'md',
}: {
  student: StudentRecord;
  size?: 'sm' | 'md' | 'lg';
}) {
  const [err, setErr] = useState(false);
  const dim =
    size === 'lg' ? 'h-20 w-20 text-xl' : size === 'sm' ? 'h-9 w-9 text-xs' : 'h-12 w-12 text-sm';
  const initials = student.fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

  if (student.photoUrl && !err) {
    return (
      <img
        src={student.photoUrl}
        alt={student.fullName}
        referrerPolicy="no-referrer"
        onError={() => setErr(true)}
        className={`${dim} shrink-0 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700`}
      />
    );
  }
  return (
    <div
      className={`${dim} flex shrink-0 items-center justify-center rounded-xl bg-blue-100 font-display font-bold text-[#0B1F3A] dark:bg-blue-950 dark:text-blue-300`}
    >
      {initials || 'ST'}
    </div>
  );
}

function StudentProfileCard({ student }: { student: StudentRecord }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center gap-5 bg-[#0B1F3A] px-6 py-6 text-white">
        <StudentAvatar student={student} size="lg" />
        <div>
          <p className="font-mono text-xs font-semibold text-blue-200">
            {student.studentId}
          </p>
          <h3 className="mt-0.5 font-display text-2xl font-bold">
            {student.fullName}
          </h3>
          <p className="mt-1 text-sm text-blue-100">
            {student.course} · Semester {student.semester} · Section {student.section}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Age & Gender</p>
          <p className="mt-1 text-sm font-semibold text-slate-900 tabular-nums dark:text-slate-100">
            {student.age} years · {student.gender}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Date of Birth</p>
          <p className="mt-1 font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">
            {student.dateOfBirth}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Academic Year</p>
          <p className="mt-1 font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">
            {student.academicYear}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Admission Date</p>
          <p className="mt-1 font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">
            {student.admissionDate}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Email</p>
          <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-blue-700 dark:text-blue-400">
            <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{student.email}</span>
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Phone</p>
          <p className="mt-1 flex items-center gap-1.5 font-mono text-sm font-medium text-slate-900 dark:text-slate-100">
            <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
            <span>{student.phone}</span>
          </p>
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">Address</p>
          <p className="mt-1 flex items-start gap-1.5 text-sm text-slate-800 dark:text-slate-200">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
            <span>{student.address}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
