import React, { useState } from "react";
import API from "../../api"; // Imports Axios instance for backend calls

const Signup = () => {
  // Stores user input and error state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Handles signup form submission
  const handleSignup = async (e) => {
    e.preventDefault(); // Prevents page refresh
    setError(""); // Resets error message

    try {
      // Sends name, email, and password to backend to create a new user
      await API.post("/auth/signup", { name, email, password });

      // Alerts user and redirects to login page
      alert("Signup successful !!! You can please login now!!");
      window.location.href = "/login";
    } catch (err) {
      console.error("Signup error:", err.response?.data || err.message);

      // Updates error state to show message on UI
      setError(err.response?.data?.error || "Signup failed ❌");
    }
  };

  return (
    <div>
      <h2>Signup</h2>
      <form onSubmit={handleSignup}>
        {/* Name input updates state on change */}
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        /><br/>

        {/* Email input updates state on change */}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        /><br/>

        {/* Password input updates state on change */}
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        /><br/>

        {/* Submit button triggers signup */}
        <button type="submit">Signup</button>
      </form>

      {/* Displays error message if signup fails */}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default Signup;
