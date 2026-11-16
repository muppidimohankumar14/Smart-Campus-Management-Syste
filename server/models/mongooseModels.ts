import mongoose, { Schema } from 'mongoose';

const UserSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    role: { type: String, enum: ['ADMIN', 'STUDENT'], required: true },
    studentId: { type: String },
    course: { type: String },
    passwordHash: { type: String, required: true },
    approved: { type: Boolean, default: true },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
  },
  { versionKey: false }
);

const StudentSchema = new Schema(
  {
    studentId: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, required: true },
    dateOfBirth: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    course: { type: String, required: true },
    admissionDate: { type: String, required: true },
    academicYear: { type: String, required: true },
    semester: { type: Number, required: true },
    section: { type: String, required: true },
    photoUrl: { type: String, default: '' },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: String },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
  },
  { versionKey: false }
);

const CourseSchema = new Schema(
  {
    courseCode: { type: String, required: true, unique: true },
    courseName: { type: String, required: true },
    description: { type: String, required: true },
    duration: { type: String, required: true },
    semesters: { type: Number, required: true },
    credits: { type: Number, required: true },
    semester: { type: Number, required: true },
    faculty: { type: String, required: true },
    registrationDeadline: { type: String, required: true },
    maxCapacity: { type: Number, required: true },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
  },
  { versionKey: false }
);

const ClassroomSchema = new Schema(
  {
    classroomId: { type: String, required: true, unique: true },
    roomNumber: { type: String, required: true, unique: true },
    buildingName: { type: String, required: true },
    floor: { type: String, required: true },
    capacity: { type: Number, required: true },
    classroomType: { type: String, required: true },
    facilities: [{ type: String }],
    assignedCourseSection: { type: String, default: '' },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
  },
  { versionKey: false }
);

const AttendanceSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    studentId: { type: String, required: true },
    date: { type: String, required: true },
    course: { type: String, required: true },
    status: { type: String, enum: ['Present', 'Absent', 'Late'], required: true },
    markedBy: { type: String, required: true },
    createdAt: { type: String, required: true },
  },
  { versionKey: false }
);

const TimetableSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    day: { type: String, required: true },
    periodNumber: { type: Number, required: true },
    subjectName: { type: String, required: true },
    facultyName: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    classroomNumber: { type: String, required: true },
    buildingName: { type: String, required: true },
    course: { type: String, required: true },
    section: { type: String, required: true },
    createdAt: { type: String, required: true },
  },
  { versionKey: false }
);

const RegistrationSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    studentId: { type: String, required: true },
    studentName: { type: String, required: true },
    courseCode: { type: String, required: true },
    courseName: { type: String, required: true },
    semester: { type: Number, required: true },
    credits: { type: Number, required: true },
    status: { type: String, required: true },
    registeredAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
  },
  { versionKey: false }
);

const ExaminationSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    examName: { type: String, required: true },
    examType: { type: String, required: true },
    subject: { type: String, required: true },
    course: { type: String, required: true },
    semester: { type: Number, required: true },
    examDate: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    classroomNumber: { type: String, required: true },
    maxMarks: { type: Number, required: true },
    createdAt: { type: String, required: true },
  },
  { versionKey: false }
);

const ExamResultSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    studentId: { type: String, required: true },
    studentName: { type: String, required: true },
    course: { type: String, required: true },
    semester: { type: Number, required: true },
    examName: { type: String, required: true },
    subjects: { type: Array, required: true },
    totalObtained: { type: Number, required: true },
    totalMax: { type: Number, required: true },
    percentage: { type: Number, required: true },
    grade: { type: String, required: true },
    sgpa: { type: Number, required: true },
    cgpa: { type: Number, required: true },
    status: { type: String, required: true },
    published: { type: Boolean, default: false },
    publishedAt: { type: String },
    createdAt: { type: String, required: true },
  },
  { versionKey: false }
);

const NotificationSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    category: { type: String, required: true },
    targetRole: { type: String, required: true },
    targetStudentId: { type: String },
    readBy: [{ type: String }],
    createdAt: { type: String, required: true },
  },
  { versionKey: false }
);

const CampusStateDocSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    payload: { type: Schema.Types.Mixed, required: true },
    updatedAt: { type: String, required: true },
  },
  { versionKey: false }
);

export const UserModel =
  mongoose.models.User || mongoose.model('User', UserSchema);
export const StudentModel =
  mongoose.models.Student || mongoose.model('Student', StudentSchema);
export const CourseModel =
  mongoose.models.Course || mongoose.model('Course', CourseSchema);
export const ClassroomModel =
  mongoose.models.Classroom || mongoose.model('Classroom', ClassroomSchema);
export const AttendanceModel =
  mongoose.models.Attendance || mongoose.model('Attendance', AttendanceSchema);
export const TimetableModel =
  mongoose.models.Timetable || mongoose.model('Timetable', TimetableSchema);
export const RegistrationModel =
  mongoose.models.Registration ||
  mongoose.model('Registration', RegistrationSchema);
export const ExaminationModel =
  mongoose.models.Examination ||
  mongoose.model('Examination', ExaminationSchema);
export const ExamResultModel =
  mongoose.models.ExamResult || mongoose.model('ExamResult', ExamResultSchema);
export const NotificationModel =
  mongoose.models.Notification ||
  mongoose.model('Notification', NotificationSchema);
export const CampusStateModel =
  mongoose.models.CampusState ||
  mongoose.model('CampusState', CampusStateDocSchema);
