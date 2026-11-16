import { Router } from 'express';
import { appendActivity, getDb, saveDb } from '../db';
import {
  AuthenticatedRequest,
  authenticateToken,
  requireRole,
} from '../middleware/auth';
import {
  computeExamResultMetrics,
  getDayNameFromDate,
  timesOverlap,
} from '../utils/helpers';
import {
  ExaminationRecord,
  NotificationCategory,
  TimetableEntry,
} from '../../src/types/campus';

const router = Router();

// 1. Timetable Management (Conflict-Safe)
router.get('/timetable', authenticateToken, (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const user = req.user!;
  if (user.role === 'STUDENT') {
    const stu = db.students.find(
      (s) => s.studentId === user.studentId && !s.isDeleted
    );
    if (!stu) {
      res.json({ entries: [] });
      return;
    }
    const entries = db.timetable.filter(
      (t) => t.course === stu.course && t.section === stu.section
    );
    res.json({ entries });
    return;
  }

  const { course, section } = req.query as {
    course?: string;
    section?: string;
  };
  let entries = db.timetable;
  if (course && course !== 'all') {
    entries = entries.filter((t) => t.course === course);
  }
  if (section && section !== 'all') {
    entries = entries.filter((t) => t.section === section);
  }
  res.json({ entries });
});

router.post(
  '/timetable',
  authenticateToken,
  requireRole('ADMIN'),
  async (req: AuthenticatedRequest, res) => {
    const body = req.body as Partial<TimetableEntry>;
    if (
      !body.day ||
      !body.periodNumber ||
      !body.subjectName ||
      !body.facultyName ||
      !body.startTime ||
      !body.endTime ||
      !body.classroomNumber ||
      !body.course ||
      !body.section
    ) {
      res.status(400).json({ error: 'All timetable entry fields are required.' });
      return;
    }

    if (body.startTime >= body.endTime) {
      res.status(400).json({ error: 'End time must be after start time.' });
      return;
    }

    const db = getDb();

    // Prevent overlapping classroom schedules
    const roomConflict = db.timetable.find(
      (t) =>
        t.day === body.day &&
        t.classroomNumber.toUpperCase() ===
          body.classroomNumber!.trim().toUpperCase() &&
        timesOverlap(t.startTime, t.endTime, body.startTime!, body.endTime!)
    );
    if (roomConflict) {
      res.status(409).json({
        error: `Classroom ${roomConflict.classroomNumber} is already booked on ${roomConflict.day} (${roomConflict.startTime}–${roomConflict.endTime}) for ${roomConflict.subjectName}.`,
      });
      return;
    }

    // Prevent overlapping faculty schedules
    const facultyConflict = db.timetable.find(
      (t) =>
        t.day === body.day &&
        t.facultyName.toLowerCase() === body.facultyName!.trim().toLowerCase() &&
        timesOverlap(t.startTime, t.endTime, body.startTime!, body.endTime!)
    );
    if (facultyConflict) {
      res.status(409).json({
        error: `Faculty ${facultyConflict.facultyName} is already teaching ${facultyConflict.subjectName} on ${facultyConflict.day} (${facultyConflict.startTime}–${facultyConflict.endTime}).`,
      });
      return;
    }

    const roomRecord = db.classrooms.find(
      (r) => r.roomNumber.toUpperCase() === body.classroomNumber!.trim().toUpperCase()
    );

    const entry: TimetableEntry = {
      id: `TT-${Date.now()}`,
      day: body.day,
      periodNumber: Number(body.periodNumber),
      subjectName: body.subjectName.trim(),
      facultyName: body.facultyName.trim(),
      startTime: body.startTime,
      endTime: body.endTime,
      classroomNumber: body.classroomNumber.trim().toUpperCase(),
      buildingName: (
        body.buildingName ||
        roomRecord?.buildingName ||
        'Main Academic Block'
      ).trim(),
      course: body.course.trim(),
      section: body.section.trim().toUpperCase(),
      createdAt: new Date().toISOString(),
    };

    db.timetable.push(entry);
    db.notifications.unshift({
      id: `NOTIF-${Date.now()}`,
      title: 'Timetable Updated',
      message: `${entry.subjectName} scheduled on ${entry.day} (${entry.startTime}–${entry.endTime}) in ${entry.classroomNumber} for ${entry.course} Sec ${entry.section}.`,
      category: 'Timetable',
      targetRole: 'ALL',
      readBy: [],
      createdAt: new Date().toISOString(),
    });
    appendActivity(
      'Timetable Entry Added',
      req.user!.fullName,
      'ADMIN',
      `Scheduled ${entry.subjectName} (${entry.day} ${entry.startTime})`
    );
    await saveDb();
    res.status(201).json({ entry });
  }
);

