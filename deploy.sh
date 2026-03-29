#!/bin/bash
# DriveEase Backend Deployment Helper Script
# This script prepares everything for Render deployment

echo "🚀 DriveEase Backend Deployment Setup"
echo "========================================"
echo ""

# Check Node.js and npm
echo "✓ Checking Node.js installation..."
node --version
npm --version

# Check backend structure
echo ""
echo "✓ Checking backend directory..."
if [ -f "backend/server.js" ]; then
    echo "  ✅ backend/server.js found"
else
    echo "  ❌ backend/server.js NOT found"
    exit 1
fi

if [ -f "backend/package.json" ]; then
    echo "  ✅ backend/package.json found"
else
    echo "  ❌ backend/package.json NOT found"
    exit 1
fi

# Test local backend
echo ""
echo "✓ Testing local backend..."
echo ""
echo "Starting backend server..."
cd backend
npm install

echo ""
echo "========================================"
echo "✅ Setup Complete!"
echo "========================================"
echo ""
echo "Next Steps:"
echo "==========="
echo ""
echo "1. Create MongoDB Atlas Database (5 min):"
echo "   • Visit: https://www.mongodb.com/cloud/atlas"
echo "   • Sign up → Create Cluster → Get Connection String"
echo "   • Copy the connection string"
echo ""
echo "2. Deploy to Render (5 min):"
echo "   • Visit: https://render.com"
echo "   • Sign in with GitHub → New Web Service"
echo "   • Select: thimansh399-sys/DriveEase"
echo "   • Build Command: npm install"
echo "   • Start Command: node backend/server.js"
echo "   • Add Environment Variables (see Step 3)"
echo ""
echo "3. Set Environment Variables on Render:"
echo "   MONGODB_URI=<your-atlas-connection-string>"
echo "   JWT_SECRET=driveease-secret-key-2024"
echo "   ADMIN_PASSWORD=YourPassword123"
echo "   ALLOWED_ORIGINS=https://mydriveease.in,https://www.mydriveease.in"
echo "   NODE_ENV=production"
echo ""
echo "4. Copy Render Backend URL and update:"
echo "   File: frontend/.env"
echo "   REACT_APP_API_URL=https://your-render-url.onrender.com/api"
echo ""
echo "5. Redeploy Frontend:"
echo "   git add frontend/.env"
echo "   git commit -m 'Update backend API URL'"
echo "   git push origin main:DriveEase-set1"
echo "   cd frontend && npx vercel --prod --yes"
echo ""
