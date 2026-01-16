import * as BookService from '../services/bookService.js';

export const getBooks = async (req, res, next) => {
    try {
        const books = await BookService.getAllBooks();
        res.json(books);
    } catch (err) {
        next(err);
    }
};

export const getBookById = async (req, res, next) => {
    try {
        const book = await BookService.getBookById(req.params.id);
        res.json(book);
    } catch (err) {
        if (err.message === "Book not found") {
            return res.status(404).json({ error: err.message });
        }
        next(err);
    }
};

export const createBook = async (req, res, next) => {
    try {
        if (!req.user || req.user.role !== "admin") {
            return res.status(403).json({ error: "Admin access required" });
        }
        const book = await BookService.createBook(req.body);
        res.status(201).json(book);
    } catch (err) {
        next(err);
    }
};

export const updateBook = async (req, res, next) => {
    try {
        if (!req.user || req.user.role !== "admin") {
            return res.status(403).json({ error: "Admin access required" });
        }
        const book = await BookService.updateBook(req.params.id, req.body);
        res.json(book);
    } catch (err) {
        if (err.message === "Book not found") {
            return res.status(404).json({ error: err.message });
        }
        next(err);
    }
};

export const deleteBook = async (req, res, next) => {
    try {
        if (!req.user || req.user.role !== "admin") {
            return res.status(403).json({ error: "Admin access required" });
        }
        await BookService.deleteBook(req.params.id);
        res.json({ message: "Book deleted successfully" });
    } catch (err) {
        if (err.message === "Book not found") {
            return res.status(404).json({ error: err.message });
        }
        next(err);
    }
};

export const getFeaturedBooks = async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const books = await BookService.getFeaturedBooks(limit);
        res.json(books);
    } catch (err) {
        next(err);
    }
};

export const getNewReleases = async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const books = await BookService.getNewReleases(limit);
        res.json(books);
    } catch (err) {
        next(err);
    }
};
