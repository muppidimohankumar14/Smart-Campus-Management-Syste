import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ClipboardCheck,
} from 'lucide-react';
import { apiRequest } from '../../utils/api';
import {
  AttendanceRecord,
  AttendanceStatus,
  CourseRecord,
  StudentRecord,
  UserAccount,
} from '../../types/campus';

interface AttendanceSummary {
  studentId: string;
  fullName: string;
  course: string;
  section: string;
  present: number;
  late: number;
  absent: number;
  total: number;
  percentage: number;
  lowAttendanceWarning: boolean;
}

interface AttendanceModuleProps {
  user: Omit<UserAccount, 'passwordHash'>;
  onNotify: (
    type: 'success' | 'error' | 'info',
    title: string,
    message?: string
  ) => void;
}

export function AttendanceModule({ user, onNotify }: AttendanceModuleProps) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [summaries, setSummaries] = useState<AttendanceSummary[]>([]);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [courses, setCourses] = useState<CourseRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [markDate, setMarkDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [markCourse, setMarkCourse] = useState('B.Tech Computer Science');
  const [draftStatuses, setDraftStatuses] = useState<
    Record<string, AttendanceStatus>
  >({});
  const [saving, setSaving] = useState(false);

  const loadAttendance = async () => {
    setLoading(true);
    try {
      const [attRes, stuRes, courseRes] = await Promise.all([
        apiRequest<{
          records: AttendanceRecord[];
          summaries: AttendanceSummary[];
        }>('/attendance'),
        apiRequest<{ students: StudentRecord[] }>('/students'),
        apiRequest<{ courses: CourseRecord[] }>('/courses'),
      ]);
      setRecords(attRes.records);
      setSummaries(attRes.summaries);
      setStudents(stuRes.students);
      setCourses(courseRes.courses);
      if (courseRes.courses.length > 0 && !markCourse) {
        setMarkCourse(courseRes.courses[0].courseName);
      }
    } catch (err) {
      onNotify(
        'error',
        'Load Failed',
        err instanceof Error ? err.message : 'Unable to load attendance.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, [user.userId]);

  const studentsInSelectedCourse = useMemo(
    () => students.filter((s) => s.course === markCourse && !s.isDeleted),
    [students, markCourse]
  );

  useEffect(() => {
    const initial: Record<string, AttendanceStatus> = {};
    for (const s of studentsInSelectedCourse) {
      const existing = records.find(
        (r) =>
          r.studentId === s.studentId &&
          r.date === markDate &&
          r.course === markCourse
      );
      initial[s.studentId] = existing?.status || 'Present';
    }
    setDraftStatuses(initial);
  }, [studentsInSelectedCourse, records, markDate, markCourse]);

  const handleSaveAttendance = async () => {
    if (studentsInSelectedCourse.length === 0) return;
    setSaving(true);
    try {
      const entries = studentsInSelectedCourse.map((s) => ({
        studentId: s.studentId,
        status: draftStatuses[s.studentId] || 'Present',
      }));
      await apiRequest('/attendance/mark', {
        method: 'POST',
        body: JSON.stringify({
          date: markDate,
          course: markCourse,
          entries,
        }),
      });
      onNotify(
        'success',
        'Attendance Saved',
        `Recorded ${entries.length} entries for ${markCourse} (${markDate}).`
      );
      await loadAttendance();
    } catch (err) {
      onNotify(
        'error',
        'Save Failed',
        err instanceof Error ? err.message : 'Unable to save attendance.'
      );
    } finally {
      setSaving(false);
    }
  };

  const monthlyChartData = useMemo(() => {
    const map = new Map<string, { present: number; absent: number; late: number }>();
    for (const r of records) {
      const month = r.date.slice(0, 7);
      const cur = map.get(month) || { present: 0, absent: 0, late: 0 };
      if (r.status === 'Present') cur.present += 1;
      else if (r.status === 'Late') cur.late += 1;
      else cur.absent += 1;
      map.set(month, cur);
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, counts]) => ({ month, ...counts }));
  }, [records]);

  const lowAttendanceWarnings = summaries.filter((s) => s.lowAttendanceWarning);

  if (loading) {
    return <div className="h-64 animate-pulse rounded-xl bg-white dark:bg-slate-900" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {user.role === 'ADMIN' ? 'Attendance Management' : 'My Attendance'}
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {user.role === 'ADMIN'
            ? 'Mark daily Present, Absent, or Late status, monitor percentages, and track low-attendance warnings.'
            : 'View your personal attendance percentage, monthly breakdown, and session history.'}
        </p>
      </div>

      {lowAttendanceWarnings.length > 0 && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          <div>
            <p className="font-semibold">
              Low Attendance Warning (&lt; 75% Threshold)
            </p>
            <p className="mt-0.5 text-xs">
              {lowAttendanceWarnings
                .map((w) => `${w.fullName} (${w.studentId}: ${w.percentage}%)`)
                .join(' · ')}
            </p>
          </div>
        </div>
      )}

      {user.role === 'ADMIN' && (
        <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                Mark Daily Attendance
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Select date and course, then mark Present, Absent, or Late for each student.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <input
                type="date"
                value={markDate}
                onChange={(e) => setMarkDate(e.target.value)}
                aria-label="Attendance date"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
              <select
                value={markCourse}
                onChange={(e) => setMarkCourse(e.target.value)}
                aria-label="Select course"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                {courses.map((c) => (
                  <option key={c.courseCode} value={c.courseName}>
                    {c.courseName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {studentsInSelectedCourse.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              No active students enrolled in {markCourse}.
            </p>
          ) : (
            <>
              <div className="mt-4 divide-y divide-slate-200 dark:divide-slate-800">
                {studentsInSelectedCourse.map((stu) => {
                  const status = draftStatuses[stu.studentId] || 'Present';
                  return (
                    <div
                      key={stu.studentId}
                      className="flex flex-wrap items-center justify-between gap-3 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {stu.fullName}
                        </p>
                        <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
                          {stu.studentId} · Sem {stu.semester} · Sec {stu.section}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {(['Present', 'Late', 'Absent'] as AttendanceStatus[]).map(
                          (opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() =>
                                setDraftStatuses((prev) => ({
                                  ...prev,
                                  [stu.studentId]: opt,
                                }))
                              }
                              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                                status === opt
                                  ? opt === 'Present'
                                    ? 'bg-emerald-600 text-white'
                                    : opt === 'Late'
                                    ? 'bg-amber-600 text-white'
                                    : 'bg-red-600 text-white'
                                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                              }`}
                            >
                              {opt}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 flex justify-end border-t border-slate-200 pt-4 dark:border-slate-800">
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSaveAttendance}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
                >
                  <Check className="h-4 w-4" aria-hidden="true" />
                  <span>{saving ? 'Saving...' : 'Save Attendance'}</span>
                </button>
              </div>
            </>
          )}
        </section>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-7 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
            Student Attendance Percentages
          </h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <tr>
                  <th className="py-2 pr-3">Student</th>
                  <th className="py-2 pr-3 text-right">Present</th>
                  <th className="py-2 pr-3 text-right">Late</th>
                  <th className="py-2 pr-3 text-right">Absent</th>
                  <th className="py-2 text-right">Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {summaries.map((sum) => (
                  <tr key={sum.studentId}>
                    <td className="py-2.5 pr-3">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        {sum.fullName}
                      </p>
                      <p className="font-mono text-xs text-slate-500">
                        {sum.studentId} · {sum.course}
                      </p>
                    </td>
                    <td className="py-2.5 pr-3 text-right font-mono text-xs tabular-nums text-emerald-700 dark:text-emerald-400">
                      {sum.present}
                    </td>
                    <td className="py-2.5 pr-3 text-right font-mono text-xs tabular-nums text-amber-700 dark:text-amber-400">
                      {sum.late}
                    </td>
                    <td className="py-2.5 pr-3 text-right font-mono text-xs tabular-nums text-red-600 dark:text-red-400">
                      {sum.absent}
                    </td>
                    <td className="py-2.5 text-right font-mono text-xs font-bold tabular-nums">
                      <span
                        className={
                          sum.lowAttendanceWarning
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-blue-700 dark:text-blue-400'
                        }
                      >
                        {sum.percentage}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
            Monthly Attendance Breakdown
          </h2>
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="present" name="Present" fill="#16A34A" radius={[4, 4, 0, 0]} />
                <Bar dataKey="late" name="Late" fill="#D97706" radius={[4, 4, 0, 0]} />
                <Bar dataKey="absent" name="Absent" fill="#DC2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
            Attendance History Log
          </h2>
          <span className="font-mono text-xs text-slate-500 tabular-nums">
            {records.length} entries
          </span>
        </div>
        <div className="max-h-80 overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
              <tr>
                <th className="px-6 py-2.5">Date</th>
                <th className="px-4 py-2.5">Student ID</th>
                <th className="px-4 py-2.5">Course</th>
                <th className="px-6 py-2.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {records.map((rec) => (
                <tr key={rec.id}>
                  <td className="px-6 py-2.5 font-mono text-xs text-slate-700 tabular-nums dark:text-slate-300">
                    {rec.date}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs font-semibold text-blue-700 dark:text-blue-400">
                    {rec.studentId}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-700 dark:text-slate-300">
                    {rec.course}
                  </td>
                  <td className="px-6 py-2.5 text-right">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-semibold ${
                        rec.status === 'Present'
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : rec.status === 'Late'
                          ? 'text-amber-700 dark:text-amber-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {rec.status === 'Present' ? (
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                      ) : rec.status === 'Late' ? (
                        <ClipboardCheck className="h-3.5 w-3.5" aria-hidden="true" />
                      ) : (
                        <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                      <span>{rec.status}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
