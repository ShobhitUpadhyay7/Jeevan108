import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../../model/user/BaseModel";
import Nurse from "../../model/user/nurse";
import Caretaker from "../../model/user/caretaker";
import Compounder from "../../model/user/compounder";
import Admin from "../../model/user/admin";
import Staff from "../../model/user/staff";
import Patient from "../../model/user/patient";
import { saveBase64ToFile, getFileUrl, deleteFile } from "../../utils/upload";

type RoleName = "User" | "Nurse" | "Caretaker" | "Compounder" | "Patient";

const roleToModel: Record<string, any> = {
  User,
  Admin,
  Staff,
  Nurse,
  Caretaker,
  Compounder,
  Patient 
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

    // Process profile picture: save base64 image to disk and get URL
    let processedProfilePicture: string | undefined;
    if (profilePicture && typeof profilePicture === "string" && profilePicture.trim()) {
      // Check if it's a base64 string (new upload) or already a URL
      if (profilePicture.startsWith("data:image/") || profilePicture.startsWith("data:application/")) {
        // It's a base64 string, save it to disk
        try {
          const filename = await saveBase64ToFile(profilePicture, "image", "profilePicture");
          processedProfilePicture = getFileUrl(filename, "image");
        } catch (picError) {
          console.error("Error saving profile picture:", picError);
          // Don't fail the entire registration if profile picture fails
        }
      } else if (profilePicture.startsWith("http://") || profilePicture.startsWith("https://")) {
        // It's already a URL, use it as is
        processedProfilePicture = profilePicture;
      }
    }

    const Model = role && roleToModel[role] ? roleToModel[role] : User;
    const created = await Model.create({
      username,
      email,
      password: passwordHash,
      phone,
      address,
      profilePicture: processedProfilePicture,
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
    
    // First get basic user info to check role
    const user = await User.findById(userId).select("username email phone role");
    if (!user) return res.status(404).json({ message: "Not found" });
    
    // If user is a worker (Nurse, Caretaker, Compounder), fetch full profile with documents
    const workerRoles = ["Nurse", "Caretaker", "Compounder"];
    if (user.role && workerRoles.includes(user.role)) {
      const Model = roleToModel[user.role];
      if (Model) {
        const fullProfile = await Model.findById(userId);
        if (fullProfile) {
          return res.json(fullProfile);
        }
      }
    }
    
    // For other roles, return basic info
    return res.json(user);
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Failed to fetch profile", error: String(err) });
  }
}

export async function updateMyProfile(req: Request, res: Response) {
  try {
    const userId = (req as any).userId as string | undefined;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    
    // Get user to check role
    const user = await User.findById(userId).select("role");
    if (!user) return res.status(404).json({ message: "Not found" });
    
    const {
      username,
      email,
      phone,
      address,
      profilePicture,
      hourlyRate,
      dailyRate,
      weeklyRate,
      password,
    } = req.body || {};
    
    // Determine which model to use based on role
    const workerRoles = ["Nurse", "Caretaker", "Compounder"];
    const Model = user.role && roleToModel[user.role] ? roleToModel[user.role] : User;
    
    // Get current user to check for old profile picture
    const currentUser = await Model.findById(userId);
    if (!currentUser) return res.status(404).json({ message: "Not found" });
    
    // Process profile picture: save base64 image to disk and get URL
    let processedProfilePicture: string | undefined = (currentUser as any).profilePicture; // Keep existing by default
    if (profilePicture && typeof profilePicture === "string" && profilePicture.trim()) {
      // Check if it's a base64 string (new upload) or already a URL
      if (profilePicture.startsWith("data:image/") || profilePicture.startsWith("data:application/")) {
        // It's a base64 string, save it to disk
        try {
          // Delete old profile picture if it exists
          if ((currentUser as any).profilePicture) {
            const oldUrl = (currentUser as any).profilePicture as string;
            if (oldUrl.includes("/uploads/images/")) {
              const filename = oldUrl.split("/uploads/images/")[1];
              if (filename) {
                try {
                  await deleteFile(filename, "image");
                } catch (delError) {
                  console.error("Error deleting old profile picture:", delError);
                }
              }
            }
          }
          
          const filename = await saveBase64ToFile(profilePicture, "image", "profilePicture");
          processedProfilePicture = getFileUrl(filename, "image");
        } catch (picError) {
          console.error("Error saving profile picture:", picError);
          // Don't fail the entire update if profile picture fails
        }
      } else if (profilePicture.startsWith("http://") || profilePicture.startsWith("https://")) {
        // It's already a URL, use it as is
        processedProfilePicture = profilePicture;
      }
    }
    
    // Build update object
    const update: any = {};
    if (username !== undefined) update.username = username;
    if (email !== undefined) update.email = email;
    if (phone !== undefined) update.phone = phone;
    if (address !== undefined) update.address = address;
    if (processedProfilePicture !== undefined) update.profilePicture = processedProfilePicture;
    
    // Only allow pricing updates for workers
    if (user.role && workerRoles.includes(user.role)) {
      if (hourlyRate !== undefined) update.hourlyRate = hourlyRate;
      if (dailyRate !== undefined) update.dailyRate = dailyRate;
      if (weeklyRate !== undefined) update.weeklyRate = weeklyRate;
    }
    
    // Handle password update
    if (password) {
      update.password = await bcrypt.hash(password, 10);
    }
    
    const updated = await Model.findByIdAndUpdate(
      userId,
      { $set: update },
      { new: true }
    );
    
    if (!updated) return res.status(404).json({ message: "Not found" });
    
    return res.json(updated);
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Update failed", error: String(err) });
  }
}
