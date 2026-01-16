import express from "express";
import { 
    getBooks, getBookById, createBook, updateBook, deleteBook, 
    getFeaturedBooks, getNewReleases 
} from "../controllers/bookController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getBooks);
router.get("/featured", getFeaturedBooks);
router.get("/new-releases", getNewReleases);
router.get("/:id", getBookById);

// Admin protected routes
router.post("/", verifyToken, createBook);
router.put("/:id", verifyToken, updateBook);
router.delete("/:id", verifyToken, deleteBook);

export default router;
