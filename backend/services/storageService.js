// services/storageService.js
// ─────────────────────────────────────────────────────────────────────────
//  Storage abstraction for user-uploaded media (audio chapters + covers).
//
//  • PRODUCTION (Vercel serverless): Cloudinary. Disk is ephemeral there,
//    so we stream the in-memory buffer to the cloud and persist a URL.
//  • LOCAL DEV: if Cloudinary creds are absent, fall back to writing to
//    disk under backend/uploads/<audio|covers>/ — exactly how the app
//    worked before — so `npm run dev` keeps working with zero setup.
//
//  Both implementations return the SAME shape:
//     { url, filename, resourceType, bytes, mimetype }
//  `url` is what the frontend renders/streams; `filename` is a stable key.
// ─────────────────────────────────────────────────────────────────────────
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HAS_CLOUDINARY =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

let cloudinary = null;
if (HAS_CLOUDINARY) {
  // Lazy-require so dev without creds doesn't crash at import time.
  const { v2: cloudinaryV2 } = await import("cloudinary");
  cloudinaryV2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  cloudinary = cloudinaryV2;
  console.log("☁️  Cloudinary storage enabled");
} else {
  console.log("💾 Local disk storage enabled (set CLOUDINARY_* for prod)");
}

/**
 * Upload a single file buffer to Cloudinary under a folder (audio | covers).
 * Audio files use resource_type "video" (Cloudinary treats audio this way
 * for raw streaming); covers use "image".
 */
async function uploadToCloudinary(file, folder) {
  const resourceType = folder === "covers" ? "image" : "video";

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `pmi-audiobook/${folder}`,
        resource_type: resourceType,
        // Keep the original name readable in the media library.
        public_id: `${Date.now()}-${path
          .parse(file.originalname)
          .name.replace(/\s+/g, "-")
          .slice(0, 40)}`,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result.secure_url,
          filename: result.public_id,
          resourceType,
          bytes: result.bytes,
          mimetype: file.mimetype,
        });
      }
    );
    uploadStream.end(file.buffer);
  });
}

/**
 * Local disk fallback. Writes to backend/uploads/<folder>/<timestamp-name>.
 * Returns a path served by the /uploads static mount in dev.
 */
function uploadToDisk(file, folder) {
  const uploadDir = path.join(__dirname, "..", "uploads", folder);
  fs.mkdirSync(uploadDir, { recursive: true });

  const ext = path.extname(file.originalname) || "";
  const base = path
    .basename(file.originalname, ext)
    .replace(/\s+/g, "-")
    .slice(0, 40);
  const filename = `${Date.now()}-${base}${ext}`;
  const fullPath = path.join(uploadDir, filename);

  fs.writeFileSync(fullPath, file.buffer);

  return {
    url: `/uploads/${folder}/${filename}`, // dev-relative; served by express.static
    filename: `${folder}/${filename}`,
    resourceType: folder === "covers" ? "image" : "video",
    bytes: file.size,
    mimetype: file.mimetype,
  };
}

/**
 * Public API: store a file. `file` is a Multer file object (memoryStorage).
 * Returns { url, filename, resourceType, bytes, mimetype }.
 */
export async function storeFile(file, folder) {
  if (!file) throw new Error("No file provided to storeFile");
  if (!["audio", "covers"].includes(folder)) {
    throw new Error(`Invalid storage folder: ${folder}`);
  }
  return HAS_CLOUDINARY
    ? uploadToCloudinary(file, folder)
    : uploadToDisk(file, folder);
}

export const isCloudStorage = () => HAS_CLOUDINARY;
