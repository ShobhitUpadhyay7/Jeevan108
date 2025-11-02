import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

/**
 * Upload base64 image/document to Cloudinary
 * @param base64String - Base64 string of the file
 * @param type - "document" or "image"
 * @param folder - Cloudinary folder path (optional, defaults to "jeevan108")
 * @returns Promise<string> - Cloudinary secure URL
 */
export async function uploadToCloudinary(
  base64String: string,
  type: "document" | "image",
  folder: string = "jeevan108"
): Promise<string> {
  try {
    // Determine MIME type from base64 string
    let mimeType = "image/png"; // default
    if (base64String.startsWith("data:")) {
      const mimeMatch = base64String.match(/data:([\w\/]+);base64/);
      if (mimeMatch) {
        mimeType = mimeMatch[1];
      }
    }
    
    // Remove data URL prefix if present
    const base64Data = base64String.replace(/^data:[\w\/]+;base64,/, "");
    
    // Determine resource type for Cloudinary
    const resourceType = type === "document" ? "auto" : "image"; // 'auto' detects PDF, DOC, etc.
    
    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(
      `data:${mimeType};base64,${base64Data}`,
      {
        resource_type: resourceType,
        folder: `${folder}/${type}s`, // Organize files by type in Cloudinary
        overwrite: false,
        unique_filename: true,
        use_filename: true,
      }
    );
    
    console.log(`✅ Uploaded to Cloudinary: ${result.secure_url}`);
    return result.secure_url; // Returns HTTPS URL from Cloudinary
  } catch (error) {
    console.error("❌ Cloudinary upload error:", error);
    throw new Error(`Failed to upload file to Cloudinary: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Delete file from Cloudinary using URL
 * @param url - Cloudinary URL of the file to delete
 * @returns Promise<void>
 */
export async function deleteFromCloudinary(url: string): Promise<void> {
  try {
    // Extract public_id from Cloudinary URL
    // URL format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}.{format}
    const urlParts = url.split('/');
    const uploadIndex = urlParts.indexOf('upload');
    
    if (uploadIndex === -1) {
      console.warn("⚠️  Invalid Cloudinary URL:", url);
      return;
    }
    
    // Get everything after 'upload/' (includes version and public_id)
    const pathAfterUpload = urlParts.slice(uploadIndex + 1).join('/');
    // Remove version prefix (v1234567) if present
    const pathWithoutVersion = pathAfterUpload.replace(/^v\d+\//, '');
    // Remove file extension
    const publicId = pathWithoutVersion.replace(/\.[^.]+$/, '');
    
    // Determine resource type from URL
    const resourceType = url.includes('/image/') ? 'image' : 'raw';
    
    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    
    if (result.result !== 'ok') {
      console.warn("⚠️  Failed to delete from Cloudinary:", publicId);
    } else {
      console.log(`✅ Deleted from Cloudinary: ${publicId}`);
    }
  } catch (error) {
    console.error("❌ Cloudinary delete error:", error);
    // Don't throw - deletion failures shouldn't break the app
  }
}

/**
 * Backward compatibility: Map old function names to Cloudinary
 * This maintains compatibility with existing code
 */
export async function saveBase64ToFile(
  base64String: string,
  type: "document" | "image",
  originalName?: string,
  folder?: string
): Promise<string> {
  return uploadToCloudinary(base64String, type, folder || "jeevan108");
}

/**
 * Backward compatibility: Get file URL
 * Cloudinary URLs are already full URLs, so just return them
 */
export function getFileUrl(url: string, type: "document" | "image"): string {
  return url;
}

/**
 * Backward compatibility: Delete file
 * Maps to Cloudinary deletion
 */
export async function deleteFile(url: string, type: "document" | "image"): Promise<void> {
  // Only delete from Cloudinary if it's a Cloudinary URL
  if (url && url.includes('cloudinary.com')) {
    return deleteFromCloudinary(url);
  }
  // If it's not a Cloudinary URL (old local file), just skip
  console.log("ℹ️  Skipping deletion of non-Cloudinary URL:", url);
}

/**
 * Backward compatibility: Convert filename to URL
 * Cloudinary returns full URLs already
 */
export function filenameToUrl(filename: string, type: "document" | "image"): string {
  return filename;
}

// Export Cloudinary instance for advanced usage if needed
export { cloudinary };
