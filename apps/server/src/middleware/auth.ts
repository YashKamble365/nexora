import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role, FacultyRole, UserDTO } from '@nexora/types';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string;
  institutionalId: string;
  instituteId?: string;
  instituteName?: string;
  instituteCode?: string;
  academicYear?: string;
  semester?: string;
  facultyRole?: FacultyRole;
  coordinatorYear?: string;
  avatarUrl?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

const getJwtSecret = () => process.env.JWT_SECRET || 'nexora-campus-jwt-secret-key-2026';

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  // Extract token from HTTP-only cookie, Bearer Authorization header, or query param
  const token =
    req.cookies?.nexora_token ||
    (req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.substring(7)
      : null) ||
    (typeof req.query?.token === 'string' ? req.query.token : null);

  if (!token) {
    res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Authentication token required to access this resource',
    });
    return;
  }

  try {
    const payload = jwt.verify(token, getJwtSecret()) as AuthenticatedUser;
    req.user = payload;
    next();
  } catch (err) {
    res.status(401).json({
      error: 'INVALID_TOKEN',
      message: 'Session expired or token invalid. Please sign in again.',
    });
    return;
  }
}

export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: 'FORBIDDEN',
        message: `Access denied. Requires one of roles: [${allowedRoles.join(', ')}]. Current role: ${req.user.role}`,
      });
      return;
    }

    next();
  };
}