router.put(
  '/timetable/:id',
  authenticateToken,
  requireRole('ADMIN'),
  async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const db = getDb();
    const idx = db.timetable.findIndex((t) => t.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Timetable entry not found.' });
      return;
    }

    const body = req.body as Partial<TimetableEntry>;
    const next: TimetableEntry = {
      ...db.timetable[idx],
      ...body,
      periodNumber: body.periodNumber
        ? Number(body.periodNumber)
        : db.timetable[idx].periodNumber,
      classroomNumber: (
        body.classroomNumber || db.timetable[idx].classroomNumber
      )
        .trim()
        .toUpperCase(),
    };

    if (next.startTime >= next.endTime) {
      res.status(400).json({ error: 'End time must be after start time.' });
      return;
    }

    const roomConflict = db.timetable.find(
      (t) =>
        t.id !== id &&
        t.day === next.day &&
        t.classroomNumber === next.classroomNumber &&
        timesOverlap(t.startTime, t.endTime, next.startTime, next.endTime)
    );
    if (roomConflict) {
      res.status(409).json({
        error: `Classroom ${next.classroomNumber} overlaps with ${roomConflict.subjectName} on ${next.day}.`,
      });
      return;
    }

    const facultyConflict = db.timetable.find(
      (t) =>
        t.id !== id &&
        t.day === next.day &&
        t.facultyName.toLowerCase() === next.facultyName.toLowerCase() &&
        timesOverlap(t.startTime, t.endTime, next.startTime, next.endTime)
    );
    if (facultyConflict) {
      res.status(409).json({
        error: `Faculty ${next.facultyName} overlaps with ${facultyConflict.subjectName} on ${next.day}.`,
      });
      return;
    }

    db.timetable[idx] = next;
    appendActivity(
      'Timetable Updated',
      req.user!.fullName,
      'ADMIN',
      `Updated ${next.subjectName} (${next.day} ${next.startTime})`
    );
    await saveDb();
    res.json({ entry: next });
  }
);

router.delete(
  '/timetable/:id',
  authenticateToken,
  requireRole('ADMIN'),
  async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const db = getDb();
    const before = db.timetable.length;
    db.timetable = db.timetable.filter((t) => t.id !== id);
    if (db.timetable.length === before) {
      res.status(404).json({ error: 'Timetable entry not found.' });
      return;
    }
    appendActivity(
      'Timetable Entry Deleted',
      req.user!.fullName,
      'ADMIN',
      `Removed timetable slot ${id}`
    );
    await saveDb();
    res.json({ message: 'Timetable entry deleted.' });
  }
);

// 2. Course Registrations
router.get('/registrations', authenticateToken, (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const list =
    req.user!.role === 'STUDENT'
      ? db.registrations.filter((r) => r.studentId === req.user!.studentId)
      : db.registrations;
  res.json({
    registrations: [...list].sort((a, b) =>
      b.registeredAt.localeCompare(a.registeredAt)
    ),
  });
});

