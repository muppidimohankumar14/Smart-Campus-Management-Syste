import React, { useEffect, useState } from 'react';
import {
  Award,
  CheckCircle2,
  Download,
  Eye,
  EyeOff,
  Plus,
  Printer,
  Trash2,
  X,
} from 'lucide-react';
import { apiRequest } from '../../utils/api';
import { downloadMarksheetPdf } from '../../utils/exportHelpers';
import {
  ExamResultRecord,
  StudentRecord,
  UserAccount,
} from '../../types/campus';
import { ConfirmDialog } from '../ConfirmDialog';

interface ResultsModuleProps {
  user: Omit<UserAccount, 'passwordHash'>;
  onNotify: (
    type: 'success' | 'error' | 'info',
    title: string,
    message?: string
  ) => void;
}

export function ResultsModule({ user, onNotify }: ResultsModuleProps) {
  const [results, setResults] = useState<ExamResultRecord[]>([]);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ExamResultRecord | null>(
    null
  );

  const [studentId, setStudentId] = useState('STU202601');
  const [semester, setSemester] = useState('5');
  const [examName, setExamName] = useState('Fall 2026 Semester Examination');
  const [publishNow, setPublishNow] = useState(true);
  const [subjects, setSubjects] = useState([
    {
      subjectName: 'Operating Systems',
      internalMarks: '27',
      externalMarks: '61',
      maxMarks: '100',
      credits: '4',
    },
    {
      subjectName: 'Database Management Systems',
      internalMarks: '26',
      externalMarks: '58',
      maxMarks: '100',
      credits: '4',
    },
  ]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resData, stuData] = await Promise.all([
        apiRequest<{ results: ExamResultRecord[] }>('/results'),
        apiRequest<{ students: StudentRecord[] }>('/students'),
      ]);
      setResults(resData.results);
      setStudents(stuData.students);
      if (stuData.students.length > 0 && !studentId) {
        setStudentId(stuData.students[0].studentId);
      }
    } catch (err) {
      onNotify(
        'error',
        'Load Failed',
        err instanceof Error ? err.message : 'Unable to fetch exam results.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user.userId]);

  const handleAddSubjectRow = () => {
    setSubjects((prev) => [
      ...prev,
      {
        subjectName: '',
        internalMarks: '25',
        externalMarks: '55',
        maxMarks: '100',
        credits: '4',
      },
    ]);
  };

  const handleCreateResult = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const cleanSubjects = subjects
        .filter((s) => s.subjectName.trim())
        .map((s) => ({
          subjectName: s.subjectName.trim(),
          internalMarks: Number(s.internalMarks),
          externalMarks: Number(s.externalMarks),
          maxMarks: Number(s.maxMarks),
          credits: Number(s.credits),
        }));

      await apiRequest('/results', {
        method: 'POST',
        body: JSON.stringify({
          studentId,
          semester: Number(semester),
          examName,
          subjects: cleanSubjects,
          published: publishNow,
        }),
      });
      onNotify(
        'success',
        'Result Recorded',
        publishNow
          ? 'Result calculated and published to student portal.'
          : 'Result saved as unpublished draft.'
      );
      setModalOpen(false);
      await loadData();
    } catch (err) {
      onNotify(
        'error',
        'Save Failed',
        err instanceof Error ? err.message : 'Unable to record exam result.'
      );
    }
  };

  const handleTogglePublish = async (result: ExamResultRecord) => {
    try {
      await apiRequest(`/results/${result.id}/publish`, {
        method: 'PUT',
        body: JSON.stringify({ published: !result.published }),
      });
      onNotify(
        'success',
        result.published ? 'Result Unpublished' : 'Result Published',
        `${result.studentName} (${result.examName})`
      );
      await loadData();
    } catch (err) {
      onNotify(
        'error',
        'Update Failed',
        err instanceof Error ? err.message : 'Unable to change publish status.'
      );
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiRequest(`/results/${deleteTarget.id}`, { method: 'DELETE' });
      onNotify('success', 'Result Deleted', `${deleteTarget.id} removed.`);
      setDeleteTarget(null);
      await loadData();
    } catch (err) {
      onNotify(
        'error',
        'Delete Failed',
        err instanceof Error ? err.message : 'Unable to delete result.'
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end no-print">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {user.role === 'ADMIN'
              ? 'Exam Results Management'
              : 'My Published Exam Results'}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {user.role === 'ADMIN'
              ? 'Record internal & external subject marks with automatic GPA calculation and publish control.'
              : 'View your published semester-wise marksheets, SGPA/CGPA, and download PDF transcripts.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <Printer className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Print Marksheet</span>
          </button>

          {user.role === 'ADMIN' && (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>Enter Subject Marks</span>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="h-56 animate-pulse rounded-xl bg-white dark:bg-slate-900" />
      ) : results.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <Award className="mx-auto h-8 w-8 text-blue-600" aria-hidden="true" />
          <p className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
            No published results available yet
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Published semester marksheets will appear here once released by the Registrar.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {results.map((res) => (
            <section
              key={res.id}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-[#0B1F3A] px-6 py-4 text-white dark:border-slate-800">
                <div>
                  <p className="font-mono text-xs text-blue-200">
                    {res.studentId} · Semester {res.semester} · {res.examName}
                  </p>
                  <h2 className="mt-0.5 font-display text-lg font-bold">
                    {res.studentName} — {res.course}
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-2 no-print">
                  {user.role === 'ADMIN' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleTogglePublish(res)}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                          res.published
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                            : 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                        }`}
                      >
                        {res.published ? (
                          <>
                            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Published (Click to Hide)</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Draft (Click to Publish)</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(res)}
                        aria-label={`Delete result ${res.id}`}
                        className="rounded-lg bg-white/10 p-1.5 text-red-200 hover:bg-red-600 hover:text-white"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      downloadMarksheetPdf(res);
                      onNotify('success', 'PDF Downloaded', `${res.studentId}-Sem${res.semester}-Marksheet.pdf`);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-500"
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
                    <tr>
                      <th className="px-6 py-3">Subject</th>
                      <th className="px-4 py-3 text-right">Internal</th>
                      <th className="px-4 py-3 text-right">External</th>
                      <th className="px-4 py-3 text-right">Total</th>
                      <th className="px-4 py-3 text-right">Max</th>
                      <th className="px-4 py-3 text-right">Credits</th>
                      <th className="px-4 py-3 text-right">Grade</th>
                      <th className="px-6 py-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {res.subjects.map((sub, i) => (
                      <tr key={`${res.id}-${i}`}>
                        <td className="px-6 py-3 font-medium text-slate-900 dark:text-slate-100">
                          {sub.subjectName}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs tabular-nums">
                          {sub.internalMarks}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs tabular-nums">
                          {sub.externalMarks}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs font-semibold tabular-nums text-blue-700 dark:text-blue-400">
                          {sub.totalMarks}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs tabular-nums text-slate-500">
                          {sub.maxMarks}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs tabular-nums">
                          {sub.credits}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs font-bold">
                          {sub.grade}
                        </td>
                        <td className="px-6 py-3 text-right">
                          <span
                            className={`text-xs font-semibold ${
                              sub.status === 'Pass'
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}
                          >
                            {sub.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-200 bg-blue-50/50 px-6 py-4 text-xs sm:grid-cols-6 dark:border-slate-800 dark:bg-slate-800/40">
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Total Marks</p>
                  <p className="mt-0.5 font-mono text-sm font-bold tabular-nums text-slate-900 dark:text-white">
                    {res.totalObtained} / {res.totalMax}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Percentage</p>
                  <p className="mt-0.5 font-mono text-sm font-bold tabular-nums text-slate-900 dark:text-white">
                    {res.percentage}%
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Overall Grade</p>
                  <p className="mt-0.5 font-mono text-sm font-bold text-blue-700 dark:text-blue-400">
                    {res.grade}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400">SGPA</p>
                  <p className="mt-0.5 font-mono text-sm font-bold tabular-nums text-slate-900 dark:text-white">
                    {res.sgpa}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400">CGPA</p>
                  <p className="mt-0.5 font-mono text-sm font-bold tabular-nums text-slate-900 dark:text-white">
                    {res.cgpa}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Final Status</p>
                  <p
                    className={`mt-0.5 flex items-center gap-1 font-display text-sm font-bold ${
                      res.status === 'Pass'
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    <span>{res.status}</span>
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
            className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                Enter Subject-Wise Exam Marks
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleCreateResult} className="space-y-4 p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Student *
                  </label>
                  <select
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    {students.map((s) => (
                      <option key={s.studentId} value={s.studentId}>
                        {s.studentId} — {s.fullName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Semester *
                  </label>
                  <input
                    required
                    type="number"
                    min={1}
                    max={8}
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Examination Title *
                  </label>
                  <input
                    required
                    type="text"
                    value={examName}
                    onChange={(e) => setExamName(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Subject Marks (Internal + External)
                  </p>
                  <button
                    type="button"
                    onClick={handleAddSubjectRow}
                    className="text-xs font-semibold text-blue-700 hover:underline dark:text-blue-400"
                  >
                    + Add Subject Row
                  </button>
                </div>

                {subjects.map((sub, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-1 gap-2 rounded-lg border border-slate-200 p-3 sm:grid-cols-6 dark:border-slate-800"
                  >
                    <input
                      required
                      type="text"
                      placeholder="Subject Name"
                      value={sub.subjectName}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSubjects((prev) =>
                          prev.map((item, i) =>
                            i === idx ? { ...item, subjectName: val } : item
                          )
                        );
                      }}
                      className="sm:col-span-2 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                    <input
                      required
                      type="number"
                      min={0}
                      max={50}
                      placeholder="Internal"
                      value={sub.internalMarks}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSubjects((prev) =>
                          prev.map((item, i) =>
                            i === idx ? { ...item, internalMarks: val } : item
                          )
                        );
                      }}
                      className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                    <input
                      required
                      type="number"
                      min={0}
                      max={100}
                      placeholder="External"
                      value={sub.externalMarks}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSubjects((prev) =>
                          prev.map((item, i) =>
                            i === idx ? { ...item, externalMarks: val } : item
                          )
                        );
                      }}
                      className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                    <input
                      required
                      type="number"
                      min={10}
                      max={200}
                      placeholder="Max"
                      value={sub.maxMarks}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSubjects((prev) =>
                          prev.map((item, i) =>
                            i === idx ? { ...item, maxMarks: val } : item
                          )
                        );
                      }}
                      className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                    <input
                      required
                      type="number"
                      min={1}
                      max={10}
                      placeholder="Credits"
                      value={sub.credits}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSubjects((prev) =>
                          prev.map((item, i) =>
                            i === idx ? { ...item, credits: val } : item
                          )
                        );
                      }}
                      className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </div>
                ))}
              </div>

              <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={publishNow}
                  onChange={(e) => setPublishNow(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-700"
                />
                <span>Publish immediately to student portal (uncheck to save as hidden draft)</span>
              </label>

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
                  Calculate & Save Result
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete Exam Result"
        description={`Delete semester ${deleteTarget?.semester} result for ${deleteTarget?.studentName}?`}
        confirmLabel="Delete Result"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
