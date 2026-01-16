import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Middleware to verify JWT tokens
export const verifyToken = async (req, res, next) => {
  const authHeader = req.header("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.replace("Bearer ", "") : authHeader;
  
  if (!token) {
    console.warn("verifyToken failed: No token provided in header:", req.headers);
    return res.status(401).json({ error: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    req.userEmail = decoded.email;
    
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      console.warn(`verifyToken failed: User ${decoded.id} not found in DB`);
      return res.status(401).json({ error: "User not found" });
    }
    
    req.user = user;
    next();
  } catch (err) {
    console.error("Token verification error details:", err.message);
    
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }
    
    return res.status(401).json({ error: "Token is not valid" });
  }
};

// Middleware to verify refresh token
export const verifyRefreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({ error: "No refresh token provided" });
    }

    // Find user with this refresh token
    const user = await User.findOne({ refreshToken });
    if (!user) {
      return res.status(403).json({ error: "Invalid refresh token" });
    }

    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    
    req.userId = decoded.id;
    req.user = user;
    next();
  } catch (err) {
    console.error("Refresh token verification error:", err);
    return res.status(403).json({ error: "Invalid refresh token" });
  }
};