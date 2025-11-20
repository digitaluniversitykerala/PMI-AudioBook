import nodemailer from "nodemailer";

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Send password reset email
export const sendPasswordResetEmail = async (email, resetToken) => {
  const transporter = createTransporter();
  
  const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${resetToken}`;
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Password Reset Request - PMI AudioBook",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>You requested to reset your password for your PMI AudioBook account.</p>
        <p>Click the button below to reset your password. This link will expire in 1 hour.</p>
        <div style="margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          If the button doesn't work, copy and paste this link into your browser:
          <br>${resetUrl}
        </p>
        <p style="color: #666; font-size: 14px;">
          If you didn't request this, please ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">
          This email was sent from PMI AudioBook - Accessible audiobooks for everyone.
        </p>
      </div>
    `,
    text: `
      Password Reset Request
      
      You requested to reset your password for your PMI AudioBook account.
      
      Click this link to reset your password (expires in 1 hour):
      ${resetUrl}
      
      If you didn't request this, please ignore this email.
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send password reset email");
  }
};

// Send welcome email
export const sendWelcomeEmail = async (email, name) => {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Welcome to PMI AudioBook!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to PMI AudioBook, ${name}!</h2>
        <p>Thank you for joining our accessible audiobook platform.</p>
        <p>We're committed to making audiobooks accessible to everyone, especially users with visual impairments.</p>
        <h3>Features available to you:</h3>
        <ul>
          <li>Voice-controlled navigation</li>
          <li>Screen reader optimized interface</li>
          <li>High contrast mode</li>
          <li>Keyboard shortcuts for all actions</li>
        </ul>
        <p>Get started by exploring our audiobook collection!</p>
        <div style="margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/dashboard" 
             style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Go to Dashboard
          </a>
        </div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">
          PMI AudioBook - Making knowledge accessible to everyone
        </p>
      </div>
    `,
    text: `
      Welcome to PMI AudioBook, ${name}!
      
      Thank you for joining our accessible audiobook platform.
      
      We're committed to making audiobooks accessible to everyone, especially users with visual impairments.
      
      Features available to you:
      - Voice-controlled navigation
      - Screen reader optimized interface
      - High contrast mode
      - Keyboard shortcuts for all actions
      
      Get started by exploring our audiobook collection!
      
      Visit your dashboard: ${process.env.FRONTEND_URL || "http://localhost:5173"}/dashboard
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Error sending welcome email:", error);
    // Don't throw error for welcome email - it's not critical
    return false;
  }
};