router.post(
  '/registrations',
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    const { courseCode, studentId: bodyStudentId } = req.body as {
      courseCode?: string;
      studentId?: string;
    };

    const targetStudentId =
      req.user!.role === 'STUDENT'
        ? req.user!.studentId
        : bodyStudentId?.trim().toUpperCase();

    if (!targetStudentId || !courseCode) {
      res
        .status(400)
        .json({ error: 'Student ID and Course Code are required.' });
      return;
    }

    const db = getDb();
    const student = db.students.find(
      (s) => s.studentId === targetStudentId && !s.isDeleted
    );
    if (!student) {
      res.status(404).json({ error: 'Active student record not found.' });
      return;
    }

    const course = db.courses.find(
      (c) => c.courseCode.toUpperCase() === courseCode.trim().toUpperCase()
    );
    if (!course) {
      res.status(404).json({ error: 'Selected course does not exist.' });
      return;
    }

    const todayIso = new Date().toISOString().slice(0, 10);
    if (course.registrationDeadline < todayIso) {
      res.status(400).json({
        error: `Registration deadline (${course.registrationDeadline}) for ${course.courseName} has passed.`,
      });
      return;
    }

    const activeRegsForCourse = db.registrations.filter(
      (r) =>
        r.courseCode === course.courseCode &&
        (r.status === 'Approved' || r.status === 'Pending')
    );
    if (activeRegsForCourse.length >= course.maxCapacity) {
      res.status(409).json({
        error: `No available seats remaining in ${course.courseName}.`,
      });
      return;
    }

    const duplicate = db.registrations.find(
      (r) =>
        r.studentId === student.studentId &&
        r.courseCode === course.courseCode &&
        r.status !== 'Cancelled' &&
        r.status !== 'Rejected'
    );
    if (duplicate) {
      res.status(409).json({
        error: `Already registered for ${course.courseName} (Status: ${duplicate.status}).`,
      });
      return;
    }

    const nowIso = new Date().toISOString();
    const registration = {
      id: `REG-${Date.now()}`,
      studentId: student.studentId,
      studentName: student.fullName,
      courseCode: course.courseCode,
      courseName: course.courseName,
      semester: course.semester,
      credits: course.credits,
      status: req.user!.role === 'ADMIN' ? ('Approved' as const) : ('Pending' as const),
      registeredAt: nowIso,
      updatedAt: nowIso,
    };

    db.registrations.unshift(registration);
    appendActivity(
      'Course Registration',
      req.user!.fullName,
      req.user!.role,
      `${student.fullName} registered for ${course.courseCode}`
    );
    await saveDb();
    res.status(201).json({ registration });
  }
);

router.put(
  '/registrations/:id/status',
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const { status } = req.body as {
      status?: 'Approved' | 'Rejected' | 'Cancelled';
    };

    if (!status || !['Approved', 'Rejected', 'Cancelled'].includes(status)) {
      res.status(400).json({ error: 'Invalid registration status.' });
      return;
    }

    const db = getDb();
    const reg = db.registrations.find((r) => r.id === id);
    if (!reg) {
      res.status(404).json({ error: 'Registration record not found.' });
      return;
    }

    if (req.user!.role === 'STUDENT') {
      if (reg.studentId !== req.user!.studentId || status !== 'Cancelled') {
        res.status(403).json({
          error: 'Students can only cancel their own course registrations.',
        });
        return;
      }
    }

    reg.status = status;
    reg.updatedAt = new Date().toISOString();
    db.notifications.unshift({
      id: `NOTIF-${Date.now()}`,
      title: `Course Registration ${status}`,
      message: `${reg.courseName} (${reg.courseCode}) registration for ${reg.studentName} is now ${status}.`,
      category: 'Registration',
      targetRole: 'STUDENT',
      targetStudentId: reg.studentId,
      readBy: [],
      createdAt: new Date().toISOString(),
    });
    appendActivity(
      `Registration ${status}`,
      req.user!.fullName,
      req.user!.role,
      `${reg.studentName} — ${reg.courseCode} marked ${status}`
    );
    await saveDb();
    res.json({ registration: reg });
  }
);

