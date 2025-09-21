import mongoose from "mongoose"; // Imports mongoose to define schema and model

// Defines the user schema for MongoDB
const userSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Stores user name, required field
  email: { type: String, required: true, unique: true }, // Stores email, ensures uniqueness
  password: { type: String, required: true }, // Stores hashed password, required field
});

// Creates a model based on the schema
const User = mongoose.model("User", userSchema);

// Exports User model for use in controllers and routes
export default User;
