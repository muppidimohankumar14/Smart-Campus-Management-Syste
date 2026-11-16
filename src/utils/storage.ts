import { AdminProfile, Student, ThemeMode } from '../types/student';

const STORAGE_KEYS = {
  STUDENTS: 'campuscore_sms_students_v1',
  COURSES: 'campuscore_sms_courses_v1',
  THEME: 'campuscore_sms_theme_v1',
  AUTH: 'campuscore_sms_auth_v1',
  ADMIN: 'campuscore_sms_admin_v1',
} as const;

export const DEFAULT_COURSES: string[] = [
  'B.Tech Computer Science',
  'B.Sc Data Science',
  'Bachelor of Computer Applications',
  'Master of Computer Applications',
  'BBA Business Analytics',
  'B.Tech Electronics & Communication',
  'B.Com Accounting & Finance',
  'B.A. Economics',
];

export const DEFAULT_ADMIN_PROFILE: AdminProfile = {
  name: 'Dr. Elena Vance',
  title: 'Academic Registrar',
  institution: 'Northbridge Institute of Technology',
  email: 'registrar@northbridge.edu',
  username: 'admin',
};

export const INITIAL_SAMPLE_STUDENTS: Student[] = [
  {
    id: 'STU202601',
    fullName: 'Aarav Sharma',
    age: 20,
    course: 'B.Tech Computer Science',
    email: 'aarav.sharma@northbridge.edu',
    phone: '+1 (415) 890-2314',
    createdAt: '2026-11-02T09:15:00.000Z',
    updatedAt: '2026-11-02T09:15:00.000Z',
  },
  {
    id: 'STU202602',
    fullName: 'Maya Lin',
    age: 21,
    course: 'B.Sc Data Science',
    email: 'maya.lin@northbridge.edu',
    phone: '+1 (415) 742-8819',
    createdAt: '2026-11-04T11:30:00.000Z',
    updatedAt: '2026-11-04T11:30:00.000Z',
  },
  {
    id: 'STU202603',
    fullName: 'Liam OConnor',
    age: 19,
    course: 'Bachelor of Computer Applications',
    email: 'liam.oconnor@northbridge.edu',
    phone: '+1 (650) 319-4402',
    createdAt: '2026-11-06T14:20:00.000Z',
    updatedAt: '2026-11-06T14:20:00.000Z',
  },
  {
    id: 'STU202604',
    fullName: 'Priya Nair',
    age: 23,
    course: 'Master of Computer Applications',
    email: 'priya.nair@northbridge.edu',
    phone: '+1 (408) 612-9034',
    createdAt: '2026-11-08T10:05:00.000Z',
    updatedAt: '2026-11-08T10:05:00.000Z',
  },
  {
    id: 'STU202605',
    fullName: 'Daniel Brooks',
    age: 20,
    course: 'BBA Business Analytics',
    email: 'daniel.brooks@northbridge.edu',
    phone: '+1 (510) 487-2261',
    createdAt: '2026-11-10T16:45:00.000Z',
    updatedAt: '2026-11-10T16:45:00.000Z',
  },
  {
    id: 'STU202606',
    fullName: 'Sofia Rodriguez',
    age: 22,
    course: 'B.Tech Computer Science',
    email: 'sofia.rodriguez@northbridge.edu',
    phone: '+1 (415) 904-5538',
    createdAt: '2026-11-11T08:50:00.000Z',
    updatedAt: '2026-11-11T08:50:00.000Z',
  },
  {
    id: 'STU202607',
    fullName: 'Noah Takahashi',
    age: 21,
    course: 'B.Tech Electronics & Communication',
    email: 'noah.takahashi@northbridge.edu',
    phone: '+1 (650) 782-1190',
    createdAt: '2026-11-12T13:10:00.000Z',
    updatedAt: '2026-11-12T13:10:00.000Z',
  },
  {
    id: 'STU202608',
    fullName: 'Hannah Al-Mansoor',
    age: 19,
    course: 'B.A. Economics',
    email: 'hannah.mansoor@northbridge.edu',
    phone: '+1 (408) 549-7721',
    createdAt: '2026-11-13T15:00:00.000Z',
    updatedAt: '2026-11-13T15:00:00.000Z',
  },
  {
    id: 'STU202609',
    fullName: 'Rohan Kulkarni',
    age: 22,
    course: 'B.Sc Data Science',
    email: 'rohan.kulkarni@northbridge.edu',
    phone: '+1 (510) 633-8412',
    createdAt: '2026-11-14T09:40:00.000Z',
    updatedAt: '2026-11-14T09:40:00.000Z',
  },
  {
    id: 'STU202610',
    fullName: 'Chloe Bennett',
    age: 20,
    course: 'B.Com Accounting & Finance',
    email: 'chloe.bennett@northbridge.edu',
    phone: '+1 (415) 391-6045',
    createdAt: '2026-11-15T12:25:00.000Z',
    updatedAt: '2026-11-15T12:25:00.000Z',
  },
];

export function loadStudents(): Student[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    if (raw === null) {
      localStorage.setItem(
        STORAGE_KEYS.STUDENTS,
        JSON.stringify(INITIAL_SAMPLE_STUDENTS)
      );
      return INITIAL_SAMPLE_STUDENTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return INITIAL_SAMPLE_STUDENTS;
  }
}

export function saveStudents(students: Student[]): void {
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
}

export function loadCourses(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.COURSES);
    if (raw === null) {
      localStorage.setItem(
        STORAGE_KEYS.COURSES,
        JSON.stringify(DEFAULT_COURSES)
      );
      return DEFAULT_COURSES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : DEFAULT_COURSES;
  } catch {
    return DEFAULT_COURSES;
  }
}

export function saveCourses(courses: string[]): void {
  localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(courses));
}

export function loadTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    if (saved === 'dark' || saved === 'light') {
      return saved;
    }
    return 'light';
  } catch {
    return 'light';
  }
}

export function saveTheme(theme: ThemeMode): void {
  localStorage.setItem(STORAGE_KEYS.THEME, theme);
}

export function loadAuthSession(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.AUTH) === 'authenticated';
  } catch {
    return false;
  }
}

export function saveAuthSession(isAuthenticated: boolean): void {
  if (isAuthenticated) {
    localStorage.setItem(STORAGE_KEYS.AUTH, 'authenticated');
  } else {
    localStorage.removeItem(STORAGE_KEYS.AUTH);
  }
}

export function loadAdminProfile(): AdminProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ADMIN);
    if (!raw) {
      return DEFAULT_ADMIN_PROFILE;
    }
    return { ...DEFAULT_ADMIN_PROFILE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_ADMIN_PROFILE;
  }
}

export function saveAdminProfile(profile: AdminProfile): void {
  localStorage.setItem(STORAGE_KEYS.ADMIN, JSON.stringify(profile));
}

export function exportStudentsToCsv(students: Student[]): void {
  const headers = [
    'Student ID',
    'Full Name',
    'Age',
    'Course',
    'Email',
    'Phone Number',
    'Created At',
  ];
  const escapeCell = (value: string | number) => {
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const rows = students.map((s) =>
    [s.id, s.fullName, s.age, s.course, s.email, s.phone, s.createdAt]
      .map(escapeCell)
      .join(',')
  );
  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `student-records-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportStudentsToJson(students: Student[]): void {
  const payload = JSON.stringify(students, null, 2);
  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `campuscore-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
