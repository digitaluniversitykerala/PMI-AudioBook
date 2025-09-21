import User from "../models/User.js"; // Imports User model to interact with MongoDB
import bcrypt from "bcryptjs"; // Imports bcrypt for hashing passwords
import jwt from "jsonwebtoken"; // Imports JWT for generating authentication tokens

// Handles user signup requests
export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body; // Extracts user data from request body

    // Checks if a user with the given email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "Email already in use" });

    // Hashes the password securely before saving to database
    const hashedPassword = await bcrypt.hash(password, 10);

    // Creates a new user document and saves it in MongoDB
    const newUser = await User({ name, email, password: hashedPassword });
    await newUser.save();

    // Sends success response to frontend
    res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    console.error(err); // Logs server errors for debugging
    res.status(500).json({ error: "Server error" }); // Sends generic server error to frontend
  }
};

// Handles user login requests
export const login = async (req, res) => {
  try {
    const { email, password } = req.body; // Extracts login credentials from request

    // Finds user by email in MongoDB
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found" });

    // Compares provided password with hashed password in database
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    // Generates JWT token for authenticated session
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" } // Sets token expiration to 1 hour
    );

    // Sends token and user info to frontend
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error(err); // Logs errors for debugging
    res.status(500).json({ error: "Server error" }); // Sends generic server error response
  }
};
