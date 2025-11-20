import mongoose from "mongoose"; // Imports mongoose to define schema and model

// Defines the user schema for MongoDB
const userSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Stores user name, required field
  email: { type: String, required: true, unique: true }, // Stores email, ensures uniqueness
  password: { type: String, required: true }, // Stores hashed password, required field
  resetPasswordToken: { type: String }, // Token for password reset
  resetPasswordExpires: { type: Date }, // Expiry time for reset token
  refreshToken: { type: String }, // Refresh token for JWT
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date },
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String },
  emailVerificationExpires: { type: Date },
  
  // Audiobook specific fields
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  profilePicture: { type: String, default: "" },
  preferences: {
    preferredGenres: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Genre' }],
    playbackSpeed: { type: Number, default: 1.0, min: 0.5, max: 3.0 },
    autoPlayNext: { type: Boolean, default: true },
    darkMode: { type: Boolean, default: false },
    fontSize: { type: String, enum: ['small', 'medium', 'large'], default: 'medium' },
    highContrast: { type: Boolean, default: false }
  },
  subscription: {
    type: { type: String, enum: ['free', 'premium', 'lifetime'], default: 'free' },
    startDate: { type: Date },
    endDate: { type: Date },
    autoRenew: { type: Boolean, default: false }
  },
  stats: {
    booksCompleted: { type: Number, default: 0 },
    totalListeningTime: { type: Number, default: 0 }, // in minutes
    favoriteGenres: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Genre' }]
  }
});

// Creates a model based on the schema
const User = mongoose.model("User", userSchema);

const genreSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  color: { type: String },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const authorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  bio: { type: String },
  photo: { type: String }
}, { timestamps: true });

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  authors: [{ type: mongoose.Schema.Types.ObjectId, ref: "Author" }],
  genres: [{ type: mongoose.Schema.Types.ObjectId, ref: "Genre" }],
  narrator: { type: String },
  duration: { type: Number, default: 0 },
  audioFile: { type: String },
  coverImage: { type: String },
  rating: { type: Number, default: 0 },
  totalPlays: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  releaseDate: { type: Date },
  language: { type: String, default: "ml" }
}, { timestamps: true });

const userProgressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  book: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
  currentPosition: { type: Number, default: 0 },
  totalPlayed: { type: Number, default: 0 },
  playbackSpeed: { type: Number, default: 1.0 },
  isCompleted: { type: Boolean, default: false },
  completionDate: { type: Date },
  lastPlayedAt: { type: Date },
  bookmarks: [
    {
      position: { type: Number },
      note: { type: String },
      createdAt: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  book: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String }
}, { timestamps: true });

const playlistSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  description: { type: String },
  books: [{ type: mongoose.Schema.Types.ObjectId, ref: "Book" }]
}, { timestamps: true });

export const Genre = mongoose.model("Genre", genreSchema);
export const Author = mongoose.model("Author", authorSchema);
export const Book = mongoose.model("Book", bookSchema);
export const UserProgress = mongoose.model("UserProgress", userProgressSchema);
export const Review = mongoose.model("Review", reviewSchema);
export const Playlist = mongoose.model("Playlist", playlistSchema);

// Exports User model for use in controllers and routes
export { User };
export default User;
