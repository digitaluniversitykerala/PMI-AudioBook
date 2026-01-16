import multer from "multer";
import path from "path";
import fs from "fs";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const subdir = file.fieldname === "audioFile" ? "audio" : "covers";
    const uploadDir = path.join("uploads", subdir);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || "";
    const base = path.basename(file.originalname, ext).replace(/\s+/g, "-");
    cb(null, `${Date.now()}-${base}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const fileExt = path.extname(file.originalname).toLowerCase();
  console.log(`[Multer] Processing: ${file.originalname} | MIME: ${file.mimetype} | Ext: ${fileExt}`);
  
  if (file.fieldname === "audioFile") {
    const allowedMimeTypes = [
      "audio/",
      "video/mpeg",
      "video/mp4",
      "video/x-m4v",
      "video/quicktime",
      "application/octet-stream",
      "application/x-mpegurl",
      "application/vnd.apple.mpegurl"
    ];
    
    // Common audio/video-container extensions
    const allowedExtensions = [".mp3", ".m4a", ".wav", ".aac", ".ogg", ".flac", ".mpeg", ".mp4", ".mov", ".m4v"];

    const isAllowedMime = allowedMimeTypes.some(mime => file.mimetype.startsWith(mime));
    const isAllowedExt = allowedExtensions.includes(fileExt);

    if (isAllowedMime || isAllowedExt) {
      console.log(`[Multer] Success: ${file.originalname} accepted.`);
      cb(null, true);
    } else {
      const errorMsg = `File type not allowed. MIME: ${file.mimetype}, Ext: ${fileExt}. Please provide a valid audio file.`;
      console.error(`[Multer] Error: ${errorMsg}`);
      cb(new Error(errorMsg));
    }
  } else if (file.fieldname === "coverImage") {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed. Please upload a valid image (JPG, PNG, etc)."));
    }
  } else {
    cb(null, false);
  }
};

export const upload = multer({ storage, fileFilter });
