import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../../model/user/BaseModel";
import Nurse from "../../model/user/nurse";
import Caretaker from "../../model/user/caretaker";
import Compounder from "../../model/user/compounder";
import Admin from "../../model/user/admin";
import Staff from "../../model/user/staff";

type RoleName = "User" | "Nurse" | "Caretaker" | "Compounder" | "Patient";

const roleToModel: Record<string, any> = {
  User,
  Admin,
  Staff,
  Nurse,
  Caretaker,
  Compounder,
  // Patient model is optional; import and add when ready
};

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not configured");
  return secret;
}

export async function register(req: Request, res: Response) {
  try {
    const {
      username,
      email,
      password,
      phone,
      role,
      address,
      profilePicture,
    }: {
      username: string;
      email: string;
      password: string;
      phone: string;
      role?: RoleName;
      address?: string;
      profilePicture?: string;
    } = req.body || {};

    if (!username || !email || !password || !phone) {
      return res
        .status(400)
        .json({ message: "username, email, password, phone are required" });
    }

    const existing = await User.findOne({ email }).lean();
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const Model = role && roleToModel[role] ? roleToModel[role] : User;
    const created = await Model.create({
      username,
      email,
      password: passwordHash,
      phone,
      address,
      profilePicture,
    });

    return res.status(201).json({
      id: created._id,
      username: created.username,
      email: created.email,
      phone: created.phone,
      role: role && roleToModel[role] ? role : "User",
    });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Registration failed", error: String(err) });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { sub: String(user._id), email: user.email },
      getJwtSecret(),
      { expiresIn: "7d" }
    );

    return res.json({ token });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Login failed", error: String(err) });
  }
}

export async function me(req: Request, res: Response) {
  try {
    const userId = (req as any).userId as string | undefined;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const user = await User.findById(userId).select("username email phone");
    if (!user) return res.status(404).json({ message: "Not found" });
    return res.json(user);
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Failed to fetch profile", error: String(err) });
  }
}
