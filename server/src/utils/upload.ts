import multer, { FileFilterCallback } from "multer";
import path from "path";
import fs from "fs";
import { Request } from "express";

// Ensure upload directories exist
const uploadsDir = path.join(process.cwd(), "uploads");
const documentsDir = path.join(uploadsDir, "documents");
const imagesDir = path.join(uploadsDir, "images");

// Create directories if they don't exist
[uploadsDir, documentsDir, imagesDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure storage for documents
const documentStorage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    cb(null, documentsDir);
  },
  filename: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    // Generate unique filename: timestamp-random-originalname
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  },
});

// Configure storage for images
const imageStorage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    cb(null, imagesDir);
  },
  filename: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    // Generate unique filename: timestamp-random-originalname
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  },
});

// File filter for documents
const documentFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  // Allow PDF, DOC, DOCX, and image files
  const allowedMimes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/jpeg",
    "image/jpg",
    "image/png",
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only PDF, DOC, DOCX, JPG, JPEG, and PNG files are allowed."));
  }
};

// File filter for images
const imageFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  // Allow only image files
  const allowedMimes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPG, JPEG, PNG, GIF, and WEBP images are allowed."));
  }
};

// Multer instance for documents
export const uploadDocument = multer({
  storage: documentStorage,
  fileFilter: documentFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Multer instance for images
export const uploadImage = multer({
  storage: imageStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Helper function to get file URL
export function getFileUrl(filename: string, type: "document" | "image"): string {
  const baseUrl = process.env.BASE_URL || "http://localhost:7001";
  const folder = type === "document" ? "documents" : "images";
  return `${baseUrl}/uploads/${folder}/${filename}`;
}

// Helper function to get file path
export function getFilePath(filename: string, type: "document" | "image"): string {
  const folder = type === "document" ? documentsDir : imagesDir;
  return path.join(folder, filename);
}

// Helper function to delete file
export function deleteFile(filename: string, type: "document" | "image"): Promise<void> {
  return new Promise((resolve, reject) => {
    const filePath = getFilePath(filename, type);
    fs.unlink(filePath, (err) => {
      if (err && err.code !== "ENOENT") {
        // ENOENT means file doesn't exist, which is fine
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

// Helper function to save base64 to file (for backward compatibility)
export async function saveBase64ToFile(
  base64String: string,
  type: "document" | "image",
  originalName?: string
): Promise<string> {
  // Remove data URL prefix if present (e.g., "data:image/png;base64,")
  const base64Data = base64String.replace(/^data:[\w\/]+;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");
  
  // Determine file extension from base64 or use default
  let ext = ".png"; // default
  if (originalName) {
    ext = path.extname(originalName);
  } else if (base64String.startsWith("data:image/")) {
    const match = base64String.match(/data:image\/(\w+);base64/);
    if (match) ext = `.${match[1]}`;
  } else if (base64String.startsWith("data:application/pdf")) {
    ext = ".pdf";
  }
  
  // Generate unique filename
  const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
  const filename = `file-${uniqueSuffix}${ext}`;
  
  // Save to appropriate directory
  const folder = type === "document" ? documentsDir : imagesDir;
  const filePath = path.join(folder, filename);
  
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, buffer, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(filename);
      }
    });
  });
}

// Helper to convert filename to URL (for returning in API responses)
export function filenameToUrl(filename: string, type: "document" | "image"): string {
  return getFileUrl(filename, type);
}

