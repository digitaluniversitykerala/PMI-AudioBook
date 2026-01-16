import Book from "../models/Book.js";
import { Author, Genre } from "../models/User.js";

// Helper to process authors and genres
const processMetadata = async (names, Model) => {
    const processedIds = [];
    const list = Array.isArray(names) ? names : (names || "").split(",").map(x => x.trim()).filter(Boolean);
    
    for (const name of list) {
        const doc = await Model.findOneAndUpdate(
            { name },
            { name },
            { upsert: true, new: true }
        );
        processedIds.push(doc._id);
    }
    return processedIds;
};

export const getAllBooks = async () => {
    return await Book.find({ isActive: true })
        .populate("authors", "name")
        .populate("genres", "name color")
        .sort({ createdAt: -1 });
};

export const getBookById = async (id) => {
    const book = await Book.findById(id)
        .populate("authors", "name bio photo")
        .populate("genres", "name color");
    if (!book) throw new Error("Book not found");
    return book;
};

export const createBook = async (data) => {
    const authorIds = await processMetadata(data.authors, Author);
    const genreIds = await processMetadata(data.genres, Genre);

    // Initial mapping of single file to chapters if no chapters provided
    let chapters = data.chapters || [];
    if (chapters.length === 0 && data.audioFile) {
        chapters.push({
            title: "Chapter 1",
            audioFile: data.audioFile,
            duration: data.duration ? parseInt(data.duration) : 0
        });
    }

    const book = new Book({
        ...data,
        authors: authorIds,
        genres: genreIds,
        chapters: chapters,
        duration: data.duration ? parseInt(data.duration) : 0,
        releaseDate: data.releaseDate ? new Date(data.releaseDate) : undefined,
        language: data.language || "ml",
        isActive: true
    });

    await book.save();
    return await Book.findById(book._id)
        .populate("authors", "name")
        .populate("genres", "name color");
};

export const updateBook = async (id, data) => {
    const updates = { ...data };

    if (updates.duration) updates.duration = parseInt(updates.duration);
    if (updates.authors) updates.authors = await processMetadata(updates.authors, Author);
    if (updates.genres) updates.genres = await processMetadata(updates.genres, Genre);

    const book = await Book.findByIdAndUpdate(id, updates, { new: true })
        .populate("authors", "name")
        .populate("genres", "name color");
    
    if (!book) throw new Error("Book not found");
    return book;
};

export const deleteBook = async (id) => {
    const book = await Book.findByIdAndDelete(id);
    if (!book) throw new Error("Book not found");
    return book;
};

export const getFeaturedBooks = async (limit = 10) => {
    return await Book.find({ isActive: true })
        .populate("authors", "name")
        .populate("genres", "name color")
        .sort({ rating: -1, totalPlays: -1 })
        .limit(limit);
};

export const getNewReleases = async (limit = 10) => {
    return await Book.find({ isActive: true })
        .populate("authors", "name")
        .populate("genres", "name color")
        .sort({ releaseDate: -1, createdAt: -1 })
        .limit(limit);
};
