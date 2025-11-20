import express from "express";
import { 
  signup, login, forgotPassword, resetPassword, refreshToken, logout,
  getBooks, getBookById, createBook, updateBook, deleteBook, getFeaturedBooks, getNewReleases,
  getUserProgress, updateUserProgress, getUserLibrary, getUserStats, getRecommendations,
  upload, uploadAudio, uploadCover, serveFile
} from "../controllers/authController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const router = express.Router();

// Google OAuth setup
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

// Google login
router.post("/google", async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'No token provided' });
    }

    let payload;
    
    try {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (idTokenError) {
      try {
        const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${token}`);
        if (!response.ok) {
          throw new Error('Failed to fetch user info from Google');
        }
        payload = await response.json();
      } catch (accessTokenError) {
        return res.status(401).json({ error: 'Invalid token' });
      }
    }

    if (!payload.email) {
      return res.status(400).json({ error: 'No email found in Google profile' });
    }

    let user = await User.findOne({ email: payload.email });

    if (!user) {
      const hashedDummy = await bcrypt.hash("google-oauth", 10);
      user = await User.create({
        name: payload.name || payload.email.split('@')[0],
        email: payload.email,
        password: hashedDummy,
        profilePicture: payload.picture || ''
      });
    }

    const jwtToken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      success: true,
      token: jwtToken,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error(err);
    res.status(401).json({ success: false, message: "Google login failed" });
  }
});

// Auth routes
router.post("/signup", signup);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);

// File upload routes
router.post("/upload/audio", verifyToken, upload.single('audioFile'), uploadAudio);
router.post("/upload/cover", verifyToken, upload.single('coverImage'), uploadCover);
router.get("/files/:filename", serveFile);

// Book routes
router.get("/books", getBooks);
router.get("/books/featured", getFeaturedBooks);
router.get("/books/new-releases", getNewReleases);
router.get("/books/:id", getBookById);
router.post("/books", verifyToken, createBook);
router.put("/books/:id", verifyToken, updateBook);
router.delete("/books/:id", verifyToken, deleteBook);

// User progress routes
router.get("/progress/:bookId", verifyToken, getUserProgress);
router.put("/progress/:bookId", verifyToken, updateUserProgress);

// User dashboard routes
router.get("/user/library", verifyToken, getUserLibrary);
router.get("/user/stats", verifyToken, getUserStats);
router.get("/user/recommendations", verifyToken, getRecommendations);

export default router;
