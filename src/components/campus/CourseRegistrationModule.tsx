import { useEffect, useState } from 'react';
import { BookOpen, Check, Clock, XCircle } from 'lucide-react';
import { apiRequest } from '../../utils/api';
import {
  CourseRecord,
  CourseRegistration,
  UserAccount,
} from '../../types/campus';

interface EnrichedCourse extends CourseRecord {
  availableSeats: number;
  registeredSeats: number;
}

interface CourseRegistrationModuleProps {
  user: Omit<UserAccount, 'passwordHash'>;
  onNotify: (
    type: 'success' | 'error' | 'info',
    title: string,
    message?: string
  ) => void;
}

export function CourseRegistrationModule({
  user,
  onNotify,
}: CourseRegistrationModuleProps) {
  const [courses, setCourses] = useState<EnrichedCourse[]>([]);
  const [registrations, setRegistrations] = useState<CourseRegistration[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cRes, rRes] = await Promise.all([
        apiRequest<{ courses: EnrichedCourse[] }>('/courses'),
        apiRequest<{ registrations: CourseRegistration[] }>('/registrations'),
      ]);
      setCourses(cRes.courses);
      setRegistrations(rRes.registrations);
    } catch (err) {
      onNotify(
        'error',
        'Load Failed',
        err instanceof Error ? err.message : 'Unable to fetch course registrations.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user.userId]);

  const handleRegister = async (course: EnrichedCourse) => {
    try {
      await apiRequest('/registrations', {
        method: 'POST',
        body: JSON.stringify({ courseCode: course.courseCode }),
      });
      onNotify(
        'success',
        'Registration Submitted',
        `Registered for ${course.courseName} (${course.courseCode}).`
      );
      await loadData();
    } catch (err) {
      onNotify(
        'error',
        'Registration Blocked',
        err instanceof Error ? err.message : 'Unable to register for course.'
      );
    }
  };

  const handleStatusChange = async (
    reg: CourseRegistration,
    status: 'Approved' | 'Rejected' | 'Cancelled'
  ) => {
    try {
      await apiRequest(`/registrations/${reg.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      onNotify(
        'success',
        `Registration ${status}`,
        `${reg.courseCode} for ${reg.studentName} marked ${status}.`
      );
      await loadData();
    } catch (err) {
      onNotify(
        'error',
        'Update Failed',
        err instanceof Error ? err.message : 'Unable to update registration.'
      );
    }
  };

  const todayIso = new Date().toISOString().slice(0, 10);

  if (loading) {
    return <div className="h-64 animate-pulse rounded-xl bg-white dark:bg-slate-900" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Course Registration
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {user.role === 'ADMIN'
            ? 'Review student course registration requests, approve seats, or reject conflicts.'
            : 'Browse open courses, check available seats and deadlines, and manage your registrations.'}
        </p>
      </div>

      {user.role === 'STUDENT' && (
        <section className="space-y-4">
          <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
            Available Courses
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {courses.map((course) => {
              const existing = registrations.find(
                (r) =>
                  r.courseCode === course.courseCode &&
                  r.status !== 'Cancelled' &&
                  r.status !== 'Rejected'
              );
              const expired = course.registrationDeadline < todayIso;
              const full = course.availableSeats <= 0;
              const disabled = Boolean(existing) || expired || full;

              return (
                <div
                  key={course.courseCode}
                  className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-mono text-xs font-semibold text-blue-700 dark:text-blue-400">
                          {course.courseCode} · Semester {course.semester} ·{' '}
                          {course.credits} Credits
                        </p>
                        <h3 className="mt-1 font-display text-base font-bold text-slate-900 dark:text-white">
                          {course.courseName}
                        </h3>
                      </div>
                      <BookOpen className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                      {course.description}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
                      <span>Faculty: {course.faculty}</span>
                      <span>·</span>
                      <span className="font-mono">
                        Deadline: {course.registrationDeadline}
                      </span>
                      <span>·</span>
                      <span className="font-mono font-semibold text-blue-700 tabular-nums dark:text-blue-400">
                        {course.availableSeats} seats left
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3 dark:border-slate-800">
                    {existing ? (
                      <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                        Registered ({existing.status})
                      </span>
                    ) : expired ? (
                      <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                        Deadline Passed
                      </span>
                    ) : full ? (
                      <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                        Capacity Full
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500">
                        Eligible for registration
                      </span>
                    )}

                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => handleRegister(course)}
                      className="rounded-lg bg-blue-700 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
                    >
                      {existing ? existing.status : 'Register'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
            {user.role === 'ADMIN'
              ? 'All Student Course Registrations'
              : 'My Course Registrations'}
          </h2>
        </div>

        {registrations.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            No course registrations recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
                <tr>
                  <th className="px-5 py-3">Reg ID</th>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Course</th>
                  <th className="px-4 py-3 text-right">Credits</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {registrations.map((reg) => (
                  <tr key={reg.id}>
                    <td className="px-5 py-3 font-mono text-xs text-slate-500">
                      {reg.id}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        {reg.studentName}
                      </p>
                      <p className="font-mono text-xs text-slate-500">
                        {reg.studentId}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {reg.courseName}
                      </p>
                      <p className="font-mono text-xs text-blue-700 dark:text-blue-400">
                        {reg.courseCode} · Sem {reg.semester}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs tabular-nums">
                      {reg.credits}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-semibold ${
                          reg.status === 'Approved'
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : reg.status === 'Pending'
                            ? 'text-amber-700 dark:text-amber-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {reg.status === 'Approved' ? (
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                        ) : reg.status === 'Pending' ? (
                          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                        )}
                        <span>{reg.status}</span>
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {user.role === 'ADMIN' ? (
                        <div className="flex justify-end gap-1.5">
                          {reg.status !== 'Approved' && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(reg, 'Approved')}
                              className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                            >
                              Approve
                            </button>
                          )}
                          {reg.status !== 'Rejected' && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(reg, 'Rejected')}
                              className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 dark:border-red-900/60 dark:text-red-400"
                            >
                              Reject
                            </button>
                          )}
                        </div>
                      ) : (
                        (reg.status === 'Pending' || reg.status === 'Approved') && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(reg, 'Cancelled')}
                            className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                          >
                            Cancel Registration
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
