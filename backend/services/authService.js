import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import User from "../models/User.js";
import { sendPasswordResetEmail, sendWelcomeEmail } from "./emailService.js";

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

export const signupUser = async ({ name, email, password }) => {
    const existingUser = await User.findOne({ email });
    if (existingUser) throw new Error("Email already in use");

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });

    const { accessToken, refreshToken } = generateTokens(newUser._id, email);
    newUser.refreshToken = refreshToken;
    newUser.lastLogin = new Date();

    await newUser.save();
    
    // Fire and forget email
    sendWelcomeEmail(email, name).catch(console.error);

    return { 
        user: newUser,
        accessToken, 
        refreshToken 
    };
};

export const loginUser = async ({ email, password }) => {
    const user = await User.findOne({ email });
    if (!user) throw new Error("User not found");

    const isHashed = typeof user.password === 'string' && user.password.startsWith('$2');
    if (!isHashed) throw new Error("Invalid credentials");
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error("Invalid credentials");

    const { accessToken, refreshToken } = generateTokens(user._id, user.email);
    
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    return { 
        user, 
        accessToken, 
        refreshToken 
    };
};

export const forgotPassword = async (email) => {
    const user = await User.findOne({ email });
    if (!user) return; // Silent return

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    await sendPasswordResetEmail(email, resetToken);
};

export const resetPassword = async (token, newPassword) => {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) throw new Error("Invalid or expired reset token");

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    const { accessToken, refreshToken } = generateTokens(user._id, user.email);
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    
    await user.save();

    return { user, accessToken, refreshToken };
};

export const refreshUserToken = async (token) => {
    const user = await User.findOne({ refreshToken: token });
    if (!user) throw new Error("Invalid refresh token");

    try {
        jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    } catch (err) {
        user.refreshToken = undefined;
        await user.save();
        throw new Error("Invalid refresh token");
    }

    const tokens = generateTokens(user._id, user.email);
    user.refreshToken = tokens.refreshToken;
    await user.save();

    return tokens;
};

export const logoutUser = async (userId) => {
    if (userId) {
        await User.findByIdAndUpdate(userId, { refreshToken: undefined });
    }
};
