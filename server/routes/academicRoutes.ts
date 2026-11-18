import { NextFunction, Response, Router } from 'express';
import { appendActivity, getDb, saveDb } from '../db';
import {
  AuthenticatedRequest,
  authenticateToken,
  requireRole,
} from '../middleware/auth';
import { isValidEmail, isValidPhone } from '../utils/helpers';
import {
  AttendanceStatus,
  ClassroomRecord,
  CourseRecord,
  StudentRecord,
} from '../../src/types/campus';

const router = Router();

const asyncHandler =
  (
    fn: (
      req: AuthenticatedRequest,
      res: Response,
      next: NextFunction
    ) => Promise<void> | void
  ) =>
  (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// 1. Dashboard Overview (Role-Aware)
router.get('/dashboard', authenticateToken, (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const user = req.user!;
  const activeStudents = db.students.filter((s) => !s.isDeleted);

  if (user.role === 'STUDENT') {
    const myStudent = activeStudents.find(
      (s) => s.studentId === user.studentId
    );
    const myAttendance = db.attendance.filter(
      (a) => a.studentId === user.studentId
    );
    const presentCount = myAttendance.filter(
      (a) => a.status === 'Present' || a.status === 'Late'
    ).length;
    const attendancePct =
      myAttendance.length > 0
        ? Number(((presentCount / myAttendance.length) * 100).toFixed(1))
        : 100;

    const myRegistrations = db.registrations.filter(
      (r) => r.studentId === user.studentId && r.status !== 'Cancelled'
    );
    const myExams = db.examinations.filter(
      (e) =>
        (!myStudent || e.course === myStudent.course) &&
        e.examDate >= new Date().toISOString().slice(0, 10)
    );
    const myPublishedResults = db.results.filter(
      (r) => r.studentId === user.studentId && r.published
    );
    const latestResult = [...myPublishedResults].sort(
      (a, b) => b.semester - a.semester
    )[0];

    const myTimetable = myStudent
      ? db.timetable.filter(
          (t) =>
            t.course === myStudent.course && t.section === myStudent.section
        )
      : [];

    const unreadNotifications = db.notifications.filter(
      (n) =>
        (n.targetRole === 'ALL' || n.targetRole === 'STUDENT') &&
        (!n.targetStudentId || n.targetStudentId === user.studentId) &&
        !n.readBy.includes(user.userId)
    ).length;

    res.json({
      role: 'STUDENT',
      student: myStudent || null,
      stats: {
        attendancePercentage: attendancePct,
        totalClassesMarked: myAttendance.length,
        registeredCourses: myRegistrations.length,
        upcomingExams: myExams.length,
        latestCgpa: latestResult ? latestResult.cgpa : null,
        unreadNotifications,
      },
      upcomingExamsList: myExams.slice(0, 5),
      timetablePreview: myTimetable.slice(0, 6),
      recentAttendance: [...myAttendance]
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 5),
    });
    return;
  }

  // ADMIN DASHBOARD
  const totalStudents = activeStudents.length;
  const totalCourses = db.courses.length;
  const totalClassrooms = db.classrooms.length;
  const registeredStudentIds = new Set(
    db.registrations
      .filter((r) => r.status === 'Approved' || r.status === 'Pending')
      .map((r) => r.studentId)
  );
  const totalRegisteredStudents = registeredStudentIds.size;

  const totalAttRecords = db.attendance.length;
  const totalPresentOrLate = db.attendance.filter(
    (a) => a.status === 'Present' || a.status === 'Late'
  ).length;
  const averageAttendance =
    totalAttRecords > 0
      ? Number(((totalPresentOrLate / totalAttRecords) * 100).toFixed(1))
      : 0;

  const todayIso = new Date().toISOString().slice(0, 10);
  const upcomingExams = db.examinations.filter((e) => e.examDate >= todayIso);

  const recentAdmissions = [...activeStudents]
    .sort((a, b) => b.admissionDate.localeCompare(a.admissionDate))
    .slice(0, 5);

  const courseCounts = new Map<string, number>();
  for (const stu of activeStudents) {
    courseCounts.set(stu.course, (courseCounts.get(stu.course) || 0) + 1);
  }
  const courseStats = db.courses.map((c) => ({
    courseCode: c.courseCode,
    courseName: c.courseName,
    students: courseCounts.get(c.courseName) || 0,
    capacity: c.maxCapacity,
  }));

  // Monthly Admissions Chart
  const monthNames = [
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const monthlyAdmissionsMap = new Map<string, number>();
  for (const m of monthNames) monthlyAdmissionsMap.set(m, 0);
  for (const stu of activeStudents) {
    const dt = new Date(stu.createdAt);
    const label = dt.toLocaleString('en-US', { month: 'short' });
    if (monthlyAdmissionsMap.has(label)) {
      monthlyAdmissionsMap.set(
        label,
        (monthlyAdmissionsMap.get(label) || 0) + 1
      );
    }
  }
  const monthlyAdmissions = Array.from(monthlyAdmissionsMap.entries()).map(
    ([month, admissions]) => ({ month, admissions })
  );

  // Attendance Chart by Course
  const attByCourseMap = new Map<
    string,
    { present: number; absent: number; late: number }
  >();
  for (const att of db.attendance) {
    const current = attByCourseMap.get(att.course) || {
      present: 0,
      absent: 0,
      late: 0,
    };
    if (att.status === 'Present') current.present += 1;
    else if (att.status === 'Late') current.late += 1;
    else current.absent += 1;
    attByCourseMap.set(att.course, current);
  }
  const attendanceChart = Array.from(attByCourseMap.entries()).map(
    ([course, counts]) => {
      const total = counts.present + counts.late + counts.absent;
      const rate =
        total > 0
          ? Math.round(((counts.present + counts.late) / total) * 100)
          : 0;
      return {
        course: course.replace('B.Tech ', '').replace('B.Sc ', ''),
        fullCourse: course,
        present: counts.present,
        late: counts.late,
        absent: counts.absent,
        rate,
      };
    }
  );

  res.json({
    role: 'ADMIN',
    stats: {
      totalStudents,
      totalCourses,
      totalClassrooms,
      totalRegisteredStudents,
      averageAttendance,
      upcomingExaminations: upcomingExams.length,
    },
    recentAdmissions,
    recentActivities: db.activities.slice(0, 8),
    courseStats,
    monthlyAdmissions,
    attendanceChart,
    upcomingExamsList: upcomingExams.slice(0, 5),
  });
});

// 2. Students CRUD + Soft Delete + Restore
router.get('/students', authenticateToken, (req: AuthenticatedRequest, res) => {
  const db = getDb();
  if (req.user!.role === 'STUDENT') {
    const own = db.students.filter(
      (s) => s.studentId === req.user!.studentId && !s.isDeleted
    );
    res.json({ students: own });
    return;
  }

  const includeDeleted = req.query.includeDeleted === 'true';
  const list = includeDeleted
    ? db.students
    : db.students.filter((s) => !s.isDeleted);
  res.json({ students: list });
});

router.post(
  '/students',
  authenticateToken,
  requireRole('ADMIN'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const body = req.body as Partial<StudentRecord>;
    const cleanId = (body.studentId || '').trim().toUpperCase();
    const cleanName = (body.fullName || '').trim();
    const cleanEmail = (body.email || '').trim().toLowerCase();
    const cleanPhone = (body.phone || '').trim();
    const ageNum = Number(body.age);

    if (
      !cleanId ||
      !cleanName ||
      !cleanEmail ||
      !cleanPhone ||
      !body.course ||
      Number.isNaN(ageNum)
    ) {
      res.status(400).json({
        error: 'Student ID, Full Name, Age, Course, Email, and Phone are required.',
      });
      return;
    }
    if (ageNum < 16 || ageNum > 80) {
      res.status(400).json({ error: 'Age must be between 16 and 80.' });
      return;
    }
    if (!isValidEmail(cleanEmail) || !isValidPhone(cleanPhone)) {
      res.status(400).json({ error: 'Provide a valid email and 10–15 digit phone number.' });
      return;
    }

    const db = getDb();
    if (db.students.some((s) => s.studentId.toUpperCase() === cleanId)) {
      res
        .status(409)
        .json({ error: `Student ID "${cleanId}" already exists.` });
      return;
    }

    const nowIso = new Date().toISOString();
    const record: StudentRecord = {
      studentId: cleanId,
      fullName: cleanName,
      age: ageNum,
      gender: body.gender || 'Male',
      dateOfBirth: body.dateOfBirth || '2006-01-01',
      email: cleanEmail,
      phone: cleanPhone,
      address: (body.address || 'Campus Residence').trim(),
      course: body.course.trim(),
      admissionDate: body.admissionDate || nowIso.slice(0, 10),
      academicYear: (body.academicYear || '2026-2027').trim(),
      semester: Number(body.semester) || 1,
      section: (body.section || 'A').trim().toUpperCase(),
      photoUrl: body.photoUrl || '',
      isDeleted: false,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    db.students.unshift(record);
    appendActivity(
      'Student Added',
      req.user!.fullName,
      'ADMIN',
      `Added student ${record.fullName} (${record.studentId})`
    );
    await saveDb();
    res.status(201).json({ student: record });
  })
);

router.put(
  '/students/:studentId',
  authenticateToken,
  requireRole('ADMIN'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const originalId = req.params.studentId.toUpperCase();
    const db = getDb();
    const index = db.students.findIndex(
      (s) => s.studentId.toUpperCase() === originalId
    );
    if (index === -1) {
      res.status(404).json({ error: 'Student record not found.' });
      return;
    }

    const body = req.body as Partial<StudentRecord>;
    const nextId = (body.studentId || originalId).trim().toUpperCase();
    if (
      nextId !== originalId &&
      db.students.some((s) => s.studentId.toUpperCase() === nextId)
    ) {
      res.status(409).json({ error: `Student ID "${nextId}" already exists.` });
      return;
    }

    const nextEmail = (body.email || db.students[index].email)
      .trim()
      .toLowerCase();
    const nextPhone = (body.phone || db.students[index].phone).trim();
    if (!isValidEmail(nextEmail) || !isValidPhone(nextPhone)) {
      res.status(400).json({ error: 'Invalid email or phone number.' });
      return;
    }

    const updated: StudentRecord = {
      ...db.students[index],
      ...body,
      studentId: nextId,
      email: nextEmail,
      phone: nextPhone,
      age: body.age ? Number(body.age) : db.students[index].age,
      semester: body.semester
        ? Number(body.semester)
        : db.students[index].semester,
      section: body.section
        ? body.section.trim().toUpperCase()
        : db.students[index].section,
      updatedAt: new Date().toISOString(),
    };

    db.students[index] = updated;
    appendActivity(
      'Student Updated',
      req.user!.fullName,
      'ADMIN',
      `Updated profile for ${updated.fullName} (${updated.studentId})`
    );
    await saveDb();
    res.json({ student: updated });
  })
);

