import express from "express";
import { signup, login, forgotPassword, resetPassword, refreshToken, logout } from "../controllers/authController.js";
import { uploadAudio, uploadCover } from "../controllers/uploadController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/upload.js";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const router = express.Router();

// Google OAuth setup (Keeping inline for now as it uses specific libs, can be refactored later)
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

router.post("/google", async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'No token provided' });

    let payload;
    try {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (idTokenError) {
      try {
        // Fallback: Try using it as an access token
        const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${token}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch user info from Google: ${response.statusText}`);
        }
        payload = await response.json();
      } catch (accessTokenError) {
        console.error("Google Auth failed. ID Token error:", idTokenError.message);
        console.error("Access Token error:", accessTokenError.message);
        return res.status(401).json({ 
            error: 'Invalid token', 
            details: 'Failed to verify as both ID Token and Access Token',
            idTokenError: idTokenError.message,
            accessTokenError: accessTokenError.message
        });
      }
    }

    if (!payload.email) return res.status(400).json({ error: 'No email found in Google profile' });

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
    next(err);
  }
});

// Auth Routes
router.post("/signup", signup);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);

// File upload routes
router.post("/upload/audio", verifyToken, upload.single('audioFile'), uploadAudio);
router.post("/upload/cover", verifyToken, upload.single('coverImage'), uploadCover);

export default router;
