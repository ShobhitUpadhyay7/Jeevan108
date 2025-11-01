import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import Staff from "../../model/user/staff";
import { saveBase64ToFile, getFileUrl, deleteFile } from "../../utils/upload";

export async function createStaff(req: Request, res: Response) {
  try {
    const { username, email, password, phone, address, profilePicture } =
      req.body || {};
    if (!username || !email || !password || !phone) {
      return res
        .status(400)
        .json({ message: "username, email, password, phone are required" });
    }
    const existing = await Staff.findOne({ email }).lean();
    if (existing)
      return res.status(409).json({ message: "Email already registered" });
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
          // Don't fail the entire creation if profile picture fails
        }
      } else if (profilePicture.startsWith("http://") || profilePicture.startsWith("https://")) {
        // It's already a URL, use it as is
        processedProfilePicture = profilePicture;
      }
    }
    
    const created = await Staff.create({
      username,
      email,
      password: passwordHash,
      phone,
      address,
      profilePicture: processedProfilePicture,
      role: "Staff",
    });
    return res.status(201).json({ id: created._id, username: created.username, email: created.email, phone: created.phone, role: "Staff" });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Create staff failed", error: String(err) });
  }
}

export async function listStaff(_req: Request, res: Response) {
  try {
    const items = await Staff.find().select("username email phone address profilePicture").lean();
    return res.json(items);
  } catch (err) {
    return res
      .status(500)
      .json({ message: "List staff failed", error: String(err) });
  }
}

export async function getStaff(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const staff = await Staff.findById(id).select(
      "username email phone address profilePicture"
    );
    if (!staff) return res.status(404).json({ message: "Not found" });
    return res.json(staff);
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Get staff failed", error: String(err) });
  }
}

export async function updateStaff(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { username, email, phone, address, profilePicture } = req.body || {};
    
    // Get current staff to check for old profile picture
    const currentStaff = await Staff.findById(id);
    if (!currentStaff) return res.status(404).json({ message: "Not found" });
    
    // Process profile picture: save base64 image to disk and get URL
    let processedProfilePicture: string | undefined = currentStaff.profilePicture; // Keep existing by default
    if (profilePicture && typeof profilePicture === "string" && profilePicture.trim()) {
      // Check if it's a base64 string (new upload) or already a URL
      if (profilePicture.startsWith("data:image/") || profilePicture.startsWith("data:application/")) {
        // It's a base64 string, save it to disk
        try {
          // Delete old profile picture if it exists
          if (currentStaff.profilePicture) {
            const oldUrl = currentStaff.profilePicture as string;
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
    
    const updated = await Staff.findByIdAndUpdate(
      id,
      { $set: { username, email, phone, address, profilePicture: processedProfilePicture } },
      { new: true }
    ).select("username email phone address profilePicture");
    if (!updated) return res.status(404).json({ message: "Not found" });
    return res.json(updated);
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Update staff failed", error: String(err) });
  }
}

export async function deleteStaff(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    // Get staff first to delete profile picture
    const staff = await Staff.findById(id);
    if (!staff) return res.status(404).json({ message: "Not found" });
    
    // Delete profile picture if it exists and is in our uploads directory
    if (staff.profilePicture) {
      const profilePicUrl = staff.profilePicture as string;
      if (profilePicUrl.includes("/uploads/images/")) {
        const filename = profilePicUrl.split("/uploads/images/")[1];
        if (filename) {
          try {
            await deleteFile(filename, "image");
          } catch (delError) {
            console.error("Error deleting profile picture:", delError);
            // Don't fail the deletion if image deletion fails
          }
        }
      }
    }
    
    const deleted = await Staff.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Not found" });
    return res.status(204).send();
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Delete staff failed", error: String(err) });
  }
}
