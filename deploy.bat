@echo off
REM Torah Study Platform - Windows Deploy Script

echo.
echo ========================================
echo   Torah Study Platform - Deploy Helper
echo ========================================
echo.

REM Check if .git exists
if not exist ".git" (
    echo ERROR: Git not initialized
    echo Run: git init
    pause
    exit /b 1
)

REM Check for uncommitted changes
git diff-index --quiet HEAD
if errorlevel 1 (
    echo.
    echo You have uncommitted changes.
    set /p commit_message="Enter commit message: "

    git add .
    git commit -m "%commit_message%"
    echo Changes committed!
)

REM Check if remote exists
git remote | findstr origin >nul
if errorlevel 1 (
    echo.
    echo No remote repository found.
    echo.
    echo Please enter your GitHub repository URL:
    echo Example: https://github.com/username/torah-study-platform.git
    set /p repo_url="Repository URL: "

    git remote add origin %repo_url%
    echo Remote added!
)

REM Push to GitHub
echo.
echo Pushing to GitHub...
git push -u origin master

echo.
echo ========================================
echo   SUCCESS! Code pushed to GitHub
echo ========================================
echo.
echo Next Steps:
echo 1. Go to https://dash.cloudflare.com/
echo 2. Navigate to Workers ^& Pages -^> Create application -^> Pages
echo 3. Connect to Git and select your repository
echo 4. Build settings:
echo    - Build command: ^(leave empty^)
echo    - Build output directory: /
echo 5. Click 'Save and Deploy'
echo.
echo Your site will be live at: https://your-project.pages.dev
echo.
echo Chazak chazak v'nitchazek!
echo.
pause