router.delete(
  '/students/:studentId',
  authenticateToken,
  requireRole('ADMIN'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const targetId = req.params.studentId.toUpperCase();
    const permanent = req.query.permanent === 'true';
    const db = getDb();
    const index = db.students.findIndex(
      (s) => s.studentId.toUpperCase() === targetId
    );
    if (index === -1) {
      res.status(404).json({ error: 'Student record not found.' });
      return;
    }

    const target = db.students[index];
    if (permanent) {
      db.students.splice(index, 1);
      appendActivity(
        'Student Permanently Deleted',
        req.user!.fullName,
        'ADMIN',
        `Permanently purged ${target.fullName} (${target.studentId})`
      );
    } else {
      db.students[index] = {
        ...target,
        isDeleted: true,
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      appendActivity(
        'Student Archived',
        req.user!.fullName,
        'ADMIN',
        `Moved ${target.fullName} (${target.studentId}) to deleted archive`
      );
    }

    await saveDb();
    res.json({ message: permanent ? 'Student permanently deleted.' : 'Student moved to trash.' });
  })
);

router.post(
  '/students/:studentId/restore',
  authenticateToken,
  requireRole('ADMIN'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const targetId = req.params.studentId.toUpperCase();
    const db = getDb();
    const index = db.students.findIndex(
      (s) => s.studentId.toUpperCase() === targetId
    );
    if (index === -1) {
      res.status(404).json({ error: 'Student record not found.' });
      return;
    }

    db.students[index] = {
      ...db.students[index],
      isDeleted: false,
      deletedAt: undefined,
      updatedAt: new Date().toISOString(),
    };
    appendActivity(
      'Student Restored',
      req.user!.fullName,
      'ADMIN',
      `Restored ${db.students[index].fullName} (${targetId})`
    );
    await saveDb();
    res.json({ student: db.students[index] });
  })
);

