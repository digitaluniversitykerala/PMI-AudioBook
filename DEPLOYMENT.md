# Vercel Deployment Guide

## Prerequisites
- GitHub account with this repository
- Vercel account (sign up at vercel.com)
- MongoDB Atlas account (sign up at mongodb.com/cloud/atlas)

## Step 1: Set Up MongoDB Atlas Database

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account or sign in
3. Create a new project called "PMI-AudioBook"
4. Create a new cluster:
   - Choose FREE tier
   - Select your preferred region (closest to your users)
   - Click "Create Cluster"
5. Wait for cluster to be ready (5-10 minutes)

### Get Connection String:
1. Click "Connect" button on your cluster
2. Select "Drivers" (Node.js)
3. Copy the connection string
4. Replace `<username>` and `<password>` with your database credentials
5. Replace `<database>` with `pmi-audiobook`

Example format:
```
mongodb+srv://username:password@cluster.mongodb.net/pmi-audiobook?retryWrites=true&w=majority
```

## Step 2: Deploy to Vercel

### Option A: Using Vercel Dashboard (Easiest)

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Click "Add New..." → "Project"
4. Import your GitHub repository
5. Fill in the environment variables:
   - `MONGO_URI`: Your MongoDB Atlas connection string
   - `FRONTEND_URL`: Leave blank (Vercel will auto-fill)
   - `JWT_SECRET`: Generate a secure random string
   - `GOOGLE_CLIENT_ID`: Your Google OAuth credentials
   - `GOOGLE_CLIENT_SECRET`: Your Google OAuth secret
   - `EMAIL_USER`: Your email address
   - `EMAIL_PASSWORD`: Your app-specific password
6. Click "Deploy"

### Option B: Using Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy from project root
vercel

# Add environment variables
vercel env add MONGO_URI
vercel env add JWT_SECRET
# ... etc

# Deploy to production
vercel --prod
```

## Step 3: Verify Deployment

1. Your frontend will be at: `https://your-project.vercel.app`
2. Your API will be at: `https://your-project.vercel.app/api/*`
3. Test health endpoint: `https://your-project.vercel.app/api/health`

## Environment Variables Needed

| Variable | Description | Example |
|----------|-------------|---------|
| MONGO_URI | MongoDB connection string | mongodb+srv://... |
| FRONTEND_URL | Frontend URL (auto-set by Vercel) | https://yourapp.vercel.app |
| JWT_SECRET | Secret for JWT tokens | any-random-secure-string |
| GOOGLE_CLIENT_ID | From Google Cloud Console | xxx.apps.googleusercontent.com |
| GOOGLE_CLIENT_SECRET | From Google Cloud Console | xxx |
| EMAIL_USER | Email for sending emails | your@gmail.com |
| EMAIL_PASSWORD | Gmail app password | xxxx xxxx xxxx xxxx |

## Getting Gmail App Password

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable 2-factor authentication
3. Go to "App passwords"
4. Select "Mail" and "Windows Computer"
5. Generate password (16 characters with spaces)
6. Use this in EMAIL_PASSWORD variable

## Getting Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized redirect URIs:
   - `https://localhost:5173/callback`
   - `https://your-vercel-domain.vercel.app/callback`
6. Copy Client ID and Client Secret

## After Deployment

Update your frontend API calls to use the new domain:

In `frontend/src/api.js`:
```javascript
const API_BASE_URL = process.env.VITE_API_URL || 'https://your-project.vercel.app/api';
```

Update `.env.example` and add to Vercel environment variables:
```
VITE_API_URL=https://your-project.vercel.app/api
```

## Troubleshooting

### "MongoDB connection timeout"
- Check MongoDB URI is correct
- Ensure IP whitelist includes "0.0.0.0/0" in MongoDB Atlas

### "CORS errors"
- Verify FRONTEND_URL is set correctly in environment variables
- Ensure CORS origin in backend/server.js matches FRONTEND_URL

### "Large file uploads fail"
- Vercel has 50MB request limit
- Consider using external storage (Azure Blob, AWS S3)

### "Cold start delays"
- First request may take 5-10 seconds
- This is normal for serverless functions
- Subsequent requests are faster

## Local Testing Before Deployment

```bash
# Install dependencies
npm install
npm install --prefix backend
npm install --prefix frontend

# Create .env file with MongoDB URI
echo "MONGO_URI=your_connection_string" > backend/.env

# Run locally
npm run dev

# Frontend will be at http://localhost:5173
# Backend API at http://localhost:5000
```

## Next Steps

1. Monitor deployment logs in Vercel dashboard
2. Check Vercel analytics and serverless function metrics
3. Set up error monitoring (Sentry, LogRocket)
4. Consider upgrading to Vercel Pro for better performance
