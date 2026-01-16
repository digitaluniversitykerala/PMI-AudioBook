// server.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from 'path';
import helmet from "helmet";
import morgan from "morgan";
import { fileURLToPath } from 'url';

// Routes
import authRoutes from "./routes/auth.js";
import bookRoutes from "./routes/books.js";
import userRoutes from "./routes/users.js";

// Middleware
import { errorHandler } from "./middleware/errorMiddleware.js";

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Security & Logging
app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://*.google.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "blob:", "http://localhost:5000", "https://*.google.com", "https://*.googleusercontent.com"],
      mediaSrc: ["'self'", "blob:", "http://localhost:5000"],
      connectSrc: ["'self'", "http://localhost:5000", "https://*.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
}));
app.use(morgan("dev"));

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes); // New dedicated route
app.use("/api/users", userRoutes); // New dedicated route

// Deprecated/Legacy Admin route support (optional, can remove if frontend is updated)
// app.use("/api/admin", adminRoutes); 

// Test route
app.get("/", (req, res) => res.send("🚀 Server is running"));

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend/dist/index.html'));
  });
}

// Global Error Handler
app.use(errorHandler);

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
