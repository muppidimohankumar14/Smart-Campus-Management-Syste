import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { CreditCard, Download, Mail, Phone, Printer } from 'lucide-react';
import { apiRequest } from '../../utils/api';
import { downloadIdCardPdf } from '../../utils/exportHelpers';
import { StudentRecord, UserAccount } from '../../types/campus';

interface IdCardModuleProps {
  user: Omit<UserAccount, 'passwordHash'>;
  onNotify: (
    type: 'success' | 'error' | 'info',
    title: string,
    message?: string
  ) => void;
}

export function IdCardModule({ user, onNotify }: IdCardModuleProps) {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [photoError, setPhotoError] = useState(false);

  useEffect(() => {
    setLoading(true);
    apiRequest<{ students: StudentRecord[] }>('/students')
      .then((res) => {
        setStudents(res.students);
        if (res.students.length > 0) {
          setSelectedId(res.students[0].studentId);
        }
      })
      .catch((err) => {
        onNotify(
          'error',
          'Load Failed',
          err instanceof Error ? err.message : 'Unable to fetch students.'
        );
      })
      .finally(() => setLoading(false));
  }, [user.userId]);

  const activeStudent =
    students.find((s) => s.studentId === selectedId) || null;

  useEffect(() => {
    setPhotoError(false);
    if (!activeStudent) {
      setQrDataUrl('');
      return;
    }
    const payload = JSON.stringify({
      institution: 'NANI CAMPUS',
      studentId: activeStudent.studentId,
      name: activeStudent.fullName,
      course: activeStudent.course,
      academicYear: activeStudent.academicYear,
    });
    QRCode.toDataURL(payload, { width: 180, margin: 1 })
      .then((url) => setQrDataUrl(url))
      .catch(() => setQrDataUrl(''));
  }, [activeStudent]);

  if (loading) {
    return <div className="h-64 animate-pulse rounded-xl bg-white dark:bg-slate-900" />;
  }

  const initials = activeStudent
    ? activeStudent.fullName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join('')
    : 'ST';

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end no-print">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Student ID Card Generator
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Generate official digital and printable student identity cards with embedded QR verification.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {user.role === 'ADMIN' && students.length > 0 && (
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              aria-label="Select student for ID card"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              {students.map((s) => (
                <option key={s.studentId} value={s.studentId}>
                  {s.studentId} — {s.fullName}
                </option>
              ))}
            </select>
          )}

          {activeStudent && (
            <>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <Printer className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Print Card</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  downloadIdCardPdf(activeStudent, qrDataUrl);
                  onNotify(
                    'success',
                    'ID Card Downloaded',
                    `${activeStudent.studentId}-ID-Card.pdf saved.`
                  );
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Download PDF</span>
              </button>
            </>
          )}
        </div>
      </div>

      {!activeStudent ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <CreditCard className="mx-auto h-8 w-8 text-blue-600" aria-hidden="true" />
          <p className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
            No student record available for ID card generation
          </p>
        </div>
      ) : (
        <div className="flex justify-center py-6">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between bg-[#0B1F3A] px-5 py-4 text-white">
              <div className="flex items-center gap-3">
                <img
                  src="/src/assets/images/smart_campus_crest_1794839688853.jpg"
                  alt="NANI CAMPUS Logo"
                  referrerPolicy="no-referrer"
                  className="h-10 w-10 rounded-lg object-cover ring-1 ring-white/25"
                />
                <div>
                  <h2 className="font-display text-base font-bold tracking-wide">
                    NANI CAMPUS
                  </h2>
                  <p className="text-[11px] text-blue-200">
                    Northbridge Institute of Technology
                  </p>
                </div>
              </div>
              <span className="font-mono text-xs font-semibold text-blue-200">
                STUDENT ID
              </span>
            </div>

            <div className="p-5">
              <div className="flex items-start gap-4">
                {activeStudent.photoUrl && !photoError ? (
                  <img
                    src={activeStudent.photoUrl}
                    alt={activeStudent.fullName}
                    referrerPolicy="no-referrer"
                    onError={() => setPhotoError(true)}
                    className="h-24 w-24 shrink-0 rounded-xl object-cover ring-2 ring-blue-100 dark:ring-slate-700"
                  />
                ) : (
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-blue-50 font-display text-2xl font-bold text-[#0B1F3A] ring-2 ring-blue-100 dark:bg-blue-950 dark:text-blue-300 dark:ring-slate-700">
                    {initials}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="font-mono text-xs font-bold text-blue-700 dark:text-blue-400">
                    {activeStudent.studentId}
                  </p>
                  <h3 className="mt-0.5 font-display text-xl font-bold text-slate-900 dark:text-white">
                    {activeStudent.fullName}
                  </h3>
                  <p className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {activeStudent.course}
                  </p>
                  <p className="mt-1 font-mono text-xs text-slate-500 dark:text-slate-400">
                    Academic Year: {activeStudent.academicYear}
                  </p>
                  <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
                    Semester {activeStudent.semester} · Section {activeStudent.section}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between gap-4 border-t border-slate-200 pt-4 dark:border-slate-800">
                <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    Campus Registrar Contact
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
                    <span>registrar@nanicampus.edu</span>
                  </p>
                  <p className="flex items-center gap-1.5 font-mono">
                    <Phone className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
                    <span>+1 (415) 800-1000</span>
                  </p>
                </div>

                {qrDataUrl && (
                  <div className="shrink-0 rounded-lg border border-slate-200 bg-white p-1.5">
                    <img
                      src={qrDataUrl}
                      alt={`QR verification code for ${activeStudent.studentId}`}
                      className="h-20 w-20"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
