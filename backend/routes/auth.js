import express from "express";
import { signup, login } from "../controllers/authController.js"; // Imports signup/login logic
import { OAuth2Client } from "google-auth-library"; // Imports Google OAuth2 client
import User from "../models/User.js"; // Imports User model
import jwt from "jsonwebtoken"; // Imports JWT for session token generation

const router = express.Router(); // Creates router instance

// Initializes Google OAuth2 client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Handles Google login requests
router.post("/google", async (req, res) => {
  try {
    const { token } = req.body; // Receives Google ID token from frontend

    // Verifies token with Google
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload(); // Extracts user info (name, email, picture)
    console.log("Google user:", payload);

    // Checks if user exists in database
    let user = await User.findOne({ email: payload.email });

    // If user does not exist, creates new user with dummy password
    if (!user) {
      user = await User.create({
        name: payload.name,
        email: payload.email,
        password: "google-oauth", // dummy password
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

// Exports router for use in server.js
export default router;