// 3. Courses Management
router.get('/courses', authenticateToken, (_req, res) => {
  const db = getDb();
  const enriched = db.courses.map((course) => {
    const enrolledStudents = db.students.filter(
      (s) => !s.isDeleted && s.course === course.courseName
    ).length;
    const registeredSeats = db.registrations.filter(
      (r) =>
        r.courseCode === course.courseCode &&
        (r.status === 'Approved' || r.status === 'Pending')
    ).length;
    return {
      ...course,
      enrolledStudents,
      registeredSeats,
      availableSeats: Math.max(0, course.maxCapacity - registeredSeats),
    };
  });
  res.json({ courses: enriched });
});

router.post(
  '/courses',
  authenticateToken,
  requireRole('ADMIN'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const body = req.body as Partial<CourseRecord>;
    const code = (body.courseCode || '').trim().toUpperCase();
    const name = (body.courseName || '').trim();
    if (!code || !name) {
      res.status(400).json({ error: 'Course code and course name are required.' });
      return;
    }

    const db = getDb();
    if (db.courses.some((c) => c.courseCode.toUpperCase() === code)) {
      res.status(409).json({ error: `Course code "${code}" already exists.` });
      return;
    }

    const nowIso = new Date().toISOString();
    const course: CourseRecord = {
      courseCode: code,
      courseName: name,
      description: (body.description || 'Academic degree curriculum.').trim(),
      duration: (body.duration || '4 Years').trim(),
      semesters: Number(body.semesters) || 8,
      credits: Number(body.credits) || 120,
      semester: Number(body.semester) || 1,
      faculty: (body.faculty || 'Faculty TBA').trim(),
      registrationDeadline: body.registrationDeadline || '2026-12-30',
      maxCapacity: Number(body.maxCapacity) || 50,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    db.courses.push(course);
    appendActivity(
      'Course Added',
      req.user!.fullName,
      'ADMIN',
      `Added course ${course.courseCode} — ${course.courseName}`
    );
    await saveDb();
    res.status(201).json({ course });
  })
);

