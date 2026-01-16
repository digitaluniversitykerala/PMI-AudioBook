import path from "path";
import fs from "fs";

export const uploadAudio = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }
    if (!req.file) {
      return res.status(400).json({ error: "No audio file uploaded" });
    }
    const fileName = path.basename(req.file.path);
    const relativePath = `audio/${fileName}`;
    res.json({
      message: "Audio uploaded successfully",
      file: {
        filename: relativePath,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      }
    });
  } catch (err) {
    next(err);
  }
};

export const uploadCover = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }
    if (!req.file) {
      return res.status(400).json({ error: "No cover image uploaded" });
    }
    const fileName = path.basename(req.file.path);
    const relativePath = `covers/${fileName}`;
    res.json({
      message: "Cover uploaded successfully",
      file: {
        filename: relativePath,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      }
    });
  } catch (err) {
    next(err);
  }
};