// 3. Examinations Management (Classroom + Timetable conflict checking)
router.get('/examinations', authenticateToken, (req: AuthenticatedRequest, res) => {
  const db = getDb();
  let exams = db.examinations;
  if (req.user!.role === 'STUDENT') {
    const stu = db.students.find(
      (s) => s.studentId === req.user!.studentId && !s.isDeleted
    );
    if (stu) {
      exams = exams.filter((e) => e.course === stu.course);
    }
  }
  res.json({
    examinations: [...exams].sort((a, b) =>
      a.examDate.localeCompare(b.examDate)
    ),
  });
});

router.post(
  '/examinations',
  authenticateToken,
  requireRole('ADMIN'),
  async (req: AuthenticatedRequest, res) => {
    const body = req.body as Partial<ExaminationRecord>;
    if (
      !body.examName ||
      !body.subject ||
      !body.course ||
      !body.examDate ||
      !body.startTime ||
      !body.endTime ||
      !body.classroomNumber
    ) {
      res.status(400).json({ error: 'All examination fields are required.' });
      return;
    }

    if (body.startTime >= body.endTime) {
      res.status(400).json({ error: 'End time must be after start time.' });
      return;
    }

    const db = getDb();
    const room = body.classroomNumber.trim().toUpperCase();

    // Check overlapping examination in same room on same date
    const examRoomConflict = db.examinations.find(
      (e) =>
        e.examDate === body.examDate &&
        e.classroomNumber.toUpperCase() === room &&
        timesOverlap(e.startTime, e.endTime, body.startTime!, body.endTime!)
    );
    if (examRoomConflict) {
      res.status(409).json({
        error: `Classroom ${room} already hosts "${examRoomConflict.subject}" exam on ${examRoomConflict.examDate} (${examRoomConflict.startTime}–${examRoomConflict.endTime}).`,
      });
      return;
    }

    // Check timetable conflict on that weekday in that classroom
    const weekday = getDayNameFromDate(body.examDate);
    const timetableConflict = db.timetable.find(
      (t) =>
        t.day === weekday &&
        t.classroomNumber.toUpperCase() === room &&
        timesOverlap(t.startTime, t.endTime, body.startTime!, body.endTime!)
    );
    if (timetableConflict) {
      res.status(409).json({
        error: `Room ${room} has a regular timetable class (${timetableConflict.subjectName}) on ${weekday} (${timetableConflict.startTime}–${timetableConflict.endTime}). Choose another room or slot.`,
      });
      return;
    }

    const exam: ExaminationRecord = {
      id: `EXM-${Date.now()}`,
      examName: body.examName.trim(),
      examType: body.examType || 'Final',
      subject: body.subject.trim(),
      course: body.course.trim(),
      semester: Number(body.semester) || 1,
      examDate: body.examDate,
      startTime: body.startTime,
      endTime: body.endTime,
      classroomNumber: room,
      maxMarks: Number(body.maxMarks) || 100,
      createdAt: new Date().toISOString(),
    };

    db.examinations.push(exam);
    db.notifications.unshift({
      id: `NOTIF-${Date.now()}`,
      title: `Exam Scheduled: ${exam.subject}`,
      message: `${exam.examName} for ${exam.course} on ${exam.examDate} (${exam.startTime}–${exam.endTime}) in Room ${exam.classroomNumber}.`,
      category: 'Examination',
      targetRole: 'ALL',
      readBy: [],
      createdAt: new Date().toISOString(),
    });
    appendActivity(
      'Examination Scheduled',
      req.user!.fullName,
      'ADMIN',
      `Scheduled ${exam.subject} (${exam.examDate} in ${exam.classroomNumber})`
    );
    await saveDb();
    res.status(201).json({ examination: exam });
  }
);