router.put(
  '/courses/:courseCode',
  authenticateToken,
  requireRole('ADMIN'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const targetCode = req.params.courseCode.toUpperCase();
    const db = getDb();
    const idx = db.courses.findIndex(
      (c) => c.courseCode.toUpperCase() === targetCode
    );
    if (idx === -1) {
      res.status(404).json({ error: 'Course not found.' });
      return;
    }

    const body = req.body as Partial<CourseRecord>;
    db.courses[idx] = {
      ...db.courses[idx],
      ...body,
      courseCode: targetCode,
      semesters: body.semesters ? Number(body.semesters) : db.courses[idx].semesters,
      credits: body.credits ? Number(body.credits) : db.courses[idx].credits,
      semester: body.semester ? Number(body.semester) : db.courses[idx].semester,
      maxCapacity: body.maxCapacity
        ? Number(body.maxCapacity)
        : db.courses[idx].maxCapacity,
      updatedAt: new Date().toISOString(),
    };
    appendActivity(
      'Course Updated',
      req.user!.fullName,
      'ADMIN',
      `Updated course ${targetCode}`
    );
    await saveDb();
    res.json({ course: db.courses[idx] });
  })
);

router.delete(
  '/courses/:courseCode',
  authenticateToken,
  requireRole('ADMIN'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const targetCode = req.params.courseCode.toUpperCase();
    const db = getDb();
    const before = db.courses.length;
    db.courses = db.courses.filter(
      (c) => c.courseCode.toUpperCase() !== targetCode
    );
    if (db.courses.length === before) {
      res.status(404).json({ error: 'Course not found.' });
      return;
    }
    appendActivity(
      'Course Deleted',
      req.user!.fullName,
      'ADMIN',
      `Removed course ${targetCode}`
    );
    await saveDb();
    res.json({ message: 'Course deleted.' });
  })
);

