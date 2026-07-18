// middleware/upload.js
// Multer config. Uses memoryStorage so the same in-memory buffer can be
// streamed to Cloudinary (prod) or written to disk (dev) by storageService.
import multer from "multer";
import path from "path";

const fileFilter = (req, file, cb) => {
  const fileExt = path.extname(file.originalname).toLowerCase();

  if (file.fieldname === "audioFile") {
    const allowedMimeTypes = [
      "audio/",
      "video/mpeg",
      "video/mp4",
      "video/x-m4v",
      "video/quicktime",
      "application/octet-stream",
      "application/x-mpegurl",
      "application/vnd.apple.mpegurl",
    ];
    const allowedExtensions = [
      ".mp3", ".m4a", ".wav", ".aac", ".ogg", ".flac", ".mpeg", ".mp4", ".mov", ".m4v",
    ];

    const isAllowedMime = allowedMimeTypes.some((mime) =>
      file.mimetype.startsWith(mime)
    );
    const isAllowedExt = allowedExtensions.includes(fileExt);

    if (isAllowedMime || isAllowedExt) return cb(null, true);
    return cb(
      new Error(
        `Audio type not allowed. MIME: ${file.mimetype}, Ext: ${fileExt}.`
      )
    );
  }

  if (file.fieldname === "coverImage") {
    if (file.mimetype.startsWith("image/")) return cb(null, true);
    return cb(new Error("Only image files are allowed for covers."));
  }

  return cb(null, false);
};

// 50 MB cap — Vercel function limit. For larger audio, raise on a dedicated host.
export const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 },
});
