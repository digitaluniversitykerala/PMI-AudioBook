import express from "express";
import { 
    getUserProgress, updateUserProgress, getUserLibrary, 
    getUserStats, getRecommendations 
} from "../controllers/userController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(verifyToken); // Apply to all routes

router.get("/library", getUserLibrary);
router.get("/stats", getUserStats);
router.get("/recommendations", getRecommendations);

// Progress
router.get("/progress/:bookId", getUserProgress);
router.put("/progress/:bookId", updateUserProgress);

export default router;