// 4. Classrooms Management
router.get('/classrooms', authenticateToken, (_req, res) => {
  const db = getDb();
  const enriched = db.classrooms.map((room) => {
    const scheduledClasses = db.timetable.filter(
      (t) => t.classroomNumber === room.roomNumber
    ).length;
    const scheduledExams = db.examinations.filter(
      (e) => e.classroomNumber === room.roomNumber
    ).length;
    return {
      ...room,
      scheduledClasses,
      scheduledExams,
    };
  });
  res.json({ classrooms: enriched });
});

router.post(
  '/classrooms',
  authenticateToken,
  requireRole('ADMIN'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const body = req.body as Partial<ClassroomRecord>;
    const classroomId = (body.classroomId || '').trim().toUpperCase();
    const roomNumber = (body.roomNumber || '').trim().toUpperCase();
    const buildingName = (body.buildingName || '').trim();

    if (!classroomId || !roomNumber || !buildingName) {
      res
        .status(400)
        .json({ error: 'Classroom ID, room number, and building name are required.' });
      return;
    }

    const db = getDb();
    if (
      db.classrooms.some(
        (r) =>
          r.classroomId.toUpperCase() === classroomId ||
          r.roomNumber.toUpperCase() === roomNumber
      )
    ) {
      res.status(409).json({
        error: 'Classroom ID or Room Number already exists.',
      });
      return;
    }

    if (
      body.assignedCourseSection &&
      db.classrooms.some(
        (r) =>
          r.assignedCourseSection &&
          r.assignedCourseSection.toLowerCase() ===
            body.assignedCourseSection?.trim().toLowerCase()
      )
    ) {
      res.status(409).json({
        error: `Course/section "${body.assignedCourseSection}" is already assigned to another room.`,
      });
      return;
    }

    const nowIso = new Date().toISOString();
    const room: ClassroomRecord = {
      classroomId,
      roomNumber,
      buildingName,
      floor: (body.floor || '1st Floor').trim(),
      capacity: Number(body.capacity) || 40,
      classroomType: body.classroomType || 'Lecture Hall',
      facilities: Array.isArray(body.facilities) ? body.facilities : [],
      assignedCourseSection: (body.assignedCourseSection || '').trim(),
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    db.classrooms.push(room);
    appendActivity(
      'Classroom Added',
      req.user!.fullName,
      'ADMIN',
      `Added classroom ${room.roomNumber} (${room.buildingName})`
    );
    await saveDb();
    res.status(201).json({ classroom: room });
  })
);

router.put(
  '/classrooms/:classroomId',
  authenticateToken,
  requireRole('ADMIN'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const targetId = req.params.classroomId.toUpperCase();
    const db = getDb();
    const idx = db.classrooms.findIndex(
      (r) => r.classroomId.toUpperCase() === targetId
    );
    if (idx === -1) {
      res.status(404).json({ error: 'Classroom not found.' });
      return;
    }

    const body = req.body as Partial<ClassroomRecord>;
    db.classrooms[idx] = {
      ...db.classrooms[idx],
      ...body,
      classroomId: targetId,
      capacity: body.capacity ? Number(body.capacity) : db.classrooms[idx].capacity,
      updatedAt: new Date().toISOString(),
    };
    appendActivity(
      'Classroom Updated',
      req.user!.fullName,
      'ADMIN',
      `Updated classroom ${db.classrooms[idx].roomNumber}`
    );
    await saveDb();
    res.json({ classroom: db.classrooms[idx] });
  })
);

router.delete(
  '/classrooms/:classroomId',
  authenticateToken,
  requireRole('ADMIN'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const targetId = req.params.classroomId.toUpperCase();
    const db = getDb();
    const before = db.classrooms.length;
    db.classrooms = db.classrooms.filter(
      (r) => r.classroomId.toUpperCase() !== targetId
    );
    if (db.classrooms.length === before) {
      res.status(404).json({ error: 'Classroom not found.' });
      return;
    }
    appendActivity(
      'Classroom Deleted',
      req.user!.fullName,
      'ADMIN',
      `Deleted classroom ${targetId}`
    );
    await saveDb();
    res.json({ message: 'Classroom deleted.' });
  })
);

