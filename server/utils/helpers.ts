import { SubjectMark } from '../../src/types/campus';

export function timeToMinutes(hhmm: string): number {
  const [hStr, mStr] = hhmm.split(':');
  const h = Number.parseInt(hStr, 10);
  const m = Number.parseInt(mStr, 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return -1;
  return h * 60 + m;
}

export function timesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  const a1 = timeToMinutes(startA);
  const a2 = timeToMinutes(endA);
  const b1 = timeToMinutes(startB);
  const b2 = timeToMinutes(endB);
  if (a1 < 0 || a2 < 0 || b1 < 0 || b2 < 0) return false;
  return a1 < b2 && b1 < a2;
}

export function getDayNameFromDate(isoDate: string): string {
  const dateObj = new Date(`${isoDate}T12:00:00`);
  const days = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  return days[dateObj.getDay()] || '';
}

export function calculateGradeFromPercentage(pct: number): {
  grade: string;
  gradePoints: number;
  passed: boolean;
} {
  if (pct >= 90) return { grade: 'O', gradePoints: 10, passed: true };
  if (pct >= 80) return { grade: 'A+', gradePoints: 9, passed: true };
  if (pct >= 70) return { grade: 'A', gradePoints: 8, passed: true };
  if (pct >= 60) return { grade: 'B+', gradePoints: 7, passed: true };
  if (pct >= 50) return { grade: 'B', gradePoints: 6, passed: true };
  if (pct >= 40) return { grade: 'C', gradePoints: 5, passed: true };
  return { grade: 'F', gradePoints: 0, passed: false };
}

export function computeExamResultMetrics(
  rawSubjects: Array<{
    subjectName: string;
    internalMarks: number;
    externalMarks: number;
    maxMarks: number;
    credits: number;
  }>,
  previousCgpa?: number
): {
  subjects: SubjectMark[];
  totalObtained: number;
  totalMax: number;
  percentage: number;
  grade: string;
  sgpa: number;
  cgpa: number;
  status: 'Pass' | 'Fail';
} {
  let totalObtained = 0;
  let totalMax = 0;
  let totalCredits = 0;
  let weightedPoints = 0;
  let anyFail = false;

  const subjects: SubjectMark[] = rawSubjects.map((sub) => {
    const internal = Math.max(0, Number(sub.internalMarks) || 0);
    const external = Math.max(0, Number(sub.externalMarks) || 0);
    const maxMarks = Math.max(1, Number(sub.maxMarks) || 100);
    const credits = Math.max(1, Number(sub.credits) || 4);
    const total = internal + external;
    const pct = (total / maxMarks) * 100;
    const gradeInfo = calculateGradeFromPercentage(pct);

    if (!gradeInfo.passed) {
      anyFail = true;
    }

    totalObtained += total;
    totalMax += maxMarks;
    totalCredits += credits;
    weightedPoints += gradeInfo.gradePoints * credits;

    return {
      subjectName: sub.subjectName.trim(),
      internalMarks: internal,
      externalMarks: external,
      totalMarks: total,
      maxMarks,
      credits,
      grade: gradeInfo.grade,
      status: gradeInfo.passed ? 'Pass' : 'Fail',
    };
  });

  const percentage =
    totalMax > 0 ? Number(((totalObtained / totalMax) * 100).toFixed(2)) : 0;
  const overallGrade = calculateGradeFromPercentage(percentage);
  const sgpa =
    totalCredits > 0 ? Number((weightedPoints / totalCredits).toFixed(2)) : 0;
  const cgpa =
    typeof previousCgpa === 'number' && previousCgpa > 0
      ? Number(((previousCgpa + sgpa) / 2).toFixed(2))
      : sgpa;

  return {
    subjects,
    totalObtained,
    totalMax,
    percentage,
    grade: anyFail ? 'F' : overallGrade.grade,
    sgpa,
    cgpa,
    status: anyFail || !overallGrade.passed ? 'Fail' : 'Pass',
  };
}

export function isValidEmail(email: string): boolean {
  return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email.trim());
}

export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}
