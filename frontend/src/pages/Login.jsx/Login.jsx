import React, { useState } from "react";
import API from "../../api"; // Imports Axios instance for backend calls

const Login = () => {
  // Stores user input and error state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Handles login form submission
  const handleLogin = async (e) => {
    e.preventDefault(); // Prevents page refresh
    setError(""); // Resets error message

    try {
      // Sends email and password to backend for authentication
      const res = await API.post("/auth/login", { email, password });

      // Saves JWT token in localStorage
      localStorage.setItem("token", res.data.token);

      // Alerts user and redirects to dashboard
      alert("Login successful!!!");
      window.location.href = "/dashboard";
    } catch (err) {
      console.error("Login error:", err.response?.data || err.message);

      // Updates error state to show message on UI
      setError(err.response?.data?.error || "Invalid credentials ❌");
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
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

        {/* Submit button triggers login */}
        <button type="submit">Login</button>
      </form>

      {/* Displays error message if login fails */}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default Login;
