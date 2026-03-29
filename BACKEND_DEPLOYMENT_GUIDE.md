# Backend Deployment Guide - Render.io

## Step 1: Create MongoDB Atlas Database (Free)

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up for a free account
3. Create a new project called "DriveEase"
4. Create a new cluster (select "Free" tier)
5. Create a database user with username/password
6. Get the connection string that looks like:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/driveease?retryWrites=true&w=majority
   ```
7. Copy this - you'll need it in Step 4

## Step 2: Create Render.io Account

1. Go to https://render.com
2. Sign up with GitHub (recommended)
3. Connect your GitHub account (thimansh399-sys/DriveEase repo)

## Step 3: Deploy Backend Service

On Render dashboard:
1. Click "New +" → "Web Service"
2. Connect your GitHub repo
3. Configure:
   - **Name**: `driveease-backend`
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node backend/server.js`
   - **Plan**: Free tier

4. Create the service
5. After creation, copy the deployed URL (will be like https://driveease-backend-xxxx.onrender.com)

## Step 4: Set Environment Variables on Render

In Render dashboard → Your Service → Environment:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/driveease?retryWrites=true&w=majority
PORT=5000
JWT_SECRET=driveease-super-secret-jwt-key-2024-production
ADMIN_PASSWORD=YourSecureAdminPassword
ALLOWED_ORIGINS=https://mydriveease.in,https://www.mydriveease.in,http://localhost:3000
NODE_ENV=production
```

## Step 5: Update Frontend Configuration

```
REACT_APP_API_URL=https://driveease-backend-xxxx.onrender.com/api
```

Then redeploy frontend to Vercel with this environment variable.

## Step 6: Test Connection

Visit: https://your-backend-url.onrender.com/api/health

Should return: `{"status":"DriveEase API is running"}`

## Important Notes

- The free Render tier spins down after 15 min of inactivity
- MongoDB Atlas free tier has connection limits (512 connections max)
- For production, upgrade to paid tier when ready
- Keep JWT_SECRET and MongoDB password secure!
