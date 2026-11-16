import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Pencil,
  Search,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react';
import { NavSection, Student } from '../types/student';
import { exportStudentsToCsv } from '../utils/storage';

interface ViewStudentsViewProps {
  students: Student[];
  initialCourseFilter?: string;
  onClearInitialCourseFilter?: () => void;
  onNavigate: (section: NavSection) => void;
  onViewProfile: (student: Student) => void;
  onEditStudent: (student: Student) => void;
  onDeleteStudent: (student: Student) => void;
  onExportSuccess: (count: number) => void;
}

type SortField = 'id' | 'fullName' | 'age' | 'course' | 'createdAt';
type SortOrder = 'asc' | 'desc';

export function ViewStudentsView({
  students,
  initialCourseFilter = 'all',
  onClearInitialCourseFilter,
  onNavigate,
  onViewProfile,
  onEditStudent,
  onDeleteStudent,
  onExportSuccess,
}: ViewStudentsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState(initialCourseFilter || 'all');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  useEffect(() => {
    if (initialCourseFilter && initialCourseFilter !== 'all') {
      setCourseFilter(initialCourseFilter);
      setPage(1);
    }
  }, [initialCourseFilter]);

  const availableCourses = useMemo(() => {
    const set = new Set(students.map((s) => s.course));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [students]);

  const filteredStudents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return students
      .filter((student) => {
        const matchesCourse =
          courseFilter === 'all' || student.course === courseFilter;
        if (!matchesCourse) return false;
        if (!query) return true;
        return (
          student.id.toLowerCase().includes(query) ||
          student.fullName.toLowerCase().includes(query) ||
          student.course.toLowerCase().includes(query) ||
          student.email.toLowerCase().includes(query) ||
          student.phone.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => {
        let comparison = 0;
        if (sortField === 'age') {
          comparison = a.age - b.age;
        } else if (sortField === 'createdAt') {
          comparison =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        } else {
          comparison = a[sortField].localeCompare(b[sortField]);
        }
        return sortOrder === 'asc' ? comparison : -comparison;
      });
  }, [students, searchQuery, courseFilter, sortField, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedStudents = filteredStudents.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setCourseFilter('all');
    setPage(1);
    onClearInitialCourseFilter?.();
  };

  const handleExport = () => {
    exportStudentsToCsv(filteredStudents);
    onExportSuccess(filteredStudents.length);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Student Directory
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Browse, filter, sort, and inspect all enrolled student records.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExport}
            disabled={filteredStudents.length === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap shrink-0 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('add-student')}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-800 whitespace-nowrap shrink-0 dark:bg-blue-600 dark:hover:bg-blue-500"
          >
            <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
          <div className="relative flex-1 sm:max-w-sm">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Filter by ID, name, course, email, or phone..."
              aria-label="Filter student records"
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-8 text-sm text-slate-900 transition-colors focus-visible:border-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setPage(1);
                }}
                aria-label="Clear filter query"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={courseFilter}
              onChange={(e) => {
                setCourseFilter(e.target.value);
                setPage(1);
                if (e.target.value === 'all') {
                  onClearInitialCourseFilter?.();
                }
              }}
              aria-label="Filter by course"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus-visible:border-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="all">All Courses ({students.length})</option>
              {availableCourses.map((course) => (
                <option key={course} value={course}>
                  {course}
                </option>
              ))}
            </select>

            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              aria-label="Rows per page"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus-visible:border-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value={5}>5 per page</option>
              <option value={8}>8 per page</option>
              <option value={15}>15 per page</option>
              <option value={25}>25 per page</option>
            </select>

            {(searchQuery || courseFilter !== 'all') && (
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-lg px-2.5 py-2 text-xs font-medium text-blue-700 hover:bg-blue-50 whitespace-nowrap shrink-0 dark:text-blue-400 dark:hover:bg-blue-950/40"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {students.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-base font-semibold text-slate-800 dark:text-slate-200">
              No students enrolled yet
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Start building your directory by adding your first student record.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('add-student')}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800"
            >
              <UserPlus className="h-4 w-4" aria-hidden="true" />
              <span>Add First Student</span>
            </button>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-base font-semibold text-slate-800 dark:text-slate-200">
              No matching student records
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Try adjusting your search query or selected course filter.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-4 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
                  <tr>
                    <th className="px-5 py-3">
                      <button
                        type="button"
                        onClick={() => handleSort('id')}
                        className="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white whitespace-nowrap"
                      >
                        <span>Student ID</span>
                        <ArrowUpDown className="h-3 w-3" aria-hidden="true" />
                      </button>
                    </th>
                    <th className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleSort('fullName')}
                        className="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white whitespace-nowrap"
                      >
                        <span>Name</span>
                        <ArrowUpDown className="h-3 w-3" aria-hidden="true" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleSort('age')}
                        className="inline-flex items-center justify-end gap-1.5 hover:text-slate-900 dark:hover:text-white whitespace-nowrap"
                      >
                        <span>Age</span>
                        <ArrowUpDown className="h-3 w-3" aria-hidden="true" />
                      </button>
                    </th>
                    <th className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleSort('course')}
                        className="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white whitespace-nowrap"
                      >
                        <span>Course</span>
                        <ArrowUpDown className="h-3 w-3" aria-hidden="true" />
                      </button>
                    </th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {paginatedStudents.map((student) => (
                    <tr
                      key={student.id}
                      className="transition-colors hover:bg-blue-50/40 dark:hover:bg-slate-800/40"
                    >
                      <td className="px-5 py-3 font-mono text-xs font-semibold text-blue-700 tabular-nums whitespace-nowrap dark:text-blue-400">
                        {student.id}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap dark:text-slate-100">
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
                      <td className="px-4 py-3 text-slate-700 whitespace-nowrap dark:text-slate-300">
                        {student.course}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {student.email}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap dark:text-slate-400">
                        {student.phone}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
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
                          <button
                            type="button"
                            onClick={() => onDeleteStudent(student)}
                            aria-label={`Delete ${student.fullName}`}
                            className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 px-5 py-3.5 text-xs text-slate-600 sm:flex-row dark:border-slate-800 dark:text-slate-400">
              <p className="tabular-nums">
                Showing{' '}
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {(safePage - 1) * pageSize + 1}
                </span>
                –
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {Math.min(safePage * pageSize, filteredStudents.length)}
                </span>{' '}
                of{' '}
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {filteredStudents.length}
                </span>{' '}
                {filteredStudents.length === 1 ? 'record' : 'records'}
              </p>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  aria-label="Previous page"
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Prev</span>
                </button>
                <span className="px-2 font-mono tabular-nums">
                  Page {safePage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                  aria-label="Next page"
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <span>Next</span>
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
