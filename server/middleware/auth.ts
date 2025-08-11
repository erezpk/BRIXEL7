import { Request, Response, NextFunction } from "express";

// Updated authentication middleware that works with our new auth system
export const requireAuth = (req: any, res: Response, next: NextFunction) => {
  // Only check session-based authentication
  const isSessionAuth = req.session?.user?.id;

  if (!isSessionAuth) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  // Set standardized user object from session
  req.user = {
    id: req.session.user.id,
    email: req.session.user.email,
    role: req.session.user.role,
    agencyId: req.session.user.agencyId
  };
  
  next();
};

export const requireAgencyAccess = (req: any, res: Response, next: NextFunction) => {
  if (!req.user || !req.user.agencyId) {
    return res.status(401).json({ message: "Agency access required" });
  }
  next();
};

// Alias for backward compatibility
export const requireUserWithAgency = requireAgencyAccess;

// Simple authenticated check function
export const isAuthenticated = requireAuth;

export const requireRole = (roles: string[]) => {
  return (req: any, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    next();
  };
};