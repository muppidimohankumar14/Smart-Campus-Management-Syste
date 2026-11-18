import { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Award,
  BookOpen,
  Building2,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  FileSpreadsheet,
  GraduationCap,
  Users,
} from 'lucide-react';
import { apiRequest } from '../../utils/api';
import {
  ActivityLog,
  AttendanceRecord,
  ExaminationRecord,
  NavModule,
  StudentRecord,
  TimetableEntry,
  UserAccount,
} from '../../types/campus';

interface AdminDashboardData {
  role: 'ADMIN';
  stats: {
    totalStudents: number;
    totalCourses: number;
    totalClassrooms: number;
    totalRegisteredStudents: number;
    averageAttendance: number;
    upcomingExaminations: number;
  };
  recentAdmissions: StudentRecord[];
  recentActivities: ActivityLog[];
  courseStats: Array<{
    courseCode: string;
    courseName: string;
    students: number;
    capacity: number;
  }>;
  monthlyAdmissions: Array<{ month: string; admissions: number }>;
  attendanceChart: Array<{
    course: string;
    fullCourse: string;
    present: number;
    late: number;
    absent: number;
    rate: number;
  }>;
  upcomingExamsList: ExaminationRecord[];
}

interface StudentDashboardData {
  role: 'STUDENT';
  student: StudentRecord | null;
  stats: {
    attendancePercentage: number;
    totalClassesMarked: number;
    registeredCourses: number;
    upcomingExams: number;
    latestCgpa: number | null;
    unreadNotifications: number;
  };
  upcomingExamsList: ExaminationRecord[];
  timetablePreview: TimetableEntry[];
  recentAttendance: AttendanceRecord[];
}

type DashboardData = AdminDashboardData | StudentDashboardData;

interface DashboardModuleProps {
  user: Omit<UserAccount, 'passwordHash'>;
  onNavigate: (module: NavModule) => void;
}