// 5. Attendance Management
router.get('/attendance', authenticateToken, (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const user = req.user!;
  const activeStudents = db.students.filter((s) => !s.isDeleted);

  let records = db.attendance;
  if (user.role === 'STUDENT') {
    records = records.filter((a) => a.studentId === user.studentId);
  } else {
    const { course, date, studentId } = req.query as {
      course?: string;
      date?: string;
      studentId?: string;
    };
    if (course && course !== 'all') {
      records = records.filter((a) => a.course === course);
    }
    if (date) {
      records = records.filter((a) => a.date === date);
    }
    if (studentId) {
      records = records.filter(
        (a) => a.studentId.toUpperCase() === studentId.toUpperCase()
      );
    }
  }

  // Student-wise summary
  const summarySource =
    user.role === 'STUDENT'
      ? activeStudents.filter((s) => s.studentId === user.studentId)
      : activeStudents;

  const studentSummaries = summarySource.map((stu) => {
    const stuAtt = db.attendance.filter((a) => a.studentId === stu.studentId);
    const present = stuAtt.filter((a) => a.status === 'Present').length;
    const late = stuAtt.filter((a) => a.status === 'Late').length;
    const absent = stuAtt.filter((a) => a.status === 'Absent').length;
    const total = stuAtt.length;
    const percentage =
      total > 0 ? Number((((present + late) / total) * 100).toFixed(1)) : 100;
    return {
      studentId: stu.studentId,
      fullName: stu.fullName,
      course: stu.course,
      section: stu.section,
      present,
      late,
      absent,
      total,
      percentage,
      lowAttendanceWarning: total > 0 && percentage < 75,
    };
  });

  res.json({
    records: [...records].sort((a, b) => b.date.localeCompare(a.date)),
    summaries: studentSummaries,
  });
});

router.post(
  '/attendance/mark',
  authenticateToken,
  requireRole('ADMIN'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { date, course, entries } = req.body as {
      date?: string;
      course?: string;
      entries?: Array<{ studentId: string; status: AttendanceStatus }>;
    };

    if (!date || !course || !Array.isArray(entries) || entries.length === 0) {
      res
        .status(400)
        .json({ error: 'Date, course, and attendance entries are required.' });
      return;
    }

    const db = getDb();
    const nowIso = new Date().toISOString();

    for (const item of entries) {
      const existingIdx = db.attendance.findIndex(
        (a) =>
          a.studentId === item.studentId &&
          a.date === date &&
          a.course === course
      );
      if (existingIdx !== -1) {
        db.attendance[existingIdx].status = item.status;
        db.attendance[existingIdx].markedBy = req.user!.userId;
      } else {
        db.attendance.push({
          id: `ATT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          studentId: item.studentId,
          date,
          course,
          status: item.status,
          markedBy: req.user!.userId,
          createdAt: nowIso,
        });
      }

      // Check low attendance threshold (<75%)
      const stuAtt = db.attendance.filter(
        (a) => a.studentId === item.studentId
      );
      const attended = stuAtt.filter(
        (a) => a.status === 'Present' || a.status === 'Late'
      ).length;
      const pct = stuAtt.length > 0 ? (attended / stuAtt.length) * 100 : 100;
      if (stuAtt.length >= 3 && pct < 75) {
        const student = db.students.find((s) => s.studentId === item.studentId);
        db.notifications.unshift({
          id: `NOTIF-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          title: `Low Attendance Alert — ${item.studentId}`,
          message: `${student?.fullName || item.studentId} attendance dropped to ${pct.toFixed(1)}% in ${course}.`,
          category: 'Attendance',
          targetRole: 'ALL',
          targetStudentId: item.studentId,
          readBy: [],
          createdAt: nowIso,
        });
      }
    }

    appendActivity(
      'Attendance Marked',
      req.user!.fullName,
      'ADMIN',
      `Marked ${entries.length} attendance entries for ${course} on ${date}`
    );
    await saveDb();
    res.json({ message: 'Attendance saved successfully.' });
  })
);

export default router;
