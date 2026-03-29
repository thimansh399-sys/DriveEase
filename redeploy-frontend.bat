@echo off
REM DriveEase Frontend Redeploy Script
REM Run this AFTER you've updated frontend/.env with the new backend URL

setlocal enabledelayedexpansion

color 0A
echo.
echo ============================================================
echo   DriveEase Frontend Redeploy to Vercel
echo ============================================================
echo.

REM Check if .env is updated
echo [1/4] Checking frontend/.env...
set ENV_URL=
for /f "usebackq tokens=2 delims==" %%i in ("frontend\.env") do (
    if "%%i"=="http://localhost:5000/api" (
        color 0C
        echo ERROR: frontend/.env still has localhost URL!
        echo.
        echo Update this file first:
        echo   frontend\.env
        echo.
        echo Change:
        echo   REACT_APP_API_URL=http://localhost:5000/api
        echo To:
        echo   REACT_APP_API_URL=https://driveease-backend-xxxxx.onrender.com/api
        echo.
        echo (Replace xxxxx with your actual Render backend URL)
        pause
        exit /b 1
    )
    if "%%i" neq "" (
        set "ENV_URL=%%i"
    )
)

if "!ENV_URL!"=="" (
    color 0C
    echo ERROR: Could not read REACT_APP_API_URL from .env
    pause
    exit /b 1
)

echo       ✓ Backend URL configured: !ENV_URL!
echo.

REM Commit changes
echo [2/4] Committing changes to Git...
git add frontend\.env
if %errorlevel% neq 0 (
    echo       - No changes to commit
) else (
    git commit -m "Update backend API URL for production"
    git push origin main:DriveEase-set1
    echo       ✓ Changes pushed to GitHub
)
echo.

REM Deploy to Vercel
echo [3/4] Deploying to Vercel...
cd frontend
call npx vercel --prod --yes

if %errorlevel% neq 0 (
    color 0C
    echo ERROR: Vercel deployment failed!
    echo.
    echo Make sure:
    echo 1. You have Vercel CLI installed
    echo 2. You are logged in (run: npx vercel login)
    echo 3. Your Vercel project is configured
    cd..
    pause
    exit /b 1
)

color 0B
echo       ✓ Frontend deployed to Vercel!
echo.
cd..

REM Update aliases
echo [4/4] Updating custom domain aliases...
echo.
echo Run these commands in PowerShell:
echo.
echo   npx vercel alias ls
echo.
echo Copy the new deployment URL, then run:
echo.
echo   npx vercel alias set [NEW_URL] mydriveease.in
echo   npx vercel alias set [NEW_URL] www.mydriveease.in
echo.

color 0B
echo ============================================================
echo   ✓ Frontend Redeployment Complete!
echo ============================================================
echo.
echo Visit: https://mydriveease.in/drivers
echo Should now show drivers list without errors!
echo.
pause
