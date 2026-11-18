import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { getDb, isProductionRuntime } from '../db';
import { UserAccount, UserRole } from '../../src/types/campus';

export interface AuthenticatedRequest extends Request {
  user?: UserAccount;
  sessionId?: string;
}

export function getJwtSecret(): string {
  const envSecret = process.env.JWT_SECRET?.trim();
  if (envSecret) {
    return envSecret;
  }

  if (isProductionRuntime()) {
    throw new Error(
      'JWT_SECRET environment variable is required in production.'
    );
  }

  return 'smart_campus_dev_jwt_secret_change_in_production';
}

export interface JwtPayloadData {
  userId: string;
  role: UserRole;
  sessionId: string;
}

export function signAuthToken(
  payload: JwtPayloadData,
  rememberMe: boolean
): string {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: rememberMe ? '7d' : '12h',
  });
}

export function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : '';

  if (!token) {
    res.status(401).json({ error: 'Authentication required. Please log in.' });
    return;
  }

  let jwtSecret: string;
  try {
    jwtSecret = getJwtSecret();
  } catch (err) {
    console.error(
      '[SMART CAMPUS AUTH] Configuration error:',
      err instanceof Error ? err.message : err
    );
    res.status(500).json({ error: 'Server authentication configuration error.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as JwtPayloadData;
    const db = getDb();

    const activeSession = db.sessions.find(
      (s) => s.sessionId === decoded.sessionId && s.userId === decoded.userId
    );
    if (!activeSession) {
      res
        .status(401)
        .json({ error: 'Session has expired or been revoked. Please log in again.' });
      return;
    }

    if (new Date(activeSession.expiresAt).getTime() < Date.now()) {
      res.status(401).json({ error: 'Session expired. Please log in again.' });
      return;
    }

    const user = db.users.find(
      (u) => u.userId.toUpperCase() === decoded.userId.toUpperCase()
    );
    if (!user || !user.approved) {
      res.status(403).json({ error: 'Account is inactive or not approved.' });
      return;
    }

    req.user = user;
    req.sessionId = decoded.sessionId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Access denied. Requires ${allowedRoles.join(' or ')} role.`,
      });
      return;
    }
    next();
  };
}
