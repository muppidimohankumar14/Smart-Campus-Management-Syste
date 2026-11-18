import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ExamResultRecord, StudentRecord } from '../types/campus';

export function downloadCsvReport(
  filename: string,
  columns: string[],
  rows: (string | number)[][]
): void {
  const escape = (val: string | number) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const csv = [
    columns.map(escape).join(','),
    ...rows.map((r) => r.map(escape).join(',')),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, `${filename}.csv`);
}

export function downloadExcelReport(
  filename: string,
  title: string,
  columns: string[],
  rows: (string | number)[][]
): void {
  const escapeHtml = (val: string | number) =>
    String(val ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
    <head><meta charset="UTF-8" /></head>
    <body>
      <h3>${escapeHtml(title)}</h3>
      <table border="1">
        <thead>
          <tr>${columns.map((c) => `<th>${escapeHtml(c)}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (r) =>
                `<tr>${r.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`
            )
            .join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;
  const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
  triggerDownload(blob, `${filename}.xls`);
}

export function downloadPdfReport(
  filename: string,
  title: string,
  columns: string[],
  rows: (string | number)[][]
): void {
  const doc = new jsPDF({ orientation: columns.length > 7 ? 'landscape' : 'portrait' });
  doc.setFillColor(11, 31, 58);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 24, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text('NANI CAMPUS — College Management System', 14, 11);
  doc.setFontSize(10);
  doc.text(title, 14, 18);

  doc.setTextColor(80, 90, 105);
  doc.setFontSize(8);
  doc.text(`Generated on ${new Date().toLocaleString()}`, 14, 31);

  autoTable(doc, {
    startY: 35,
    head: [columns],
    body: rows.map((r) => r.map((c) => String(c ?? ''))),
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [29, 78, 216], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [241, 245, 249] },
  });

  doc.save(`${filename}.pdf`);
}

export function downloadMarksheetPdf(result: ExamResultRecord): void {
  const doc = new jsPDF();
  doc.setFillColor(11, 31, 58);
  doc.rect(0, 0, 210, 32, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text('NANI CAMPUS INSTITUTE OF TECHNOLOGY', 14, 13);
  doc.setFontSize(10);
  doc.text('OFFICIAL STATEMENT OF MARKS', 14, 21);
  doc.setFontSize(9);
  doc.text(result.examName, 14, 27);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.text(`Student Name: ${result.studentName}`, 14, 44);
  doc.text(`Student ID: ${result.studentId}`, 14, 51);
  doc.text(`Program: ${result.course}`, 14, 58);
  doc.text(`Semester: ${result.semester}`, 140, 44);
  doc.text(`Result Status: ${result.status}`, 140, 51);
  doc.text(`Grade: ${result.grade}`, 140, 58);

  autoTable(doc, {
    startY: 66,
    head: [
      [
        'Subject',
        'Internal',
        'External',
        'Total',
        'Max',
        'Credits',
        'Grade',
        'Status',
      ],
    ],
    body: result.subjects.map((s) => [
      s.subjectName,
      String(s.internalMarks),
      String(s.externalMarks),
      String(s.totalMarks),
      String(s.maxMarks),
      String(s.credits),
      s.grade,
      s.status,
    ]),
    headStyles: { fillColor: [11, 31, 58], textColor: 255 },
    styles: { fontSize: 9, cellPadding: 3 },
  });

  const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } })
    .lastAutoTable?.finalY || 130;

  doc.setFillColor(239, 246, 255);
  doc.rect(14, finalY + 8, 182, 22, 'F');
  doc.setTextColor(11, 31, 58);
  doc.setFontSize(10);
  doc.text(
    `Total Marks: ${result.totalObtained} / ${result.totalMax}   |   Percentage: ${result.percentage}%   |   SGPA: ${result.sgpa}   |   CGPA: ${result.cgpa}`,
    20,
    finalY + 21
  );

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Controller of Examinations · NANI CAMPUS Digital Transcript',
    14,
    280
  );

  doc.save(`${result.studentId}-Sem${result.semester}-Marksheet.pdf`);
}

export function downloadIdCardPdf(
  student: StudentRecord,
  qrDataUrl: string
): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [88, 56] });
  doc.setFillColor(11, 31, 58);
  doc.rect(0, 0, 88, 14, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.text('NANI CAMPUS', 5, 6.5);
  doc.setFontSize(6);
  doc.setTextColor(191, 219, 254);
  doc.text('STUDENT IDENTITY CARD', 5, 11);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9.5);
  doc.text(student.fullName, 5, 22);
  doc.setFontSize(7.5);
  doc.setTextColor(29, 78, 216);
  doc.text(`ID: ${student.studentId}`, 5, 27);

  doc.setTextColor(51, 65, 85);
  doc.setFontSize(6.8);
  doc.text(`Course: ${student.course}`, 5, 33, { maxWidth: 52 });
  doc.text(`Academic Year: ${student.academicYear}`, 5, 41);
  doc.text(`Sem ${student.semester} · Section ${student.section}`, 5, 45);
  doc.setFontSize(5.8);
  doc.setTextColor(100, 116, 139);
  doc.text('registrar@nanicampus.edu · +1 (415) 800-1000', 5, 52);

  if (qrDataUrl) {
    doc.addImage(qrDataUrl, 'PNG', 63, 21, 20, 20);
  }
  doc.save(`${student.studentId}-ID-Card.pdf`);
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
