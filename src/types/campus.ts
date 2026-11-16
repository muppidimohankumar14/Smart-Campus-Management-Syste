export type UserRole = 'ADMIN' | 'STUDENT';

export interface UserAccount {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  studentId?: string;
  course?: string;
  passwordHash: string;
  approved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSession {
  sessionId: string;
  userId: string;
  role: UserRole;
  userAgent: string;
  createdAt: string;
  expiresAt: string;
}

export interface StudentRecord {
  studentId: string;
  fullName: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  dateOfBirth: string;
  email: string;
  phone: string;
  address: string;
  course: string;
  admissionDate: string;
  academicYear: string;
  semester: number;
  section: string;
  photoUrl: string;
  isDeleted: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CourseRecord {
  courseCode: string;
  courseName: string;
  description: string;
  duration: string;
  semesters: number;
  credits: number;
  semester: number;
  faculty: string;
  registrationDeadline: string;
  maxCapacity: number;
  createdAt: string;
  updatedAt: string;
}

export interface ClassroomRecord {
  classroomId: string;
  roomNumber: string;
  buildingName: string;
  floor: string;
  capacity: number;
  classroomType: 'Lecture Hall' | 'Computer Lab' | 'Seminar Room' | 'Auditorium';
  facilities: string[];
  assignedCourseSection: string;
  createdAt: string;
  updatedAt: string;
}

export type AttendanceStatus = 'Present' | 'Absent' | 'Late';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string;
  course: string;
  status: AttendanceStatus;
  markedBy: string;
  createdAt: string;
}

export type DayOfWeek =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday';

export interface TimetableEntry {
  id: string;
  day: DayOfWeek;
  periodNumber: number;
  subjectName: string;
  facultyName: string;
  startTime: string;
  endTime: string;
  classroomNumber: string;
  buildingName: string;
  course: string;
  section: string;
  createdAt: string;
}

export type RegistrationStatus =
  | 'Pending'
  | 'Approved'
  | 'Rejected'
  | 'Cancelled';

export interface CourseRegistration {
  id: string;
  studentId: string;
  studentName: string;
  courseCode: string;
  courseName: string;
  semester: number;
  credits: number;
  status: RegistrationStatus;
  registeredAt: string;
  updatedAt: string;
}

export interface ExaminationRecord {
  id: string;
  examName: string;
  examType: 'Mid-Term' | 'Final' | 'Practical' | 'Internal Assessment';
  subject: string;
  course: string;
  semester: number;
  examDate: string;
  startTime: string;
  endTime: string;
  classroomNumber: string;
  maxMarks: number;
  createdAt: string;
}

export interface SubjectMark {
  subjectName: string;
  internalMarks: number;
  externalMarks: number;
  totalMarks: number;
  maxMarks: number;
  credits: number;
  grade: string;
  status: 'Pass' | 'Fail';
}

export interface ExamResultRecord {
  id: string;
  studentId: string;
  studentName: string;
  course: string;
  semester: number;
  examName: string;
  subjects: SubjectMark[];
  totalObtained: number;
  totalMax: number;
  percentage: number;
  grade: string;
  sgpa: number;
  cgpa: number;
  status: 'Pass' | 'Fail';
  published: boolean;
  publishedAt?: string;
  createdAt: string;
}

export type NotificationCategory =
  | 'Announcement'
  | 'Attendance'
  | 'Examination'
  | 'Result'
  | 'Registration'
  | 'Timetable';

export interface NotificationRecord {
  id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  targetRole: 'ALL' | 'ADMIN' | 'STUDENT';
  targetStudentId?: string;
  readBy: string[];
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  actorName: string;
  actorRole: UserRole | 'SYSTEM';
  details: string;
  createdAt: string;
}

export interface DatabasePayload {
  users: UserAccount[];
  sessions: AuthSession[];
  students: StudentRecord[];
  courses: CourseRecord[];
  classrooms: ClassroomRecord[];
  attendance: AttendanceRecord[];
  timetable: TimetableEntry[];
  registrations: CourseRegistration[];
  examinations: ExaminationRecord[];
  results: ExamResultRecord[];
  notifications: NotificationRecord[];
  activities: ActivityLog[];
}

export type NavModule =
  | 'dashboard'
  | 'students'
  | 'attendance'
  | 'timetable'
  | 'classrooms'
  | 'course-registration'
  | 'courses'
  | 'examinations'
  | 'results'
  | 'id-card'
  | 'notifications'
  | 'reports'
  | 'settings';