router.delete(
  '/examinations/:id',
  authenticateToken,
  requireRole('ADMIN'),
  async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const db = getDb();
    const before = db.examinations.length;
    db.examinations = db.examinations.filter((e) => e.id !== id);
    if (db.examinations.length === before) {
      res.status(404).json({ error: 'Examination not found.' });
      return;
    }
    appendActivity(
      'Examination Removed',
      req.user!.fullName,
      'ADMIN',
      `Cancelled examination ${id}`
    );
    await saveDb();
    res.json({ message: 'Examination removed.' });
  }
);

// 4. Exam Results (Strict unpublished protection for students)
router.get('/results', authenticateToken, (req: AuthenticatedRequest, res) => {
  const db = getDb();
  if (req.user!.role === 'STUDENT') {
    const publishedOwn = db.results.filter(
      (r) => r.studentId === req.user!.studentId && r.published === true
    );
    res.json({ results: publishedOwn });
    return;
  }
  res.json({
    results: [...db.results].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    ),
  });
});

router.post(
  '/results',
  authenticateToken,
  requireRole('ADMIN'),
  async (req: AuthenticatedRequest, res) => {
    const { studentId, semester, examName, subjects, published } = req.body as {
      studentId?: string;
      semester?: number;
      examName?: string;
      subjects?: Array<{
        subjectName: string;
        internalMarks: number;
        externalMarks: number;
        maxMarks: number;
        credits: number;
      }>;
      published?: boolean;
    };

    if (
      !studentId ||
      !examName ||
      !Array.isArray(subjects) ||
      subjects.length === 0
    ) {
      res
        .status(400)
        .json({ error: 'Student, exam name, and subject marks are required.' });
      return;
    }

    const db = getDb();
    const student = db.students.find(
      (s) => s.studentId === studentId.trim().toUpperCase() && !s.isDeleted
    );
    if (!student) {
      res.status(404).json({ error: 'Active student not found.' });
      return;
    }

    const priorResults = db.results.filter(
      (r) => r.studentId === student.studentId
    );
    const prevCgpa =
      priorResults.length > 0
        ? priorResults[priorResults.length - 1].cgpa
        : undefined;

    const computed = computeExamResultMetrics(subjects, prevCgpa);
    const nowIso = new Date().toISOString();
    const isPublished = Boolean(published);

    const resultRecord = {
      id: `RES-${Date.now()}`,
      studentId: student.studentId,
      studentName: student.fullName,
      course: student.course,
      semester: Number(semester) || student.semester,
      examName: examName.trim(),
      ...computed,
      published: isPublished,
      publishedAt: isPublished ? nowIso : undefined,
      createdAt: nowIso,
    };

    db.results.unshift(resultRecord);
    if (isPublished) {
      db.notifications.unshift({
        id: `NOTIF-${Date.now()}`,
        title: `Result Published — ${resultRecord.examName}`,
        message: `Semester ${resultRecord.semester} marksheet for ${student.fullName} (${resultRecord.percentage}% · Grade ${resultRecord.grade}) is now published.`,
        category: 'Result',
        targetRole: 'STUDENT',
        targetStudentId: student.studentId,
        readBy: [],
        createdAt: nowIso,
      });
    }

    appendActivity(
      'Exam Result Recorded',
      req.user!.fullName,
      'ADMIN',
      `Recorded Sem ${resultRecord.semester} result for ${student.fullName} (${resultRecord.grade})`
    );
    await saveDb();
    res.status(201).json({ result: resultRecord });
  }
);

router.put(
  '/results/:id/publish',
  authenticateToken,
  requireRole('ADMIN'),
  async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const { published } = req.body as { published?: boolean };
    const db = getDb();
    const result = db.results.find((r) => r.id === id);
    if (!result) {
      res.status(404).json({ error: 'Result record not found.' });
      return;
    }

    result.published = Boolean(published);
    result.publishedAt = result.published ? new Date().toISOString() : undefined;

    if (result.published) {
      db.notifications.unshift({
        id: `NOTIF-${Date.now()}`,
        title: `Result Published — ${result.examName}`,
        message: `Your Semester ${result.semester} result (${result.percentage}% · SGPA ${result.sgpa}) is now available.`,
        category: 'Result',
        targetRole: 'STUDENT',
        targetStudentId: result.studentId,
        readBy: [],
        createdAt: new Date().toISOString(),
      });
    }

    appendActivity(
      result.published ? 'Result Published' : 'Result Unpublished',
      req.user!.fullName,
      'ADMIN',
      `${result.studentName} (${result.examName})`
    );
    await saveDb();
    res.json({ result });
  }
);

