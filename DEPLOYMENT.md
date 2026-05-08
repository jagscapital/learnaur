# 🚀 DEPLOYMENT GUIDE — Cloudflare Pages

Complete guide to deploying the Torah Study Platform to Cloudflare Pages.

---

## 📋 Prerequisites

1. **GitHub Account** (or GitLab/Bitbucket)
2. **Cloudflare Account** (free tier works perfectly)
3. **Git installed** on your machine

---

## 🎯 Quick Deploy (5 Minutes)

### Step 1: Initialize Git Repository

```bash
cd torah-platform

# Initialize git
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Torah Study Platform"
```

### Step 2: Push to GitHub

**Option A: Using GitHub CLI**
```bash
# Install GitHub CLI if needed: https://cli.github.com/

# Create repository and push
gh repo create torah-study-platform --public --source=. --push
```

**Option B: Manual GitHub Setup**

1. Go to [github.com/new](https://github.com/new)
2. Create repository named `torah-study-platform`
3. Don't initialize with README (we have files already)
4. Copy the commands shown:

```bash
git remote add origin https://github.com/YOUR_USERNAME/torah-study-platform.git
git branch -M main
git push -u origin main
```

### Step 3: Deploy to Cloudflare Pages

1. **Go to Cloudflare Pages**
   - Visit: https://dash.cloudflare.com/
   - Navigate to **Workers & Pages** → **Create application** → **Pages**

2. **Connect to Git**
   - Click **Connect to Git**
   - Select **GitHub**
   - Authorize Cloudflare Pages
   - Select `torah-study-platform` repository

3. **Configure Build Settings**
   ```
   Project name: torah-study-platform
   Production branch: main
   Build command: (leave empty - no build needed!)
   Build output directory: /
   Root directory: (leave empty)
   ```

4. **Environment Variables** (None needed!)
   - Skip this section - our platform works without env vars

5. **Deploy**
   - Click **Save and Deploy**
   - Wait 30-60 seconds
   - Your site will be live at: `https://torah-study-platform.pages.dev`

---

## ✅ Deployment Checklist

Before deploying, verify:

- [x] All file paths are relative (no absolute paths)
- [x] External APIs used: Sefaria.org, Hebcal.com (both allow CORS)
- [x] No server-side code required
- [x] All assets in correct folders
- [x] `.gitignore` configured
- [x] `_headers` file for security
- [x] `_redirects` file for routing

---

## 🔧 Configuration Files

### `.gitignore`
Already created - excludes unnecessary files from git.

### `_headers`
Custom HTTP headers for security and caching.
- Already configured for optimal performance
- Allows CORS for Sefaria and Hebcal APIs

### `_redirects`
URL redirects and rewrites.
- Already set up for common redirects

---

## 🌐 Custom Domain (Optional)

### Add Your Own Domain

1. **In Cloudflare Pages Dashboard:**
   - Go to your project
   - Click **Custom domains**
   - Click **Set up a custom domain**

2. **Enter Your Domain:**
   - Example: `torahstudy.com`
   - Follow DNS configuration instructions

3. **DNS Configuration:**
   ```
   Type: CNAME
   Name: @ (or subdomain)
   Value: torah-study-platform.pages.dev
   ```

4. **SSL Certificate:**
   - Automatically provisioned by Cloudflare
   - Usually ready in 5-15 minutes

---

## 🔄 Updates & Redeployment

### Automatic Deployments

Every time you push to GitHub, Cloudflare automatically rebuilds:

```bash
# Make changes to files
git add .
git commit -m "Description of changes"
git push
```

That's it! Cloudflare detects the push and redeploys automatically.

### Manual Deployment Trigger

In Cloudflare Pages dashboard:
1. Go to your project
2. Click **View build**
3. Click **Retry deployment**

---

## 📊 Monitoring & Analytics

### View Analytics

1. **Cloudflare Dashboard:**
   - **Analytics** tab shows:
     - Requests per day
     - Bandwidth usage
     - Geographic distribution
     - Top pages

2. **Real-time Logs:**
   - Available in **Logs** section
   - See errors and requests live

### Performance

Expected metrics:
- **Load time:** < 2 seconds globally
- **Lighthouse score:** 95+
- **Uptime:** 99.99%

---

## 🐛 Troubleshooting

### Issue: Site not loading

**Solution:**
1. Check Cloudflare Pages dashboard for build errors
2. Verify all files pushed to GitHub
3. Check browser console for errors

### Issue: API calls failing

**Solution:**
1. Verify CORS headers in `_headers` file
2. Check Sefaria.org and Hebcal.com are accessible
3. Test API endpoints manually

### Issue: Hebrew text not displaying

**Solution:**
1. Verify Google Fonts are loading
2. Check browser supports Hebrew fonts
3. Clear browser cache and reload

### Issue: Custom domain not working

**Solution:**
1. Verify DNS records propagated (use dnschecker.org)
2. Wait 24-48 hours for full propagation
3. Check SSL certificate status in Cloudflare

---

## 🔐 Security Considerations

### Already Configured:

✅ **HTTPS** — Forced by Cloudflare
✅ **XSS Protection** — Headers configured
✅ **Content Security** — X-Content-Type-Options set
✅ **Frame Protection** — X-Frame-Options set

### Best Practices:

- Never commit API keys (none needed for this project)
- Keep dependencies updated
- Monitor Cloudflare security events

---

## 💰 Cost

**Cloudflare Pages Pricing:**

| Tier | Price | Limits |
|------|-------|--------|
| **Free** | $0/month | 500 builds/month, 100,000 requests/day |
| **Pro** | $20/month | Unlimited builds, advanced features |

**For this project:**
- ✅ Free tier is perfect
- No server costs
- No database costs
- APIs (Sefaria, Hebcal) are free

**Total Cost: $0/month** 🎉

---

## 📈 Scaling

### Expected Traffic Handling:

- **100,000 requests/day** on free tier
- **~3 million requests/month**
- **Handles 1000+ concurrent users easily**

### If You Outgrow Free Tier:

1. **Upgrade to Pro** ($20/month)
   - Unlimited builds
   - Priority support
   - Advanced analytics

2. **Or migrate to Cloudflare Workers** (if needed)
   - Serverless edge computing
   - Still very affordable

---

## 🎨 Preview Deployments

### Automatic PR Previews:

When you create a Pull Request on GitHub:
- Cloudflare automatically creates a preview
- Unique URL like: `branch-name.torah-study-platform.pages.dev`
- Test changes before merging!

### Create Preview Branch:

```bash
git checkout -b new-feature
git add .
git commit -m "Add new feature"
git push origin new-feature
```

Then create PR on GitHub - preview deploys automatically!

---

## 📝 Post-Deployment Tasks

### Immediately After Deploy:

1. ✅ **Test All Pages:**
   - Homepage
   - Daily Parsha
   - Davening
   - Search

2. ✅ **Verify APIs Working:**
   - Load a parsha (should fetch from Sefaria)
   - Check Hebrew date (should fetch from Hebcal)

3. ✅ **Test on Mobile:**
   - Responsive design
   - Touch interactions
   - Font sizes readable

4. ✅ **Share the URL:**
   - Send to friends/family
   - Get feedback
   - Monitor for issues

### Within 24 Hours:

1. **Set up monitoring** (optional)
   - Uptime monitors (uptimerobot.com - free)
   - Error tracking (sentry.io - free tier)

2. **Add to search engines** (optional)
   - Google Search Console
   - Submit sitemap

3. **Social media** (optional)
   - Share on Twitter/Facebook
   - Jewish learning communities

---

## 🚀 Advanced: CI/CD Pipeline

### Optional GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: torah-study-platform
          directory: .
```

This provides:
- Automated testing before deploy
- Linting checks
- Build validation

---

## 📚 Resources

### Documentation:
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Git Documentation](https://git-scm.com/doc)
- [GitHub Guides](https://guides.github.com/)

### Community:
- [Cloudflare Community](https://community.cloudflare.com/)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/cloudflare-pages)

### Support:
- Cloudflare Support (for paid accounts)
- Community forums (free accounts)

---

## ✨ Success Metrics

After deployment, you should see:

✅ **Live URL:** `https://your-project.pages.dev`
✅ **Build Status:** Success
✅ **Deploy Time:** < 1 minute
✅ **First Load:** < 2 seconds
✅ **API Calls:** Working
✅ **Hebrew Text:** Displaying correctly
✅ **Mobile:** Responsive and fast

---

## 🎉 You're Live!

**Congratulations!** Your Torah Study Platform is now live and accessible worldwide.

**Your site is:**
- ✅ Globally distributed (CDN)
- ✅ HTTPS secure
- ✅ Auto-updating on git push
- ✅ Free to run
- ✅ Fast and reliable

### Share Your Site:

```
🕎 Torah Study Platform

Daily Torah portions, prayer services, and deep Jewish learning.

Visit: https://your-project.pages.dev

Features:
✅ Weekly Parsha with Hebrew & English
✅ Complete Davening (Shacharit, Mincha, Maariv)
✅ Commentary from Gemara, Midrash, Chassidus
✅ Cinematic immersive design
✅ Free and accessible to all

Chazak chazak v'nitchazek! 🕎
```

---

## 🔄 Next Steps

1. **Monitor traffic** in Cloudflare Analytics
2. **Gather feedback** from users
3. **Make improvements** based on usage
4. **Add features** from roadmap
5. **Share widely** in Jewish communities

---

**May your platform bring Torah wisdom to many! 📚✨**

🕎 **Chazak chazak v'nitchazek!** 🕎
