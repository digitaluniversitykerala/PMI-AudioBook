import * as UserService from '../services/userService.js';

export const getUserProgress = async (req, res, next) => {
    try {
        const progress = await UserService.getUserProgress(req.userId, req.params.bookId);
        res.json(progress);
    } catch (err) {
        next(err);
    }
};

export const updateUserProgress = async (req, res, next) => {
    try {
        const progress = await UserService.updateUserProgress(req.userId, req.params.bookId, req.body);
        res.json(progress);
    } catch (err) {
        if (err.message === "Progress not found") {
            return res.status(404).json({ error: err.message });
        }
        next(err);
    }
};

export const getUserLibrary = async (req, res, next) => {
    try {
        const library = await UserService.getUserLibrary(req.userId, req.query);
        res.json(library);
    } catch (err) {
        next(err);
    }
};

export const getUserStats = async (req, res, next) => {
    try {
        const stats = await UserService.getUserStats(req.userId);
        res.json(stats);
    } catch (err) {
        next(err);
    }
};

export const getRecommendations = async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const recommendations = await UserService.getRecommendations(req.userId, limit);
        res.json(recommendations);
    } catch (err) {
        next(err);
    }
};
