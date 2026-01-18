# 🎧 PMI-AudioBook

A high-performance, secure, and modern AudioBook platform built with the MERN stack. Designed for a seamless listening experience with robust administrative controls.

---

## 🚀 Features

- **Dynamic Audio Streaming**: High-quality playback for multiple chapters.
- **Admin Dashboard**: Effortless book management (Upload covers, audio files, and manage metadata).
- **Smart Metadata**: Automatic author and genre creation during book uploads.
- **Robust Security**:
  - JWT (JSON Web Token) Authentication.
  - Role-Based Access Control (RBAC).
  - Content Security Policy (CSP) protection via Helmet.
  - Password Hashing using BcryptJS.
- **Modern UI**: Responsive design with Tailwind CSS and sleek animations.
- **Accessible Design**: Specialized accessibility hooks for an inclusive experience.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React, Vite, Tailwind CSS, Axios, Lucide Icons |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB, Mongoose |
| **Storage** | Local disk storage (Multer), managed via static paths |
| **Auth** | JWT, Google OAuth 2.0, BcryptJS |
| **Security** | Helmet, CORS, Dotenv |

---

## 📂 Project Structure

```text
PMI-AudioBook/
├── backend/
│   ├── controllers/    # Request handlers
│   ├── middleware/     # Auth, Upload, Error handling
│   ├── models/         # Database Schemas (Mongoose)
│   ├── routes/         # API endpoints
│   ├── services/       # Core business logic
│   ├── uploads/        # Local storage for audio and covers
│   └── server.js       # App entry point
├── frontend/
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── hooks/      # Custom React hooks
│   │   ├── pages/      # Main application views
│   │   ├── api.js      # Axios configuration
│   │   └── index.css   # Global styles and Tailwind
│   └── vite.config.js  # Vite configuration
└── README.md
```

---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas)
- npm or yarn

### 1. Clone the repository
```bash
git clone https://github.com/digitaluniversitykerala/PMI-AudioBook.git
cd PMI-AudioBook
```

### 2. Backend Setup
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example`:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_uri
   JWT_SECRET=your_secret_key
   FRONTEND_URL=http://localhost:5173
   ```
4. Start the server:
   ```bash
   npm start
   ```

### 3. Frontend Setup
1. Navigate to the frontend folder:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file:
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

---

## 🛡️ API Endpoints (Highlights)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | User login | 🔓 No |
| `GET` | `/api/books` | Fetch all active books | 🔓 No |
| `GET` | `/api/books/:id` | Fetch specific book details | 🔓 No |
| `POST` | `/api/books` | Create a new book | 🛡️ Admin |
| `PUT` | `/api/books/:id` | Update book details | 🛡️ Admin |
| `DELETE` | `/api/books/:id` | Delete a book | 🛡️ Admin |

---

## 📄 License

This project is licensed under the ISC License.