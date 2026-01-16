import { User, UserProgress } from "../models/User.js";
import Book from "../models/Book.js";

export const getUserProgress = async (userId, bookId) => {
    let progress = await UserProgress.findOne({ user: userId, book: bookId })
        .populate('book', 'title duration coverImage authors')
        .populate('book.authors', 'name');
    
    if (!progress) {
        progress = new UserProgress({
            user: userId,
            book: bookId,
            currentChapter: 0,
            currentPosition: 0,
            totalPlayed: 0,
            isCompleted: false,
            lastPlayedAt: new Date()
        });
        await progress.save();
        
        progress = await UserProgress.findById(progress._id)
            .populate('book', 'title duration coverImage authors')
            .populate('book.authors', 'name');
    }
    return progress;
};

export const updateUserProgress = async (userId, bookId, data) => {
    const progress = await UserProgress.findOne({ user: userId, book: bookId });
    if (!progress) throw new Error("Progress not found");

    if (data.currentPosition !== undefined) progress.currentPosition = data.currentPosition;
    if (data.currentChapter !== undefined) progress.currentChapter = data.currentChapter;
    if (data.totalPlayed !== undefined) progress.totalPlayed = data.totalPlayed;
    if (data.playbackSpeed !== undefined) progress.playbackSpeed = data.playbackSpeed;
    progress.lastPlayedAt = new Date();

    const book = await Book.findById(bookId);
    
    // Check completion logic
    // Logic: If last chapter and < 10% remaining
    const isLastChapter = progress.currentChapter === (book.chapters && book.chapters.length > 0 ? book.chapters.length - 1 : 0);
    const chapterDuration = book.chapters && book.chapters[progress.currentChapter] ? book.chapters[progress.currentChapter].duration * 60 : book.duration * 60;
    
    // Simple completion check: if last chapter and near end
    if (isLastChapter && progress.currentPosition >= (chapterDuration * 0.9)) {
        if (!progress.isCompleted) {
             progress.isCompleted = true;
             progress.completionDate = new Date();
             await User.findByIdAndUpdate(userId, { $inc: { 'stats.booksCompleted': 1 } });
        }
    }

    await progress.save();
    return progress;
};

export const getUserLibrary = async (userId, { page = 1, limit = 20, status }) => {
    const skip = (page - 1) * limit;
    let filter = { user: userId };
    
    if (status === 'completed') {
        filter.isCompleted = true;
    } else if (status === 'in-progress') {
        filter.isCompleted = false;
        filter.currentPosition = { $gt: 0 };
    }

    const books = await UserProgress.find(filter)
        .populate('book', 'title coverImage duration authors narrator rating')
        .populate('book.authors', 'name')
        .sort({ lastPlayedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));
    
    const total = await UserProgress.countDocuments(filter);

    return {
        books,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
        }
    };
};

export const getUserStats = async (userId) => {
    const user = await User.findById(userId).select('stats preferences subscription');
    const totalBooks = await UserProgress.countDocuments({ user: userId });
    const completedBooks = await UserProgress.countDocuments({ user: userId, isCompleted: true });
    const inProgressBooks = await UserProgress.countDocuments({ user: userId, isCompleted: false, currentPosition: { $gt: 0 } });
    
    const progressData = await UserProgress.find({ user: userId });
    const totalListeningTime = progressData.reduce((total, p) => total + p.totalPlayed, 0);

    return {
        totalBooks,
        completedBooks,
        inProgressBooks,
        totalListeningTime: Math.round(totalListeningTime / 60),
        userStats: user.stats,
        preferences: user.preferences,
        subscription: user.subscription
    };
};

export const getRecommendations = async (userId, limit = 10) => {
    const user = await User.findById(userId).populate('preferences.preferredGenres');
    const preferredGenres = user.preferences.preferredGenres.map(g => g._id);
    const userProgress = await UserProgress.find({ user: userId }).select('book');
    const listenedBookIds = userProgress.map(p => p.book);

    let recommendedBooks = [];

    if (preferredGenres.length > 0) {
        recommendedBooks = await Book.find({
            genres: { $in: preferredGenres },
            _id: { $nin: listenedBookIds },
            isActive: true
        })
        .populate('authors', 'name photo')
        .populate('genres', 'name color')
        .sort({ rating: -1, totalPlays: -1 })
        .limit(limit);
    }

    if (recommendedBooks.length < limit) {
        const additionalLimit = limit - recommendedBooks.length;
        const popularBooks = await Book.find({
            _id: { $nin: listenedBookIds.concat(recommendedBooks.map(b => b._id)) },
            isActive: true
        })
        .populate('authors', 'name photo')
        .populate('genres', 'name color')
        .sort({ totalPlays: -1, rating: -1 })
        .limit(additionalLimit);
        
        recommendedBooks = recommendedBooks.concat(popularBooks);
    }

    return recommendedBooks;
};
