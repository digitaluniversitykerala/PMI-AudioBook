import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Book from '../models/Book.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    const filetypes = /mp3|wav|m4a|aac|ogg/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed!'));
    }
  }
});

const uploadImage = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for images
  },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ message: 'Access denied. Admin only.' });
};

// Admin dashboard route
router.get('/', verifyToken, isAdmin, (req, res) => {
  res.json({ 
    message: 'Admin dashboard',
    user: req.user
  });
});

// Upload audio file
router.post('/upload/audio', verifyToken, isAdmin, upload.single('audioFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No audio file uploaded' });
    }
    
    const filePath = req.file.path.replace(/\\/g, '/'); // Normalize path for Windows
    res.json({
      message: 'Audio uploaded successfully',
      file: {
        filename: req.file.filename,
        path: filePath,
        size: req.file.size
      }
    });
  } catch (error) {
    console.error('Error uploading audio:', error);
    res.status(500).json({ message: 'Error uploading audio', error: error.message });
  }
});

// Upload cover image
router.post('/upload/image', verifyToken, isAdmin, uploadImage.single('coverImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file uploaded' });
    }
    
    const filePath = req.file.path.replace(/\\/g, '/'); // Normalize path for Windows
    res.json({
      message: 'Image uploaded successfully',
      file: {
        filename: req.file.filename,
        path: filePath,
        size: req.file.size
      }
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ message: 'Error uploading image', error: error.message });
  }
});

// Add new audiobook
router.post('/books', verifyToken, isAdmin, async (req, res) => {
  try {
    const { title, description, duration, narrator, authors, genres, audioFile, coverImage } = req.body;
    
    const newBook = new Book({
      title,
      description,
      duration: parseInt(duration, 10),
      narrator,
      authors: authors ? authors.split(',').map(author => author.trim()) : [],
      genres: genres ? genres.split(',').map(genre => genre.trim()) : [],
      audioFile,
      coverImage: coverImage || null,
      uploadedBy: req.user.id
    });
    
    await newBook.save();
    
    res.status(201).json({
      message: 'Audiobook added successfully',
      book: newBook
    });
  } catch (error) {
    console.error('Error adding audiobook:', error);
    res.status(500).json({ message: 'Error adding audiobook', error: error.message });
  }
});

export default router;
