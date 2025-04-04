import React from "react";
import { Link } from 'react-router-dom';
import logo from "@/assets/logo.jpg";
import pmi from "@/assets/pmi.png";
import googleLogo from "@/assets/googleLogo.png";
import styles from "./Home.module.css";

// Add modern font imports
// import '@fontsource/plus-jakarta-sans/400.css';
// import '@fontsource/plus-jakarta-sans/600.css';
// import '@fontsource/plus-jakarta-sans/800.css';
// import '@fontsource/inter/400.css';
// import '@fontsource/inter/500.css';
// import '@fontsource/inter/600.css';

const Home = () => {
  return (
    <div className={styles.homePage}>
      {/* Top blue bar */}
      <div className={`${styles.blueBox} ${styles.top}`}></div>

      <main className={styles.mainContent}>
        {/* Left Section */}
        <div className={styles.leftSection}>
          <div className={styles.pmiLogo}>
            <img src={pmi} alt="PMI Logo" />
          </div>
          <div className={styles.heroContent}>
            <h1>Welcome to PMI Audiobook</h1>
            <p>Your gateway to knowledge through audio learning</p>
            <div className={styles.features}>
              <div className={styles.featureItem}>
                <span className={styles.featureIcon}>🎧</span>
                <p>Access premium audiobooks</p>
              </div>
              <div className={styles.featureItem}>
                <span className={styles.featureIcon}>📱</span>
                <p>Listen on any device</p>
              </div>
              <div className={styles.featureItem}>
                <span className={styles.featureIcon}>🚀</span>
                <p>Learn at your own pace</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className={styles.rightSection}>
          <div className={styles.appLogo}>
            <img src={logo} alt="App Logo" />
          </div>
          
          <div className={styles.actionButtons}>
            <Link to="/signup1" className={styles.signupButton}>
              Get Started
              <div className={styles.buttonGlow}></div>
            </Link>
            
            <button className={styles.googleButton}>
              <span className={styles.googleIcon}>
                <img src={googleLogo} alt="Google Logo" />
              </span>
              <span>Continue with Google</span>
            </button>
            
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

      {/* Bottom blue bar */}
      <div className={`${styles.blueBox} ${styles.bottom}`}></div>
    </div>
  );
};

export default Home;