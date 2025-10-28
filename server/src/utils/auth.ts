import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not configured");
  return secret;
}

export function verifyJwt(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : undefined;
    if (!token) return res.status(401).json({ message: "Missing token" });
    const payload = jwt.verify(token, getJwtSecret()) as { sub: string };
    (req as any).userId = payload.sub;
    return next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}
