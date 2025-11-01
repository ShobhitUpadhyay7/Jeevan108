import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import Nurse from "../../model/user/nurse";
import Caretaker from "../../model/user/caretaker";
import Compounder from "../../model/user/compounder";
import { deleteFile } from "../../utils/upload";

const roleToModel: Record<string, any> = {
  Nurse,
  Caretaker,
  Compounder,
};

function getModel(roleParam: string) {
  const role =
    roleParam.charAt(0).toUpperCase() + roleParam.slice(1).toLowerCase();
  return roleToModel[role];
}

export async function listUsersByRole(req: Request, res: Response) {
  try {
    const Model = getModel(req.params.role);
    if (!Model) return res.status(400).json({ message: "Invalid role" });
    const items = await Model.find().select("username email phone").lean();
    return res.json(items);
  } catch (err) {
    return res.status(500).json({ message: "List failed", error: String(err) });
  }
}

export async function getUserByRole(req: Request, res: Response) {
  try {
    const Model = getModel(req.params.role);
    if (!Model) return res.status(400).json({ message: "Invalid role" });
    const doc = await Model.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Not found" });
    return res.json(doc);
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Fetch failed", error: String(err) });
  }
}

export async function updateUserByRole(req: Request, res: Response) {
  try {
    const Model = getModel(req.params.role);
    if (!Model) return res.status(400).json({ message: "Invalid role" });
    const { password, ...rest } = req.body || {};
    const update: any = { ...rest };
    if (password) {
      update.password = await bcrypt.hash(password, 10);
    }
    const doc = await Model.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: "Not found" });
    return res.json(doc);
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Update failed", error: String(err) });
  }
}

// Helper function to extract filename from document URL
function extractFilenameFromUrl(url: string): string | null {
  if (!url) return null;
  try {
    // URL format: http://localhost:7001/uploads/documents/filename.ext
    const parts = url.split("/uploads/documents/");
    if (parts.length === 2) {
      return parts[1];
    }
    return null;
  } catch {
    return null;
  }
}

// Helper function to extract filename from image URL
function extractImageFilenameFromUrl(url: string): string | null {
  if (!url) return null;
  try {
    // URL format: http://localhost:7001/uploads/images/filename.ext
    const parts = url.split("/uploads/images/");
    if (parts.length === 2) {
      return parts[1];
    }
    return null;
  } catch {
    return null;
  }
}

// Helper function to delete user documents
async function deleteUserDocuments(user: any, role: string): Promise<void> {
  const documentsToDelete: string[] = [];
  
  // Extract document URLs based on role
  if (role === "Nurse") {
    if (user.governmentId) documentsToDelete.push(user.governmentId);
    if (user.nursingRegistrationCertificate) documentsToDelete.push(user.nursingRegistrationCertificate);
    if (user.policeVerificationCertificate) documentsToDelete.push(user.policeVerificationCertificate);
  } else if (role === "Caretaker") {
    if (user.governmentId) documentsToDelete.push(user.governmentId);
    if (user.policeVerificationCertificate) documentsToDelete.push(user.policeVerificationCertificate);
  } else if (role === "Compounder") {
    if (user.governmentId) documentsToDelete.push(user.governmentId);
    if (user.trainingCertificate) documentsToDelete.push(user.trainingCertificate);
    if (user.policeVerificationCertificate) documentsToDelete.push(user.policeVerificationCertificate);
  }
  
  // Delete each document file
  const deletePromises = documentsToDelete.map(async (url) => {
    const filename = extractFilenameFromUrl(url);
    if (filename) {
      try {
        await deleteFile(filename, "document");
      } catch (err) {
        // Log error but don't fail the entire deletion
        console.error(`Failed to delete document file ${filename}:`, err);
      }
    }
  });
  
  await Promise.all(deletePromises);
}

// Helper function to delete user profile picture
async function deleteUserProfilePicture(user: any): Promise<void> {
  if (!user.profilePicture) return;
  
  const profilePicUrl = user.profilePicture as string;
  const filename = extractImageFilenameFromUrl(profilePicUrl);
  
  if (filename) {
    try {
      await deleteFile(filename, "image");
      console.log(`Deleted profile picture: ${filename}`);
    } catch (err) {
      // Log error but don't fail the entire deletion
      console.error(`Failed to delete profile picture file ${filename}:`, err);
    }
  }
}

export async function deleteUserByRole(req: Request, res: Response) {
  try {
    const Model = getModel(req.params.role);
    if (!Model) return res.status(400).json({ message: "Invalid role" });
    
    // Find the user first to get document URLs and profile picture before deletion
    const user = await Model.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "Not found" });
    
    // Delete user's documents
    const role = req.params.role.charAt(0).toUpperCase() + req.params.role.slice(1).toLowerCase();
    await deleteUserDocuments(user, role);
    
    // Delete user's profile picture
    await deleteUserProfilePicture(user);
    
    // Delete the user from database
    await Model.findByIdAndDelete(req.params.id);
    
    return res.status(204).send();
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Delete failed", error: String(err) });
  }
}
