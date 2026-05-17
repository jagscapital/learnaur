#!/bin/bash

# 🚀 Torah Study Platform - Quick Deploy Script
# This script helps you deploy to Cloudflare Pages via GitHub

echo "🕎 Torah Study Platform - Deployment Helper"
echo "==========================================="
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git not initialized. Run: git init"
    exit 1
fi

# Check if there are uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "📝 You have uncommitted changes."
    echo "Commit message:"
    read commit_message

    git add .
    git commit -m "$commit_message"
    echo "✅ Changes committed"
fi

# Check if remote exists
if ! git remote | grep -q origin; then
    echo ""
    echo "🔗 No remote repository found."
    echo "Please enter your GitHub repository URL:"
    echo "Example: https://github.com/username/torah-study-platform.git"
    read repo_url

    git remote add origin "$repo_url"
    echo "✅ Remote added"
fi

# Push to GitHub
echo ""
echo "🚀 Pushing to GitHub..."
git push -u origin master

echo ""
echo "✅ Code pushed to GitHub!"
echo ""
echo "📋 Next Steps:"
echo "1. Go to https://dash.cloudflare.com/"
echo "2. Navigate to Workers & Pages → Create application → Pages"
echo "3. Connect to Git and select your repository"
echo "4. Build settings:"
echo "   - Build command: (leave empty)"
echo "   - Build output directory: /"
echo "5. Click 'Save and Deploy'"
echo ""
echo "Your site will be live at: https://your-project.pages.dev"
echo ""
echo "🕎 Chazak chazak v'nitchazek!"
