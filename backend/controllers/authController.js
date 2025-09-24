import User from "../models/User.js"; // Imports User model to interact with MongoDB
import bcrypt from "bcryptjs"; // Imports bcrypt for hashing passwords
import jwt from "jsonwebtoken"; // Imports JWT for generating authentication tokens
import crypto from "crypto"; // For generating secure random tokens
import { sendPasswordResetEmail, sendWelcomeEmail } from "../services/emailService.js";

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
        email: newUser.email 
      }
    });
  } catch (err) {
    console.error(err); // Logs server errors for debugging
    res.status(500).json({ error: "Server error" }); // Sends generic server error to frontend
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
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error(err); // Logs errors for debugging
    res.status(500).json({ error: "Server error" }); // Sends generic server error response
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
      user: { id: user._id, name: user.name, email: user.email }
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
