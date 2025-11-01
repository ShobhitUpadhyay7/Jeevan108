import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import PendingApplication from "../../model/user/PendingApplication";
import Nurse from "../../model/user/nurse";
import Caretaker from "../../model/user/caretaker";
import Compounder from "../../model/user/compounder";
import { saveBase64ToFile, getFileUrl, deleteFile } from "../../utils/upload";

const roleToModel: Record<string, any> = {
  Nurse,
  Caretaker,
  Compounder,
};

export async function submitApplication(req: Request, res: Response) {
  try {
    const {
      username,
      email,
      password,
      phone,
      address,
      profilePicture,
      role,
      documents,
    } = req.body || {};
    
    console.log("Received application submission:", {
      role,
      hasDocuments: !!documents,
      documentKeys: documents ? Object.keys(documents) : [],
      trainingCertificate: documents?.trainingCertificate ? "present" : "missing"
    });
    
    if (!username || !email || !password || !phone || !role) {
      return res.status(400).json({
        message: "username, email, password, phone, role are required",
      });
    }
    if (!roleToModel[role])
      return res.status(400).json({ message: "Invalid role" });

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
          console.log("Saved profile picture:", filename);
        } catch (picError) {
          console.error("Error saving profile picture:", picError);
          // Don't fail the entire submission if profile picture fails
        }
      } else if (profilePicture.startsWith("http://") || profilePicture.startsWith("https://")) {
        // It's already a URL, use it as is
        processedProfilePicture = profilePicture;
      }
    }
    
    // Process documents: save base64 files to disk and get URLs
    let processedDocuments: Record<string, string> | undefined;
    if (documents && typeof documents === 'object') {
      processedDocuments = {};
      
      // Save each document to file and get URL
      try {
        if (documents.governmentId && documents.governmentId.trim()) {
          const filename = await saveBase64ToFile(
            documents.governmentId,
            "document",
            "governmentId"
          );
          processedDocuments.governmentId = getFileUrl(filename, "document");
          console.log("Saved governmentId:", filename);
        }
        
        if (documents.nursingRegistrationCertificate && documents.nursingRegistrationCertificate.trim()) {
          const filename = await saveBase64ToFile(
            documents.nursingRegistrationCertificate,
            "document",
            "nursingRegistrationCertificate"
          );
          processedDocuments.nursingRegistrationCertificate = getFileUrl(filename, "document");
          console.log("Saved nursingRegistrationCertificate:", filename);
        }
        
        if (documents.trainingCertificate && documents.trainingCertificate.trim()) {
          console.log("Processing trainingCertificate, length:", documents.trainingCertificate.length);
          const filename = await saveBase64ToFile(
            documents.trainingCertificate,
            "document",
            "trainingCertificate"
          );
          processedDocuments.trainingCertificate = getFileUrl(filename, "document");
          console.log("Saved trainingCertificate:", filename);
        } else {
          console.log("trainingCertificate not present or empty:", {
            exists: !!documents.trainingCertificate,
            type: typeof documents.trainingCertificate,
            value: documents.trainingCertificate ? documents.trainingCertificate.substring(0, 50) : "N/A"
          });
        }
        
        if (documents.policeVerificationCertificate && documents.policeVerificationCertificate.trim()) {
          const filename = await saveBase64ToFile(
            documents.policeVerificationCertificate,
            "document",
            "policeVerificationCertificate"
          );
          processedDocuments.policeVerificationCertificate = getFileUrl(filename, "document");
          console.log("Saved policeVerificationCertificate:", filename);
        }
        
        console.log("Processed documents:", Object.keys(processedDocuments));
      } catch (docError) {
        console.error("Error saving documents:", docError);
        throw new Error(`Failed to save documents: ${docError instanceof Error ? docError.message : String(docError)}`);
      }
    }
    
    const applicationData: any = {
      username,
      email,
      password: passwordHash,
      phone,
      address,
      role,
    };
    
    if (processedProfilePicture) {
      applicationData.profilePicture = processedProfilePicture;
    }
    
    if (processedDocuments && Object.keys(processedDocuments).length > 0) {
      applicationData.documents = processedDocuments;
    }
    
    console.log("Creating application with data:", {
      role,
      documentKeys: processedDocuments ? Object.keys(processedDocuments) : [],
      processedDocuments
    });
    
    const created = await PendingApplication.create(applicationData);
    console.log("Application created with documents:", JSON.stringify(created.documents, null, 2));
    return res
      .status(201)
      .json({ applicationId: created._id, status: created.status });
  } catch (err) {
    console.error("Submit application error:", err);
    return res
      .status(500)
      .json({ message: "Submit application failed", error: String(err) });
  }
}

export async function getApplicationStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const app = await PendingApplication.findById(id).select(
      "status role submittedAt"
    );
    if (!app) return res.status(404).json({ message: "Not found" });
    return res.json(app);
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Fetch status failed", error: String(err) });
  }
}

export async function listPending(req: Request, res: Response) {
  try {
    const { status = "pending" } = req.query as any;
    const apps = await PendingApplication.find({ status })
      .select("username email phone role submittedAt")
      .lean();
    return res.json(apps);
  } catch (err) {
    return res
      .status(500)
      .json({ message: "List applications failed", error: String(err) });
  }
}

