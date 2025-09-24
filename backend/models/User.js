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
});

// Creates a model based on the schema
const User = mongoose.model("User", userSchema);

// Exports User model for use in controllers and routes
export default User;
