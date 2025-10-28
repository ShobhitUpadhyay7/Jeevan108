import { Request, Response, NextFunction } from "express";
import User from "../model/user/BaseModel";

export function requireRole(requiredRole: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).userId as string | undefined;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const user = await User.findById(userId).select("role");
      if (!user) return res.status(401).json({ message: "Unauthorized" });
      if (user.role !== requiredRole) {
        return res.status(403).json({ message: "Forbidden" });
      }
      return next();
    } catch (err) {
      return res.status(500).json({ message: "Authorization check failed" });
    }
  };
}

export function requireAnyRole(allowedRoles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).userId as string | undefined;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const user = await User.findById(userId).select("role");
      if (!user) return res.status(401).json({ message: "Unauthorized" });
      if (!allowedRoles.includes(user.role as string)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      return next();
    } catch (err) {
      return res.status(500).json({ message: "Authorization check failed" });
    }
  };
}
