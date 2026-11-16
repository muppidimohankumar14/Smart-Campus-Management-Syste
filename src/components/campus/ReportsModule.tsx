import { useEffect, useState } from 'react';
import { FileBarChart2, FileSpreadsheet, FileText } from 'lucide-react';
import { apiRequest } from '../../utils/api';
import {
  downloadCsvReport,
  downloadExcelReport,
  downloadPdfReport,
} from '../../utils/exportHelpers';

type ReportType =
  | 'students'
  | 'attendance'
  | 'registrations'
  | 'examinations'
  | 'results'
  | 'classrooms';

interface ReportPayload {
  title: string;
  columns: string[];
  rows: (string | number)[][];
}

interface ReportsModuleProps {
  onNotify: (
    type: 'success' | 'error' | 'info',
    title: string,
    message?: string
  ) => void;
}

const REPORT_TYPES: { id: ReportType; label: string }[] = [
  { id: 'students', label: 'Student Reports' },
  { id: 'attendance', label: 'Attendance Reports' },
  { id: 'registrations', label: 'Course Registration Reports' },
  { id: 'examinations', label: 'Examination Reports' },
  { id: 'results', label: 'Result Reports' },
  { id: 'classrooms', label: 'Classroom Usage Reports' },
];

export function ReportsModule({ onNotify }: ReportsModuleProps) {
  const [selectedType, setSelectedType] = useState<ReportType>('students');
  const [report, setReport] = useState<ReportPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiRequest<ReportPayload>(`/reports/${selectedType}`)
      .then((res) => setReport(res))
      .catch((err) => {
        onNotify(
          'error',
          'Report Load Failed',
          err instanceof Error ? err.message : 'Unable to generate report.'
        );
      })
      .finally(() => setLoading(false));
  }, [selectedType]);

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    if (!report) return;
    const baseName = `smart-campus-${selectedType}-report`;
    if (format === 'csv') {
      downloadCsvReport(baseName, report.columns, report.rows);
      onNotify('success', 'CSV Exported', `${baseName}.csv downloaded.`);
    } else if (format === 'excel') {
      downloadExcelReport(baseName, report.title, report.columns, report.rows);
      onNotify('success', 'Excel Exported', `${baseName}.xls downloaded.`);
    } else {
      downloadPdfReport(baseName, report.title, report.columns, report.rows);
      onNotify('success', 'PDF Exported', `${baseName}.pdf downloaded.`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Institutional Reports & Exports
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Preview live institutional datasets and export directly to CSV, Excel, or PDF.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!report || report.rows.length === 0}
            onClick={() => handleExport('csv')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <FileText className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            disabled={!report || report.rows.length === 0}
            onClick={() => handleExport('excel')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-50 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Export Excel</span>
          </button>
          <button
            type="button"
            disabled={!report || report.rows.length === 0}
            onClick={() => handleExport('pdf')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
          >
            <FileBarChart2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {REPORT_TYPES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSelectedType(item.id)}
            className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
              selectedType === item.id
                ? 'bg-[#0B1F3A] text-white dark:bg-blue-600'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
            {report?.title || 'Loading Report...'}
          </h2>
          {report && (
            <span className="font-mono text-xs text-slate-500 tabular-nums">
              {report.rows.length} rows
            </span>
          )}
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-slate-500">
            Generating report dataset...
          </div>
        ) : !report || report.rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            No records available for this report.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
                <tr>
                  {report.columns.map((col) => (
                    <th key={col} className="px-4 py-3 whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {report.rows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/30 dark:hover:bg-slate-800/40">
                    {row.map((cell, cellIdx) => (
                      <td
                        key={cellIdx}
                        className="px-4 py-2.5 text-slate-700 whitespace-nowrap dark:text-slate-300"
                      >
                        {String(cell)}
                      </td>
                    ))}
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