router.delete(
  '/results/:id',
  authenticateToken,
  requireRole('ADMIN'),
  async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const db = getDb();
    const before = db.results.length;
    db.results = db.results.filter((r) => r.id !== id);
    if (db.results.length === before) {
      res.status(404).json({ error: 'Result record not found.' });
      return;
    }
    await saveDb();
    res.json({ message: 'Result deleted.' });
  }
);

// 5. Notifications
router.get('/notifications', authenticateToken, (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const user = req.user!;
  const relevant = db.notifications
    .filter((n) => {
      if (user.role === 'ADMIN') {
        return n.targetRole === 'ALL' || n.targetRole === 'ADMIN';
      }
      return (
        (n.targetRole === 'ALL' || n.targetRole === 'STUDENT') &&
        (!n.targetStudentId || n.targetStudentId === user.studentId)
      );
    })
    .map((n) => ({
      ...n,
      isRead: n.readBy.includes(user.userId),
    }));

  res.json({ notifications: relevant });
});

router.post(
  '/notifications',
  authenticateToken,
  requireRole('ADMIN'),
  async (req: AuthenticatedRequest, res) => {
    const { title, message, category, targetRole } = req.body as {
      title?: string;
      message?: string;
      category?: NotificationCategory;
      targetRole?: 'ALL' | 'ADMIN' | 'STUDENT';
    };

    if (!title || !message) {
      res.status(400).json({ error: 'Title and message are required.' });
      return;
    }

    const db = getDb();
    const notification = {
      id: `NOTIF-${Date.now()}`,
      title: title.trim(),
      message: message.trim(),
      category: category || 'Announcement',
      targetRole: targetRole || 'ALL',
      readBy: [],
      createdAt: new Date().toISOString(),
    };
    db.notifications.unshift(notification);
    appendActivity(
      'Notification Published',
      req.user!.fullName,
      'ADMIN',
      `Broadcast "${notification.title}"`
    );
    await saveDb();
    res.status(201).json({ notification: { ...notification, isRead: false } });
  }
);

router.put(
  '/notifications/read-all',
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    const db = getDb();
    const userId = req.user!.userId;
    for (const n of db.notifications) {
      if (!n.readBy.includes(userId)) {
        n.readBy.push(userId);
      }
    }
    await saveDb();
    res.json({ message: 'All notifications marked as read.' });
  }
);

router.put(
  '/notifications/:id/read',
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const db = getDb();
    const notif = db.notifications.find((n) => n.id === id);
    if (!notif) {
      res.status(404).json({ error: 'Notification not found.' });
      return;
    }
    if (!notif.readBy.includes(req.user!.userId)) {
      notif.readBy.push(req.user!.userId);
    }
    await saveDb();
    res.json({ message: 'Marked as read.' });
  }
);

