import { NextFunction, Response, Router } from 'express';
import bcrypt from 'bcryptjs';
import { appendActivity, getDb, saveDb } from '../db';
import {
  AuthenticatedRequest,
  authenticateToken,
  requireRole,
  signAuthToken,
} from '../middleware/auth';
import { isValidEmail, isValidPhone } from '../utils/helpers';
import { UserAccount } from '../../src/types/campus';

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

function sanitizeUser(user: UserAccount) {
  const { passwordHash: _removed, ...safe } = user;
  return safe;
}

router.post('/login', async (req, res) => {
  try {
    const { userId, password, rememberMe } = req.body as {
      userId?: string;
      password?: string;
      rememberMe?: boolean;
    };

    const trimmedId = (userId || '').trim().toUpperCase();
    const rawPassword = password || '';

    if (!trimmedId || !rawPassword) {
      res.status(400).json({ error: 'User ID and password are required.' });
      return;
    }

    const db = getDb();
    const user = db.users.find(
      (u) =>
        u.userId.toUpperCase() === trimmedId ||
        u.email.toUpperCase() === trimmedId
    );

    if (!user) {
      res.status(401).json({ error: 'Invalid User ID or password.' });
      return;
    }

    if (!user.approved) {
      res.status(403).json({
        error: 'This account is awaiting administrator approval.',
      });
      return;
    }

    const matches = await bcrypt.compare(rawPassword, user.passwordHash);
    if (!matches) {
      res.status(401).json({ error: 'Invalid User ID or password.' });
      return;
    }

    const sessionId = `SES-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;
    const ttlMs = rememberMe ? 7 * 24 * 60 * 60 * 1000 : 12 * 60 * 60 * 1000;
    const nowIso = new Date().toISOString();
    const expiresAt = new Date(Date.now() + ttlMs).toISOString();

    db.sessions.push({
      sessionId,
      userId: user.userId,
      role: user.role,
      userAgent: req.headers['user-agent'] || 'Web Client',
      createdAt: nowIso,
      expiresAt,
    });

    if (db.sessions.length > 100) {
      db.sessions = db.sessions.slice(-100);
    }

    await saveDb();

    const token = signAuthToken(
      { userId: user.userId, role: user.role, sessionId },
      Boolean(rememberMe)
    );

    const linkedStudent =
      user.role === 'STUDENT' && user.studentId
        ? db.students.find(
            (s) =>
              s.studentId.toUpperCase() === user.studentId?.toUpperCase() &&
              !s.isDeleted
          ) || null
        : null;

    res.json({
      token,
      sessionId,
      user: sanitizeUser(user),
      student: linkedStudent,
    });
  } catch (err) {
    console.error(
      '[SMART CAMPUS AUTH] Login error:',
      err instanceof Error ? err.message : err
    );
    res.status(500).json({ error: 'Authentication service failed.' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const {
      fullName,
      studentId,
      email,
      phone,
      course,
      password,
      confirmPassword,
    } = req.body as {
      fullName?: string;
      studentId?: string;
      email?: string;
      phone?: string;
      course?: string;
      password?: string;
      confirmPassword?: string;
    };

    const cleanName = (fullName || '').trim();
    const cleanStudentId = (studentId || '').trim().toUpperCase();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPhone = (phone || '').trim();
    const cleanCourse = (course || '').trim();
    const cleanPassword = password || '';
    const cleanConfirm = confirmPassword || '';

    if (
      !cleanName ||
      !cleanStudentId ||
      !cleanEmail ||
      !cleanPhone ||
      !cleanCourse ||
      !cleanPassword
    ) {
      res.status(400).json({ error: 'All registration fields are required.' });
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      res.status(400).json({ error: 'Enter a valid email address.' });
      return;
    }

    if (!isValidPhone(cleanPhone)) {
      res
        .status(400)
        .json({ error: 'Phone number must contain 10 to 15 digits.' });
      return;
    }

    if (cleanPassword.length < 6) {
      res
        .status(400)
        .json({ error: 'Password must be at least 6 characters long.' });
      return;
    }

    if (cleanPassword !== cleanConfirm) {
      res
        .status(400)
        .json({ error: 'Password and confirmation password do not match.' });
      return;
    }

    const db = getDb();

    // Enforce: Students can only register if linked to a valid, non-deleted student record
    const validStudentRecord = db.students.find(
      (s) => s.studentId.toUpperCase() === cleanStudentId && !s.isDeleted
    );
    if (!validStudentRecord) {
      res.status(404).json({
        error: `Student ID "${cleanStudentId}" was not found in active college admissions. Contact the Registrar Office first.`,
      });
      return;
    }

    const duplicateAccount = db.users.find(
      (u) =>
        u.userId.toUpperCase() === cleanStudentId ||
        u.studentId?.toUpperCase() === cleanStudentId ||
        u.email.toLowerCase() === cleanEmail
    );
    if (duplicateAccount) {
      res.status(409).json({
        error:
          'An account already exists for this Student ID or Email address.',
      });
      return;
    }

    const passwordHash = await bcrypt.hash(cleanPassword, 10);
    const nowIso = new Date().toISOString();
    const newUser: UserAccount = {
      id: `USR-${Date.now()}`,
      userId: cleanStudentId,
      fullName: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      role: 'STUDENT',
      studentId: validStudentRecord.studentId,
      course: cleanCourse,
      passwordHash,
      approved: true,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    db.users.push(newUser);
    appendActivity(
      'Student Account Created',
      cleanName,
      'STUDENT',
      `Registered portal access for ${cleanStudentId} (${cleanCourse})`
    );
    await saveDb();

    res.status(201).json({
      message: 'Student account created successfully. You can now sign in.',
      user: sanitizeUser(newUser),
    });
  } catch (err) {
    console.error(
      '[SMART CAMPUS AUTH] Registration error:',
      err instanceof Error ? err.message : err
    );
    res.status(500).json({ error: 'Failed to create account.' });
  }
});

router.post(
  '/forgot-password/request',
  asyncHandler(async (req, res) => {
    const { userId, email } = req.body as { userId?: string; email?: string };
    const cleanId = (userId || '').trim().toUpperCase();
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanId || !cleanEmail) {
      res.status(400).json({ error: 'User ID and registered email are required.' });
      return;
    }

    const db = getDb();
    const user = db.users.find(
      (u) =>
        u.userId.toUpperCase() === cleanId &&
        u.email.toLowerCase() === cleanEmail
    );

    if (!user) {
      res.status(404).json({
        error: 'No account found matching that User ID and Email combination.',
      });
      return;
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    if (!db.resetCodes) {
      db.resetCodes = {};
    }
    db.resetCodes[user.userId.toUpperCase()] = {
      code,
      expiresAt: Date.now() + 10 * 60 * 1000,
    };
    await saveDb();

    res.json({
      message:
        'Verification code generated. Use the 6-digit security code below to complete your password reset.',
      verificationCodePreview: code,
      expiresInMinutes: 10,
    });
  })
);

router.post(
  '/forgot-password/reset',
  asyncHandler(async (req, res) => {
    const { userId, code, newPassword, confirmPassword } = req.body as {
      userId?: string;
      code?: string;
      newPassword?: string;
      confirmPassword?: string;
    };

    const cleanId = (userId || '').trim().toUpperCase();
    const cleanCode = (code || '').trim();
    const cleanNew = newPassword || '';
    const cleanConfirm = confirmPassword || '';

    if (!cleanId || !cleanCode || !cleanNew) {
      res.status(400).json({ error: 'All password reset fields are required.' });
      return;
    }

    if (cleanNew.length < 6) {
      res
        .status(400)
        .json({ error: 'New password must be at least 6 characters.' });
      return;
    }

    if (cleanNew !== cleanConfirm) {
      res.status(400).json({ error: 'Passwords do not match.' });
      return;
    }

    const db = getDb();
    const entry = db.resetCodes?.[cleanId];
    if (!entry || entry.code !== cleanCode || Date.now() > entry.expiresAt) {
      res
        .status(400)
        .json({ error: 'Invalid or expired verification code.' });
      return;
    }

    const user = db.users.find((u) => u.userId.toUpperCase() === cleanId);
    if (!user) {
      res.status(404).json({ error: 'User account not found.' });
      return;
    }

    user.passwordHash = await bcrypt.hash(cleanNew, 10);
    user.updatedAt = new Date().toISOString();
    // Revoke existing sessions on password reset
    db.sessions = db.sessions.filter((s) => s.userId.toUpperCase() !== cleanId);
    if (db.resetCodes) {
      delete db.resetCodes[cleanId];
    }
    appendActivity(
      'Password Reset',
      user.fullName,
      user.role,
      `Completed password reset for ${user.userId}`
    );
    await saveDb();

    res.json({ message: 'Password has been reset successfully.' });
  })
);

router.post(
  '/logout',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const db = getDb();
    db.sessions = db.sessions.filter((s) => s.sessionId !== req.sessionId);
    await saveDb();
    res.json({ message: 'Logged out successfully.' });
  })
);

router.get('/me', authenticateToken, (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const user = req.user!;
  const linkedStudent =
    user.role === 'STUDENT' && user.studentId
      ? db.students.find(
          (s) =>
            s.studentId.toUpperCase() === user.studentId?.toUpperCase() &&
            !s.isDeleted
        ) || null
      : null;

  res.json({
    user: sanitizeUser(user),
    student: linkedStudent,
    currentSessionId: req.sessionId,
  });
});

router.put(
  '/profile',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { fullName, email, phone } = req.body as {
    fullName?: string;
    email?: string;
    phone?: string;
  };
  const db = getDb();
  const user = db.users.find((u) => u.userId === req.user!.userId);
  if (!user) {
    res.status(404).json({ error: 'Account not found.' });
    return;
  }

  const nextName = (fullName || user.fullName).trim();
  const nextEmail = (email || user.email).trim().toLowerCase();
  const nextPhone = (phone || user.phone).trim();

  if (!nextName || !isValidEmail(nextEmail) || !isValidPhone(nextPhone)) {
    res.status(400).json({ error: 'Provide a valid name, email, and phone number.' });
    return;
  }

  user.fullName = nextName;
  user.email = nextEmail;
  user.phone = nextPhone;
  user.updatedAt = new Date().toISOString();

  if (user.role === 'STUDENT' && user.studentId) {
    const stu = db.students.find((s) => s.studentId === user.studentId);
    if (stu) {
      stu.fullName = nextName;
      stu.email = nextEmail;
      stu.phone = nextPhone;
      stu.updatedAt = user.updatedAt;
    }
  }

  appendActivity(
    'Profile Updated',
    user.fullName,
    user.role,
    `Updated profile information for ${user.userId}`
  );
  await saveDb();

  res.json({ user: sanitizeUser(user) });
}));

router.put(
  '/change-password',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body as {
      currentPassword?: string;
      newPassword?: string;
      confirmPassword?: string;
    };

    if (!currentPassword || !newPassword || !confirmPassword) {
      res.status(400).json({ error: 'All password fields are required.' });
      return;
    }
    if (newPassword.length < 6) {
      res
        .status(400)
        .json({ error: 'New password must be at least 6 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      res.status(400).json({ error: 'New passwords do not match.' });
      return;
    }

    const db = getDb();
    const user = db.users.find((u) => u.userId === req.user!.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) {
      res.status(401).json({ error: 'Current password is incorrect.' });
      return;
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.updatedAt = new Date().toISOString();
    appendActivity(
      'Password Changed',
      user.fullName,
      user.role,
      `Updated account password for ${user.userId}`
    );
    await saveDb();

    res.json({ message: 'Password updated successfully.' });
  })
);

router.get('/sessions', authenticateToken, (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const userSessions = db.sessions
    .filter((s) =>
      req.user!.role === 'ADMIN' ? true : s.userId === req.user!.userId
    )
    .map((s) => ({
      ...s,
      isCurrent: s.sessionId === req.sessionId,
    }));
  res.json({ sessions: userSessions });
});

router.delete(
  '/sessions/:sessionId',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { sessionId } = req.params;
    const db = getDb();
    const target = db.sessions.find((s) => s.sessionId === sessionId);
    if (!target) {
      res.status(404).json({ error: 'Session not found.' });
      return;
    }
    if (req.user!.role !== 'ADMIN' && target.userId !== req.user!.userId) {
      res.status(403).json({ error: 'Cannot revoke another user session.' });
      return;
    }

    db.sessions = db.sessions.filter((s) => s.sessionId !== sessionId);
    await saveDb();
    res.json({ message: 'Session revoked.' });
  })
);

router.get(
  '/users',
  authenticateToken,
  requireRole('ADMIN'),
  (_req, res) => {
    const db = getDb();
    res.json({ users: db.users.map(sanitizeUser) });
  }
);

router.post(
  '/admin-users',
  authenticateToken,
  requireRole('ADMIN'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { userId, fullName, email, phone, password } = req.body as {
      userId?: string;
      fullName?: string;
      email?: string;
      phone?: string;
      password?: string;
    };

    const cleanId = (userId || '').trim().toUpperCase();
    const cleanName = (fullName || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPhone = (phone || '').trim();

    if (!cleanId || !cleanName || !cleanEmail || !cleanPhone || !password) {
      res.status(400).json({ error: 'All administrator fields are required.' });
      return;
    }
    if (!isValidEmail(cleanEmail) || !isValidPhone(cleanPhone)) {
      res.status(400).json({ error: 'Invalid email or phone format.' });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters.' });
      return;
    }

    const db = getDb();
    if (
      db.users.some(
        (u) =>
          u.userId.toUpperCase() === cleanId ||
          u.email.toLowerCase() === cleanEmail
      )
    ) {
      res
        .status(409)
        .json({ error: 'User ID or Email already exists in user directory.' });
      return;
    }

    const nowIso = new Date().toISOString();
    const adminUser: UserAccount = {
      id: `USR-${Date.now()}`,
      userId: cleanId,
      fullName: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      role: 'ADMIN',
      passwordHash: await bcrypt.hash(password, 10),
      approved: true,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    db.users.push(adminUser);
    appendActivity(
      'Admin Account Created',
      req.user!.fullName,
      'ADMIN',
      `Created authorized administrator account ${cleanId}`
    );
    await saveDb();

    res.status(201).json({ user: sanitizeUser(adminUser) });
  })
);

export default router;
