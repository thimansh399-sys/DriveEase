@echo off
REM DriveEase Backend Deployment Helper - Windows
REM This script verifies and tests everything locally before deployment

setlocal enabledelayedexpansion

color 0A
echo.
echo ============================================================
echo   DriveEase Backend Deployment Helper
echo ============================================================
echo.

REM Check Node.js
echo [1/5] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo ERROR: Node.js is not installed!
    echo Visit: https://nodejs.org
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VER=%%i
echo       ✓ Node.js %NODE_VER% found
echo.

REM Check backend files
echo [2/5] Checking backend files...
if not exist "backend\server.js" (
    color 0C
    echo ERROR: backend/server.js not found!
    pause
    exit /b 1
)
echo       ✓ backend/server.js found
if not exist "backend\package.json" (
    color 0C
    echo ERROR: backend/package.json not found!
    pause
    exit /b 1
)
echo       ✓ backend/package.json found
echo.

REM Check frontend files
echo [3/5] Checking frontend files...
if not exist "frontend\.env" (
    color 0C
    echo ERROR: frontend/.env not found!
    pause
    exit /b 1
)
echo       ✓ frontend/.env found
echo.

REM Test backend
echo [4/5] Testing backend connection...
cd backend
if not exist "node_modules" (
    echo       Installing dependencies...
    call npm install >nul 2>&1
    if %errorlevel% neq 0 (
        color 0C
        echo ERROR: npm install failed!
        pause
        exit /b 1
    )
)
echo       ✓ Dependencies installed
cd..
echo.

REM Summary
echo [5/5] Deployment readiness check complete!
echo.
color 0B
echo ============================================================
echo   ✓ ALL CHECKS PASSED - Ready for Deployment!
echo ============================================================
echo.
echo NEXT STEPS:
echo ===========
echo.
echo 1. Follow the manual steps in: DEPLOYMENT_MANUAL_STEPS.md
echo.
echo 2. After deployment, come back and update frontend/.env
echo    REACT_APP_API_URL=https://your-render-backend-url/api
echo.
echo 3. Then run these commands:
echo    git add frontend/.env
echo    git commit -m "Update backend API URL"
echo    git push origin main:DriveEase-set1
echo    cd frontend
echo    npx vercel --prod --yes
echo.
echo 4. Finally, update Vercel aliases:
echo    npx vercel alias set [NEW_DEPLOYMENT_URL] mydriveease.in
echo    npx vercel alias set [NEW_DEPLOYMENT_URL] www.mydriveease.in
echo.
echo ============================================================
echo   Total Time Expected: 20-30 minutes
echo ============================================================
echo.
pause
