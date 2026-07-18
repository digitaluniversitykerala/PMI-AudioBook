// controllers/uploadController.js
// Accepts a single uploaded file (audio or cover), stores it via the
// storageService (Cloudinary in prod, disk in dev), and returns the URL
// the frontend should use to stream/render the asset.
import { storeFile } from "../services/storageService.js";

const requireAdmin = (req, res) => {
  if (!req.user || req.user.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return true; // handled
  }
  return false;
};

export const uploadAudio = async (req, res, next) => {
  try {
    if (requireAdmin(req, res)) return;
    if (!req.file) return res.status(400).json({ error: "No audio file uploaded" });

    const stored = await storeFile(req.file, "audio");
    res.json({
      message: "Audio uploaded successfully",
      file: {
        url: stored.url,
        filename: stored.filename,
        originalName: req.file.originalname,
        mimetype: stored.mimetype,
        size: stored.bytes,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const uploadCover = async (req, res, next) => {
  try {
    if (requireAdmin(req, res)) return;
    if (!req.file) return res.status(400).json({ error: "No cover image uploaded" });

    const stored = await storeFile(req.file, "covers");
    res.json({
      message: "Cover uploaded successfully",
      file: {
        url: stored.url,
        filename: stored.filename,
        originalName: req.file.originalname,
        mimetype: stored.mimetype,
        size: stored.bytes,
      },
    });
  } catch (err) {
    next(err);
  }
};
