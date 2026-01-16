import mongoose from 'mongoose';

// Standalone Book model used across the app
// Mirrors the bookSchema that other models/controllers expect:
// - authors: [Author]
// - genres: [Genre]
// - fields like narrator, rating, totalPlays, releaseDate, language
const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    authors: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'Author' }
    ],
    genres: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'Genre' }
    ],
    narrator: { type: String },
    duration: { type: Number, default: 0 },
    coverImage: { type: String },
    chapters: [
      {
        title: { type: String, required: true },
        audioFile: { type: String, required: true },
        duration: { type: Number, default: 0 }
      }
    ],
    // Legacy support for single-file books (optional but good for migration)
    audioFile: { type: String },
    
    rating: { type: Number, default: 0 },
    totalPlays: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    releaseDate: { type: Date },
    language: { type: String, default: 'ml' }
  },
  { timestamps: true }
);

const Book = mongoose.model('Book', bookSchema);

export default Book;
