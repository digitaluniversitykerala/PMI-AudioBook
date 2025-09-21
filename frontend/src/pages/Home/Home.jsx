import React from "react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.jpg";
import pmi from "@/assets/pmi.png";
import styles from "./Home.module.css";

// Importin the Google login button and JWT decoder
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";

const Home = () => {
  // Handles successful Google login
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const token = credentialResponse.credential; // Gets Google ID token
      const userInfo = jwtDecode(token); // Decodes user info (name, email)
      console.log("Google User:", userInfo);

      // Sends token to backend to verify and get app JWT
      const res = await fetch("http://localhost:5000/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (!res.ok) throw new Error("Failed to login with Google");
      const data = await res.json();
      console.log("Backend response:", data);

      if (data.success) {
        // Saves JWT to localStorage
        localStorage.setItem("token", data.token);

        // Redirects user to dashboard
        window.location.href = "/dashboard";
      } else {
        alert("Google login fails on server");
      }
    } catch (err) {
      console.error("Google login error:", err);
    }
  };

  // Handles Google login failure
  const handleGoogleFailure = () => {
    console.log("Google Login fails");
    alert("Google login fails. Please try again.");
  };

  return (
    <div className={styles.homePage}>
      {/* Shows top blue bar */}
      <div className={`${styles.blueBox} ${styles.top}`}></div>

      <main className={styles.mainContent}>
        {/* Left section displays PMI logo and welcome text */}
        <div className={styles.leftSection}>
          <div className={styles.pmiLogo}>
            <img src={pmi} alt="PMI Logo" />
          </div>
          <div className={styles.heroContent}>
            <h1>Welcome to PMI Audiobook</h1>
            <p>Provides a gateway to knowledge through audio learning</p>
          </div>
        </div>

        {/* Right section displays app logo and action buttons */}
        <div className={styles.rightSection}>
          <div className={styles.appLogo}>
            <img src={logo} alt="App Logo" />
          </div>

          <div className={styles.actionButtons}>
            {/* Signup button navigates to signup page */}
            <Link to="/signup1" className={styles.signupButton}>
              Get Started
              <div className={styles.buttonGlow}></div>
            </Link>

            {/* Google login button triggers login flow */}
            <div className={styles.googleButton}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleFailure}
              />
            </div>

            {/* Divider and login link for existing users */}
            <div className={styles.loginSection}>
              <div className={styles.divider}>
                <span>or</span>
              </div>
              <Link to="/login" className={styles.loginLink}>
                Already have an account? <span>Log in</span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Shows bottom blue bar */}
      <div className={`${styles.blueBox} ${styles.bottom}`}></div>
    </div>
  );
};

export default Home;
