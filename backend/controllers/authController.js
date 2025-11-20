import { User, Genre, Author, Book, UserProgress, Review, Playlist } from "../models/User.js"; // Imports all models
import bcrypt from "bcryptjs"; // Imports bcrypt for hashing passwords
import jwt from "jsonwebtoken"; // Imports JWT for generating authentication tokens
import crypto from "crypto"; // For generating secure random tokens
import { sendPasswordResetEmail, sendWelcomeEmail } from "../services/emailService.js";
import fs from "fs";
import path from "path";
import multer from "multer";

// Helper function to generate access and refresh tokens
const generateTokens = (userId, email) => {
  const accessToken = jwt.sign(
    { id: userId, email },
    process.env.JWT_SECRET,
    { expiresIn: "15m" } // Short-lived access token
  );
  
  const refreshToken = jwt.sign(
    { id: userId, email },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: "7d" } // Long-lived refresh token
  );
  
  return { accessToken, refreshToken };
};

// Handles user signup requests
export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body; // Extracts user data from request body

    // Checks if a user with the given email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "Email already in use" });

    // Hashes the password securely before saving to database
    const hashedPassword = await bcrypt.hash(password, 10);

    // Creates a new user document and saves it in MongoDB
    const newUser = new User({ name, email, password: hashedPassword });
    
    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(newUser._id, email);
    newUser.refreshToken = refreshToken;
    newUser.lastLogin = new Date();
    
    await newUser.save();
    
    // Send welcome email (don't wait for it)
    sendWelcomeEmail(email, name).catch(err => 
      console.error("Failed to send welcome email:", err)
    );

    // Sends success response with tokens
    res.status(201).json({ 
      message: "User created successfully",
      token: accessToken,
      refreshToken,
      user: { 
        id: newUser._id, 
        name: newUser.name, 
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (err) {
    console.error("Signup error:", err);
    // Temporarily expose more detail to help debug the 500 error (adjust for production)
    const message = err?.message || err?.stack || JSON.stringify(err) || "Server error";
    res.status(500).json({ error: message });
  }
};

// Handles user login requests
export const login = async (req, res) => {
  try {
    const { email, password } = req.body; // Extracts login credentials from request

    // Finds user by email in MongoDB
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found" });

    // Compares provided password with hashed password in database
    // If password isn't a bcrypt hash (e.g. Google account), treat as invalid credentials
    const isHashed = typeof user.password === 'string' && user.password.startsWith('$2');
    if (!isHashed) {
      return res.status(400).json({ error: "Invalid credentials" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id, user.email);
    
    // Update user's refresh token and last login
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    // Sends tokens and user info to frontend
    res.json({
      token: accessToken,
      refreshToken,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error("Login error:", err); // Logs errors for debugging
    res.status(500).json({ error: err.message || String(err) || "Server error" }); // Sends detailed error for debugging
  }
};

// Handle forgot password request
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists or not for security
      return res.json({ 
        message: "If an account exists with this email, you will receive password reset instructions." 
      });
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // Save hashed token to user with expiry
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();
    
    // Send email with reset token
    try {
      await sendPasswordResetEmail(email, resetToken);
    } catch (emailError) {
      console.error("Email send error:", emailError);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      return res.status(500).json({ error: "Failed to send reset email. Please try again." });
    }
    
    res.json({ 
      message: "If an account exists with this email, you will receive password reset instructions." 
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Handle password reset
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    
    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }
    
    // Hash new password and save
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    
    // Generate new tokens for automatic login
    const { accessToken, refreshToken } = generateTokens(user._id, user.email);
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();
    
    res.json({ 
      message: "Password reset successful",
      token: accessToken,
      refreshToken,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Refresh access token using refresh token
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({ error: "Refresh token required" });
    }
    
    // Find user with this refresh token
    const user = await User.findOne({ refreshToken });
    if (!user) {
      return res.status(403).json({ error: "Invalid refresh token" });
    }
    
    // Verify the refresh token
    try {
      jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    } catch (err) {
      user.refreshToken = undefined;
      await user.save();
      return res.status(403).json({ error: "Invalid refresh token" });
    }
    
    // Generate new tokens
    const tokens = generateTokens(user._id, user.email);
    user.refreshToken = tokens.refreshToken;
    await user.save();
    
    res.json({
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken
    });
  } catch (err) {
    console.error("Refresh token error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Logout user
export const logout = async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (userId) {
      // Clear refresh token from database
      await User.findByIdAndUpdate(userId, { refreshToken: undefined });
    }
    
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Multer setup for file uploads
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
  if (file.fieldname === "audioFile") {
    if (file.mimetype.startsWith("audio/")) {
      cb(null, true);
    } else {
      cb(new Error("Only audio files are allowed"));
    }
  } else if (file.fieldname === "coverImage") {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  } else {
    cb(null, false);
  }
};

export const upload = multer({ storage, fileFilter });

export const uploadAudio = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No audio file uploaded" });
    }
    // Store web-friendly path (forward slashes) regardless of OS
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
    console.error("Upload audio error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const uploadCover = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No cover image uploaded" });
    }
    // Store web-friendly path (forward slashes) regardless of OS
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
    console.error("Upload cover error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const serveFile = async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join("uploads", filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }
    res.sendFile(path.resolve(filePath));
  } catch (err) {
    console.error("Serve file error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ==================== USER PROGRESS CONTROLLERS ====================

// Get or create user progress for a book
export const getUserProgress = async (req, res) => {
  try {
    const { bookId } = req.params;
    const userId = req.userId;
    
    let progress = await UserProgress.findOne({ user: userId, book: bookId })
      .populate('book', 'title duration coverImage authors')
      .populate('book.authors', 'name');
    
    if (!progress) {
      progress = new UserProgress({
        user: userId,
        book: bookId,
        currentPosition: 0,
        totalPlayed: 0,
        isCompleted: false,
        lastPlayedAt: new Date()
      });
      await progress.save();
      
      progress = await UserProgress.findById(progress._id)
        .populate('book', 'title duration coverImage authors')
        .populate('book.authors', 'name');
    }
    
    res.json(progress);
  } catch (err) {
    console.error("Get user progress error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Update user progress
export const updateUserProgress = async (req, res) => {
  try {
    const { bookId } = req.params;
    const userId = req.userId;
    const { currentPosition, totalPlayed, playbackSpeed } = req.body;
    
    const progress = await UserProgress.findOne({ user: userId, book: bookId });
    
    if (!progress) {
      return res.status(404).json({ error: "Progress not found" });
    }
    
    if (currentPosition !== undefined) progress.currentPosition = currentPosition;
    if (totalPlayed !== undefined) progress.totalPlayed = totalPlayed;
    if (playbackSpeed !== undefined) progress.playbackSpeed = playbackSpeed;
    progress.lastPlayedAt = new Date();
    
    const book = await Book.findById(bookId);
    if (book && currentPosition >= (book.duration * 60 * 0.9)) {
      progress.isCompleted = true;
      progress.completionDate = new Date();
      await User.findByIdAndUpdate(userId, {
        $inc: { 'stats.booksCompleted': 1 }
      });
    }
    
    await progress.save();
    res.json(progress);
  } catch (err) {
    console.error("Update user progress error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ==================== USER DASHBOARD CONTROLLERS ====================

// Get user library
export const getUserLibrary = async (req, res) => {
  try {
    const userId = req.userId;
    const { page = 1, limit = 20, status } = req.query;
    const skip = (page - 1) * limit;
    
    let filter = { user: userId };
    if (status === 'completed') {
      filter.isCompleted = true;
    } else if (status === 'in-progress') {
      filter.isCompleted = false;
      filter.currentPosition = { $gt: 0 };
    }
    
    const progress = await UserProgress.find(filter)
      .populate('book', 'title coverImage duration authors narrator rating')
      .populate('book.authors', 'name')
      .sort({ lastPlayedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await UserProgress.countDocuments(filter);
    
    res.json({
      books: progress,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error("Get user library error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Get user stats
export const getUserStats = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId).select('stats preferences subscription');
    
    const totalBooks = await UserProgress.countDocuments({ user: userId });
    const completedBooks = await UserProgress.countDocuments({ user: userId, isCompleted: true });
    const inProgressBooks = await UserProgress.countDocuments({ user: userId, isCompleted: false, currentPosition: { $gt: 0 } });
    
    const progressData = await UserProgress.find({ user: userId });
    const totalListeningTime = progressData.reduce((total, progress) => total + progress.totalPlayed, 0);
    
    const stats = {
      totalBooks,
      completedBooks,
      inProgressBooks,
      totalListeningTime: Math.round(totalListeningTime / 60),
      userStats: user.stats,
      preferences: user.preferences,
      subscription: user.subscription
    };
    
    res.json(stats);
  } catch (err) {
    console.error("Get user stats error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Get recommendations
export const getRecommendations = async (req, res) => {
  try {
    const userId = req.userId;
    const limit = parseInt(req.query.limit) || 10;
    
    const user = await User.findById(userId).populate('preferences.preferredGenres');
    const preferredGenres = user.preferences.preferredGenres.map(genre => genre._id);
    
    const userProgress = await UserProgress.find({ user: userId }).select('book');
    const listenedBookIds = userProgress.map(progress => progress.book);
    
    let recommendedBooks = [];
    
    if (preferredGenres.length > 0) {
      recommendedBooks = await Book.find({
        genres: { $in: preferredGenres },
        _id: { $nin: listenedBookIds },
        isActive: true
      })
        .populate('authors', 'name photo')
        .populate('genres', 'name color')
        .sort({ rating: -1, totalPlays: -1 })
        .limit(limit);
    }
    
    if (recommendedBooks.length < limit) {
      const additionalLimit = limit - recommendedBooks.length;
      const popularBooks = await Book.find({
        _id: { $nin: listenedBookIds.concat(recommendedBooks.map(book => book._id)) },
        isActive: true
      })
        .populate('authors', 'name photo')
        .populate('genres', 'name color')
        .sort({ totalPlays: -1, rating: -1 })
        .limit(additionalLimit);
      
      recommendedBooks = recommendedBooks.concat(popularBooks);
    }
    
    res.json(recommendedBooks);
  } catch (err) {
    console.error("Get recommendations error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Book controllers
export const getBooks = async (req, res) => {
  try {
    const books = await Book.find({ isActive: true })
      .populate("authors", "name")
      .populate("genres", "name color")
      .sort({ createdAt: -1 });
    res.json(books);
  } catch (err) {
    console.error("Get books error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id)
      .populate("authors", "name bio photo")
      .populate("genres", "name color");
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }
    res.json(book);
  } catch (err) {
    console.error("Get book by id error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

const ensureAdmin = (req, res) => {
  if (!req.user || req.user.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return false;
  }
  return true;
};

export const createBook = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;

    let { title, description, authors, genres, narrator, duration, audioFile, coverImage, releaseDate, language } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    duration = duration ? parseInt(duration) : 0;

    const authorNames = Array.isArray(authors) ? authors : (authors || "").split(",").map(a => a.trim()).filter(Boolean);
    const genreNames = Array.isArray(genres) ? genres : (genres || "").split(",").map(g => g.trim()).filter(Boolean);

    const authorIds = [];
    for (const name of authorNames) {
      const doc = await Author.findOneAndUpdate(
        { name },
        { name },
        { upsert: true, new: true }
      );
      authorIds.push(doc._id);
    }

    const genreIds = [];
    for (const name of genreNames) {
      const doc = await Genre.findOneAndUpdate(
        { name },
        { name },
        { upsert: true, new: true }
      );
      genreIds.push(doc._id);
    }

    const book = new Book({
      title,
      description,
      authors: authorIds,
      genres: genreIds,
      narrator,
      duration,
      audioFile,
      coverImage,
      releaseDate: releaseDate ? new Date(releaseDate) : undefined,
      language: language || "ml",
      isActive: true
    });

    await book.save();

    const populated = await Book.findById(book._id)
      .populate("authors", "name")
      .populate("genres", "name color");

    res.status(201).json(populated);
  } catch (err) {
    console.error("Create book error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const updateBook = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const updates = { ...req.body };

    if (updates.duration) {
      updates.duration = parseInt(updates.duration);
    }

    if (updates.authors) {
      const authorNames = Array.isArray(updates.authors)
        ? updates.authors
        : updates.authors.split(",").map(a => a.trim()).filter(Boolean);
      const authorIds = [];
      for (const name of authorNames) {
        const doc = await Author.findOneAndUpdate(
          { name },
          { name },
          { upsert: true, new: true }
        );
        authorIds.push(doc._id);
      }
      updates.authors = authorIds;
    }

    if (updates.genres) {
      const genreNames = Array.isArray(updates.genres)
        ? updates.genres
        : updates.genres.split(",").map(g => g.trim()).filter(Boolean);
      const genreIds = [];
      for (const name of genreNames) {
        const doc = await Genre.findOneAndUpdate(
          { name },
          { name },
          { upsert: true, new: true }
        );
        genreIds.push(doc._id);
      }
      updates.genres = genreIds;
    }

    const book = await Book.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate("authors", "name")
      .populate("genres", "name color");

    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    res.json(book);
  } catch (err) {
    console.error("Update book error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const deleteBook = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }
    res.json({ message: "Book deleted successfully" });
  } catch (err) {
    console.error("Delete book error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const getFeaturedBooks = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const books = await Book.find({ isActive: true })
      .populate("authors", "name")
      .populate("genres", "name color")
      .sort({ rating: -1, totalPlays: -1 })
      .limit(limit);
    res.json(books);
  } catch (err) {
    console.error("Get featured books error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const getNewReleases = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const books = await Book.find({ isActive: true })
      .populate("authors", "name")
      .populate("genres", "name color")
      .sort({ releaseDate: -1, createdAt: -1 })
      .limit(limit);
    res.json(books);
  } catch (err) {
    console.error("Get new releases error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