export async function getApplication(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const app = await PendingApplication.findById(id);
    if (!app) return res.status(404).json({ message: "Not found" });
    console.log("Retrieved application documents:", app.documents);
    return res.json(app);
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Fetch application failed", error: String(err) });
  }
}

export async function approveApplication(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const reviewerId = (req as any).userId as string;
    const app = await PendingApplication.findById(id);
    if (!app) return res.status(404).json({ message: "Not found" });
    if (app.status !== "pending")
      return res.status(400).json({ message: "Already processed" });

    const Model = roleToModel[app.role];
    
    // Map documents based on role requirements (documents are now URLs, not base64)
    let documentFields: Record<string, any> = {};
    const docs = app.documents || {} as any;
    
    if (app.role === "Compounder") {
      // For compounders, use trainingCertificate or nursingRegistrationCertificate as fallback
      console.log("Compounder documents check:", {
        governmentId: !!docs.governmentId,
        trainingCertificate: !!docs.trainingCertificate,
        nursingRegistrationCertificate: !!docs.nursingRegistrationCertificate,
        policeVerificationCertificate: !!docs.policeVerificationCertificate,
        allDocs: docs
      });
      
      const trainingCert = (docs as any).trainingCertificate || docs.nursingRegistrationCertificate;
      
      if (!docs.governmentId || !trainingCert || !docs.policeVerificationCertificate) {
        return res.status(400).json({ 
          message: "Missing required documents for Compounder: governmentId, trainingCertificate (or nursingRegistrationCertificate), and policeVerificationCertificate are required.",
          received: {
            governmentId: !!docs.governmentId,
            trainingCertificate: !!docs.trainingCertificate,
            nursingRegistrationCertificate: !!docs.nursingRegistrationCertificate,
            policeVerificationCertificate: !!docs.policeVerificationCertificate
          }
        });
      }
      
      documentFields = {
        governmentId: docs.governmentId,
        trainingCertificate: trainingCert,
        policeVerificationCertificate: docs.policeVerificationCertificate,
      };
    } else if (app.role === "Nurse") {
      if (!docs.governmentId || !docs.nursingRegistrationCertificate || !docs.policeVerificationCertificate) {
        return res.status(400).json({ 
          message: "Missing required documents for Nurse: governmentId, nursingRegistrationCertificate, and policeVerificationCertificate are required." 
        });
      }
      
      documentFields = {
        governmentId: docs.governmentId,
        nursingRegistrationCertificate: docs.nursingRegistrationCertificate,
        policeVerificationCertificate: docs.policeVerificationCertificate,
      };
    } else if (app.role === "Caretaker") {
      if (!docs.governmentId || !docs.policeVerificationCertificate) {
        return res.status(400).json({ 
          message: "Missing required documents for Caretaker: governmentId and policeVerificationCertificate are required." 
        });
      }
      
      documentFields = {
        governmentId: docs.governmentId,
        policeVerificationCertificate: docs.policeVerificationCertificate,
      };
    }
    
    const created = await Model.create({
      username: app.username,
      email: app.email,
      password: app.password,
      phone: app.phone,
      address: app.address,
      profilePicture: app.profilePicture,
      role: app.role,
      ...documentFields,
    });

    app.status = "approved";
    app.reviewedAt = new Date();
    app.reviewedBy = reviewerId as any;
    await app.save();

    return res.json({ userId: created._id });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Approve failed", error: String(err) });
  }
}

// Helper function to extract filename from URL
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

// Helper function to delete application documents
async function deleteApplicationDocuments(documents: any): Promise<void> {
  if (!documents) return;
  
  const documentsToDelete: string[] = [];
  
  // Collect all document URLs
  if (documents.governmentId) documentsToDelete.push(documents.governmentId);
  if (documents.nursingRegistrationCertificate) documentsToDelete.push(documents.nursingRegistrationCertificate);
  if (documents.trainingCertificate) documentsToDelete.push(documents.trainingCertificate);
  if (documents.policeVerificationCertificate) documentsToDelete.push(documents.policeVerificationCertificate);
  
  // Delete each document file
  const deletePromises = documentsToDelete.map(async (url) => {
    const filename = extractFilenameFromUrl(url);
    if (filename) {
      try {
        await deleteFile(filename, "document");
        console.log("Deleted application document:", filename);
      } catch (err) {
        // Log error but don't fail the entire deletion
        console.error(`Failed to delete document file ${filename}:`, err);
      }
    }
  });
  
  await Promise.all(deletePromises);
}

export async function rejectApplication(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};
    const reviewerId = (req as any).userId as string;
    const app = await PendingApplication.findById(id);
    if (!app) return res.status(404).json({ message: "Not found" });
    if (app.status !== "pending")
      return res.status(400).json({ message: "Already processed" });
    
    // Delete application documents before rejecting
    if (app.documents) {
      await deleteApplicationDocuments(app.documents);
    }
    
    app.status = "rejected";
    app.rejectionReason = reason;
    app.reviewedAt = new Date();
    app.reviewedBy = reviewerId as any;
    await app.save();
    return res.json({ ok: true });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Reject failed", error: String(err) });
  }
}