// 6. Reports Aggregation
router.get(
  '/reports/:type',
  authenticateToken,
  requireRole('ADMIN'),
  (req, res) => {
    const { type } = req.params;
    const db = getDb();

    switch (type) {
      case 'students':
        res.json({
          title: 'Student Directory Report',
          columns: [
            'Student ID',
            'Full Name',
            'Age',
            'Gender',
            'Course',
            'Semester',
            'Section',
            'Email',
            'Phone',
            'Admission Date',
          ],
          rows: db.students
            .filter((s) => !s.isDeleted)
            .map((s) => [
              s.studentId,
              s.fullName,
              s.age,
              s.gender,
              s.course,
              `Sem ${s.semester}`,
              s.section,
              s.email,
              s.phone,
              s.admissionDate,
            ]),
        });
        return;

      case 'attendance':
        res.json({
          title: 'Student Attendance Summary Report',
          columns: [
            'Student ID',
            'Full Name',
            'Course',
            'Present',
            'Late',
            'Absent',
            'Total Classes',
            'Percentage',
            'Status',
          ],
          rows: db.students
            .filter((s) => !s.isDeleted)
            .map((s) => {
              const att = db.attendance.filter(
                (a) => a.studentId === s.studentId
              );
              const present = att.filter((a) => a.status === 'Present').length;
              const late = att.filter((a) => a.status === 'Late').length;
              const absent = att.filter((a) => a.status === 'Absent').length;
              const total = att.length;
              const pct =
                total > 0
                  ? Number((((present + late) / total) * 100).toFixed(1))
                  : 100;
              return [
                s.studentId,
                s.fullName,
                s.course,
                present,
                late,
                absent,
                total,
                `${pct}%`,
                total > 0 && pct < 75 ? 'Low Attendance Warning' : 'Nominal',
              ];
            }),
        });
        return;

      case 'registrations':
        res.json({
          title: 'Course Registration Report',
          columns: [
            'Reg ID',
            'Student ID',
            'Student Name',
            'Course Code',
            'Course Name',
            'Semester',
            'Credits',
            'Status',
            'Registered Date',
          ],
          rows: db.registrations.map((r) => [
            r.id,
            r.studentId,
            r.studentName,
            r.courseCode,
            r.courseName,
            `Sem ${r.semester}`,
            r.credits,
            r.status,
            r.registeredAt.slice(0, 10),
          ]),
        });
        return;

      case 'examinations':
        res.json({
          title: 'Examination Schedule Report',
          columns: [
            'Exam ID',
            'Exam Name',
            'Type',
            'Subject',
            'Course',
            'Semester',
            'Date',
            'Time',
            'Room',
            'Max Marks',
          ],
          rows: db.examinations.map((e) => [
            e.id,
            e.examName,
            e.examType,
            e.subject,
            e.course,
            `Sem ${e.semester}`,
            e.examDate,
            `${e.startTime}-${e.endTime}`,
            e.classroomNumber,
            e.maxMarks,
          ]),
        });
        return;

      case 'results':
        res.json({
          title: 'Academic Results Report',
          columns: [
            'Result ID',
            'Student ID',
            'Student Name',
            'Course',
            'Semester',
            'Exam',
            'Marks',
            'Percentage',
            'Grade',
            'SGPA',
            'CGPA',
            'Result',
            'Published',
          ],
          rows: db.results.map((r) => [
            r.id,
            r.studentId,
            r.studentName,
            r.course,
            `Sem ${r.semester}`,
            r.examName,
            `${r.totalObtained}/${r.totalMax}`,
            `${r.percentage}%`,
            r.grade,
            r.sgpa,
            r.cgpa,
            r.status,
            r.published ? 'Published' : 'Draft',
          ]),
        });
        return;

      case 'classrooms':
        res.json({
          title: 'Classroom Utilization Report',
          columns: [
            'Classroom ID',
            'Room Number',
            'Building',
            'Floor',
            'Capacity',
            'Type',
            'Assigned Section',
            'Timetable Slots',
            'Scheduled Exams',
          ],
          rows: db.classrooms.map((c) => [
            c.classroomId,
            c.roomNumber,
            c.buildingName,
            c.floor,
            c.capacity,
            c.classroomType,
            c.assignedCourseSection || 'Unassigned',
            db.timetable.filter((t) => t.classroomNumber === c.roomNumber).length,
            db.examinations.filter((e) => e.classroomNumber === c.roomNumber).length,
          ]),
        });
        return;

      default:
        res.status(400).json({ error: 'Unsupported report type.' });
    }
  }
);

export default router;
