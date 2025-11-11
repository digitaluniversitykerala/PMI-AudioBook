import express from "express";
import { signup, login, forgotPassword, resetPassword, refreshToken, logout } from "../controllers/authController.js"; // Imports auth logic
import { OAuth2Client } from "google-auth-library"; // Imports Google OAuth2 client
import User from "../models/User.js"; // Imports User model
import jwt from "jsonwebtoken"; // Imports JWT for session token generation

const router = express.Router(); // Creates router instance

// Initializes Google OAuth2 client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Handles Google login requests
router.post("/google", async (req, res) => {
  try {
    const { token } = req.body; // Receives Google token from frontend
    
    if (!token) {
      return res.status(400).json({ error: 'No token provided' });
    }

    let payload;
    
    try {
      // First try to verify as ID token
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (idTokenError) {
      console.log('ID token verification failed, trying as access token:', idTokenError);
      
      // If ID token verification fails, try to get user info using the access token
      try {
        const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${token}`);
        if (!response.ok) {
          throw new Error('Failed to fetch user info from Google');
        }
        payload = await response.json();
      } catch (accessTokenError) {
        console.error('Access token verification failed:', accessTokenError);
        return res.status(401).json({ error: 'Invalid token' });
      }
    }

    console.log("Google user:", payload);

    if (!payload.email) {
      return res.status(400).json({ error: 'No email found in Google profile' });
    }

    // Checks if user exists in database
    let user = await User.findOne({ email: payload.email });

    // If user does not exist, creates new user with dummy password
    if (!user) {
      user = await User.create({
        name: payload.name || payload.email.split('@')[0],
        email: payload.email,
        password: "google-oauth", // dummy password
        profilePicture: payload.picture || ''
      });
    }

    // Generates JWT for authenticated session
    const jwtToken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" } // Token expires in 1 hour
    );

    // Sends token and user info to frontend
    res.json({
      success: true,
      token: jwtToken,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error(err); // Logs error for debugging
    res.status(401).json({ success: false, message: "Google login failed" });
  }
});

// Handles normal signup and login routes
router.post("/signup", signup);
router.post("/login", login);

// Password reset routes
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Token management routes
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);

// Exports router for use in server.js
export default router;
