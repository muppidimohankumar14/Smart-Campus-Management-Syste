import {
  ArrowRight,
  BookOpen,
  CalendarPlus,
  Eye,
  Pencil,
  Search,
  SlidersHorizontal,
  UserPlus,
  Users,
} from 'lucide-react';
import { NavSection, Student } from '../types/student';

interface DashboardViewProps {
  students: Student[];
  courses: string[];
  onNavigate: (section: NavSection) => void;
  onFilterByCourse: (course: string) => void;
  onViewProfile: (student: Student) => void;
  onEditStudent: (student: Student) => void;
}

export function DashboardView({
  students,
  courses,
  onNavigate,
  onFilterByCourse,
  onViewProfile,
  onEditStudent,
}: DashboardViewProps) {
  const totalStudents = students.length;

  const activeCoursesMap = new Map<string, number>();
  for (const student of students) {
    activeCoursesMap.set(
      student.course,
      (activeCoursesMap.get(student.course) || 0) + 1
    );
  }
  const uniqueActiveCourses = activeCoursesMap.size;
  const totalConfiguredCourses = Math.max(courses.length, uniqueActiveCourses);

  const averageAge =
    totalStudents > 0
      ? (
          students.reduce((sum, s) => sum + s.age, 0) / totalStudents
        ).toFixed(1)
      : '0.0';

  const now = Date.now();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const recentlyAddedCount = students.filter(
    (s) => now - new Date(s.createdAt).getTime() <= sevenDaysMs
  ).length;

  const recentStudents = [...students]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 5);

  const courseBreakdown = Array.from(activeCoursesMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const maxCourseCount = Math.max(
    1,
    ...courseBreakdown.map(([, count]) => count)
  );

  const stats = [
    {
      label: 'Total Students',
      value: totalStudents,
      detail: `${uniqueActiveCourses} active programs`,
      icon: Users,
    },
    {
      label: 'Total Courses',
      value: totalConfiguredCourses,
      detail: `${uniqueActiveCourses} with enrolled students`,
      icon: BookOpen,
    },
    {
      label: 'Average Student Age',
      value: averageAge,
      detail: 'Years across directory',
      icon: CalendarPlus,
    },
    {
      label: 'Added Last 7 Days',
      value: recentlyAddedCount,
      detail: 'New enrollment entries',
      icon: UserPlus,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Student Management Overview
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Monitor enrollment totals, course distribution, and recently registered student records.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => onNavigate('search-student')}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <Search className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Lookup by ID</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('view-students')}
            className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-semibold text-blue-800 transition-colors hover:bg-blue-100 whitespace-nowrap shrink-0 dark:border-blue-900/70 dark:bg-blue-950/50 dark:text-blue-300 dark:hover:bg-blue-900/60"
          >
            <span>Open Full Directory</span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <section
        aria-label="Key enrollment statistics"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-blue-200 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-800/70"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {item.label}
                  </p>
                  <p className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-900 tabular-nums dark:text-white">
                    {item.value}
                  </p>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                {item.detail}
              </p>
            </div>
          );
        })}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-7 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                Enrollment by Course
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Click any course bar to filter the student directory.
              </p>
            </div>
            <span className="font-mono text-xs text-slate-500 tabular-nums dark:text-slate-400">
              {totalStudents} total
            </span>
          </div>

          {courseBreakdown.length === 0 ? (
            <div className="mt-8 rounded-lg border border-dashed border-slate-200 p-8 text-center dark:border-slate-800">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                No course enrollment data yet
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Add student records to view program distribution.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {courseBreakdown.map(([courseName, count]) => {
                const percent = Math.round((count / totalStudents) * 100);
                const widthPercent = Math.max(
                  8,
                  Math.round((count / maxCourseCount) * 100)
                );
                return (
                  <button
                    key={courseName}
                    type="button"
                    onClick={() => onFilterByCourse(courseName)}
                    className="group block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-lg"
                  >
                    <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                      <span className="truncate font-medium text-slate-800 group-hover:text-blue-700 dark:text-slate-200 dark:group-hover:text-blue-400">
                        {courseName}
                      </span>
                      <span className="shrink-0 font-mono text-xs text-slate-500 tabular-nums dark:text-slate-400">
                        {count} {count === 1 ? 'student' : 'students'} · {percent}%
                      </span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-blue-700 transition-all duration-200 group-hover:bg-blue-600 dark:bg-blue-500 dark:group-hover:bg-blue-400"
                        style={{ width: `${widthPercent}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
            Administration Shortcuts
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Direct access to registrar tasks from your workflow.
          </p>

          <div className="mt-5 divide-y divide-slate-200 dark:divide-slate-800">
            <button
              type="button"
              onClick={() => onNavigate('add-student')}
              className="flex w-full items-center justify-between gap-4 py-3.5 text-left transition-colors hover:text-blue-700 dark:hover:text-blue-400"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
                  <UserPlus className="h-4 w-4" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Register New Student
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Validate unique ID, email, and phone
                  </p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate('search-student')}
              className="flex w-full items-center justify-between gap-4 py-3.5 text-left transition-colors hover:text-blue-700 dark:hover:text-blue-400"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
                  <Search className="h-4 w-4" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Search by Student ID
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Instant lookup with full profile card
                  </p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate('manage-students')}
              className="flex w-full items-center justify-between gap-4 py-3.5 text-left transition-colors hover:text-blue-700 dark:hover:text-blue-400"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
                  <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Update or Remove Records
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Edit details or delete with confirmation
                  </p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
            </button>
          </div>
        </section>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div>
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
              Recently Added Students
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Latest five entries saved in your browser registry.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('view-students')}
            className="text-xs font-semibold text-blue-700 hover:underline whitespace-nowrap shrink-0 dark:text-blue-400"
          >
            View All ({totalStudents})
          </button>
        </div>

        {recentStudents.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              No student records found
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Register your first student to populate the recently added list.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('add-student')}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800"
            >
              <UserPlus className="h-4 w-4" aria-hidden="true" />
              <span>Add First Student</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
                <tr>
                  <th className="px-6 py-3">Student ID</th>
                  <th className="px-4 py-3">Full Name</th>
                  <th className="px-4 py-3 text-right">Age</th>
                  <th className="px-4 py-3">Course</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {recentStudents.map((student) => (
                  <tr
                    key={student.id}
                    className="transition-colors hover:bg-blue-50/40 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-6 py-3 font-mono text-xs font-semibold text-blue-700 tabular-nums dark:text-blue-400">
                      {student.id}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                      <button
                        type="button"
                        onClick={() => onViewProfile(student)}
                        className="text-left hover:text-blue-700 hover:underline dark:hover:text-blue-400"
                      >
                        {student.fullName}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-slate-700 tabular-nums dark:text-slate-300">
                      {student.age}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                      {student.course}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {student.email}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onViewProfile(student)}
                          aria-label={`View profile for ${student.fullName}`}
                          className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-blue-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-blue-400"
                        >
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onEditStudent(student)}
                          aria-label={`Edit ${student.fullName}`}
                          className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-blue-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-blue-400"
                        >
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
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