export function DashboardModule({ user, onNavigate }: DashboardModuleProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    apiRequest<DashboardData>('/dashboard')
      .then((res) => {
        if (active) setData(res);
      })
      .catch((err) => {
        if (active) {
          setError(
            err instanceof Error ? err.message : 'Unable to load dashboard.'
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user.userId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="h-28 animate-pulse rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-white p-6 text-sm text-red-700 dark:border-red-900/50 dark:bg-slate-900 dark:text-red-300">
        {error || 'Dashboard data unavailable.'}
      </div>
    );
  }

  if (data.role === 'STUDENT') {
    const stu = data.student;
    return (
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Welcome, {user.fullName}
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {stu
                ? `${stu.studentId} · ${stu.course} · Semester ${stu.semester} · Section ${stu.section}`
                : 'Student Academic Overview'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onNavigate('id-card')}
              className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              View ID Card
            </button>
            <button
              type="button"
              onClick={() => onNavigate('course-registration')}
              className="rounded-lg bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-800"
            >
              Course Registration
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Attendance Rate
                </p>
                <p className="mt-2 font-display text-3xl font-bold tabular-nums text-slate-900 dark:text-white">
                  {data.stats.attendancePercentage}%
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
                <ClipboardCheck className="h-5 w-5" aria-hidden="true" />
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {data.stats.attendancePercentage < 75
                ? 'Below 75% requirement'
                : `${data.stats.totalClassesMarked} sessions recorded`}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Registered Courses
                </p>
                <p className="mt-2 font-display text-3xl font-bold tabular-nums text-slate-900 dark:text-white">
                  {data.stats.registeredCourses}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
                <BookOpen className="h-5 w-5" aria-hidden="true" />
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Active semester enrollments
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Upcoming Exams
                </p>
                <p className="mt-2 font-display text-3xl font-bold tabular-nums text-slate-900 dark:text-white">
                  {data.stats.upcomingExams}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
                <FileSpreadsheet className="h-5 w-5" aria-hidden="true" />
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Scheduled assessments
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Cumulative CGPA
                </p>
                <p className="mt-2 font-display text-3xl font-bold tabular-nums text-slate-900 dark:text-white">
                  {data.stats.latestCgpa !== null ? data.stats.latestCgpa : '—'}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
                <Award className="h-5 w-5" aria-hidden="true" />
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              From published transcripts
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <section className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-7 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                Weekly Class Schedule Preview
              </h2>
              <button
                type="button"
                onClick={() => onNavigate('timetable')}
                className="text-xs font-semibold text-blue-700 hover:underline dark:text-blue-400"
              >
                Full Timetable
              </button>
            </div>
            {data.timetablePreview.length === 0 ? (
              <p className="mt-6 text-sm text-slate-500">
                No timetable entries assigned for your section yet.
              </p>
            ) : (
              <div className="mt-4 divide-y divide-slate-200 dark:divide-slate-800">
                {data.timetablePreview.map((slot) => (
                  <div
                    key={slot.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
                  >
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        {slot.subjectName}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {slot.day} · Period {slot.periodNumber} · {slot.facultyName}
                      </p>
                    </div>
                    <div className="text-right font-mono text-xs text-slate-600 tabular-nums dark:text-slate-300">
                      <p>
                        {slot.startTime} – {slot.endTime}
                      </p>
                      <p className="text-blue-700 dark:text-blue-400">
                        Room {slot.classroomNumber}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                Upcoming Examinations
              </h2>
              <button
                type="button"
                onClick={() => onNavigate('examinations')}
                className="text-xs font-semibold text-blue-700 hover:underline dark:text-blue-400"
              >
                View All
              </button>
            </div>
            {data.upcomingExamsList.length === 0 ? (
              <p className="mt-6 text-sm text-slate-500">
                No upcoming examinations scheduled for your program.
              </p>
            ) : (
              <div className="mt-4 divide-y divide-slate-200 dark:divide-slate-800">
                {data.upcomingExamsList.map((exam) => (
                  <div key={exam.id} className="py-3">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {exam.subject}
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-slate-500 tabular-nums dark:text-slate-400">
                      {exam.examDate} · {exam.startTime}–{exam.endTime} · Room{' '}
                      {exam.classroomNumber}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    );
  }

  // ADMIN DASHBOARD
  const kpis = [
    {
      label: 'Total Students',
      value: data.stats.totalStudents,
      icon: Users,
      sub: 'Active directory records',
    },
    {
      label: 'Total Courses',
      value: data.stats.totalCourses,
      icon: GraduationCap,
      sub: 'Configured degree programs',
    },
    {
      label: 'Total Classrooms',
      value: data.stats.totalClassrooms,
      icon: Building2,
      sub: 'Halls, labs & seminar rooms',
    },
    {
      label: 'Registered Students',
      value: data.stats.totalRegisteredStudents,
      icon: BookOpen,
      sub: 'Course registration participants',
    },
    {
      label: 'Average Attendance',
      value: `${data.stats.averageAttendance}%`,
      icon: ClipboardCheck,
      sub: 'Across all marked sessions',
    },
    {
      label: 'Upcoming Examinations',
      value: data.stats.upcomingExaminations,
      icon: CalendarClock,
      sub: 'Scheduled assessments',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            NANI CAMPUS Administration Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Institutional metrics across admissions, attendance, classrooms, and examinations.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onNavigate('students')}
            className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            Manage Students
          </button>
          <button
            type="button"
            onClick={() => onNavigate('reports')}
            className="rounded-lg bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-800"
          >
            Generate Reports
          </button>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {kpi.label}
                  </p>
                  <p className="mt-2 font-display text-3xl font-bold tabular-nums text-slate-900 dark:text-white">
                    {kpi.value}
                  </p>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                {kpi.sub}
              </p>
            </div>
          );
        })}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
            Attendance Rate by Course (%)
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Present & late percentage across active degree programs.
          </p>
          <div className="mt-5 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.attendanceChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="course" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="rate" name="Attendance %" fill="#1D4ED8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
            Monthly Admissions Trend
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Student intake progression across the current academic term.
          </p>
          <div className="mt-5 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.monthlyAdmissions}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="admissions"
                  name="Admissions"
                  stroke="#0B1F3A"
                  fill="#BFDBFE"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
            Course-Wise Enrollment Statistics
          </h2>
          <div className="mt-4 divide-y divide-slate-200 dark:divide-slate-800">
            {data.courseStats.map((item) => (
              <div
                key={item.courseCode}
                className="flex items-center justify-between gap-3 py-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900 dark:text-slate-100">
                    {item.courseName}
                  </p>
                  <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
                    {item.courseCode}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-xs font-semibold text-blue-700 tabular-nums dark:text-blue-400">
                  {item.students} / {item.capacity}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-7 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
              Recent Admissions
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('students')}
              className="text-xs font-semibold text-blue-700 hover:underline dark:text-blue-400"
            >
              Open Directory
            </button>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <tr>
                  <th className="py-2 pr-3">ID</th>
                  <th className="py-2 pr-3">Name</th>
                  <th className="py-2 pr-3">Course</th>
                  <th className="py-2 text-right">Admission Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {data.recentAdmissions.map((stu) => (
                  <tr key={stu.studentId}>
                    <td className="py-2.5 pr-3 font-mono text-xs font-semibold text-blue-700 dark:text-blue-400">
                      {stu.studentId}
                    </td>
                    <td className="py-2.5 pr-3 font-medium text-slate-900 dark:text-slate-100">
                      {stu.fullName}
                    </td>
                    <td className="py-2.5 pr-3 text-xs text-slate-600 dark:text-slate-300">
                      {stu.course}
                    </td>
                    <td className="py-2.5 text-right font-mono text-xs text-slate-500 tabular-nums">
                      {stu.admissionDate}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
          Recent System Activities
        </h2>
        <div className="mt-4 divide-y divide-slate-200 dark:divide-slate-800">
          {data.recentActivities.map((act) => (
            <div
              key={act.id}
              className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm"
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {act.action}
                </span>
                <span className="text-slate-600 dark:text-slate-400">
                  · {act.details}
                </span>
              </div>
              <span className="font-mono text-xs text-slate-500 tabular-nums">
                {act.actorName} · {new Date(act.createdAt).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
