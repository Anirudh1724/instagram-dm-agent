# Deploying to Railway

This guide will help you deploy Instagram DM Agent to Railway in about 10 minutes.

## Prerequisites

- GitHub account (to push your code)
- Railway account (free at [railway.app](https://railway.app))
- Your environment variables ready (OpenAI key, Meta tokens, etc.)

---

## Step 1: Push Code to GitHub

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Ready for Railway deployment"

# Create a GitHub repo and push
# Or use GitHub CLI: gh repo create instagram-dm-agent --private --push
```

---

## Step 2: Create Railway Project

1. Go to [railway.app](https://railway.app) and sign in
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Connect your GitHub account if needed
5. Select your `instagram-dm-agent` repository

---

## Step 3: Add Redis Service

1. In your Railway project, click **"New"**
2. Select **"Database"** → **"Redis"**
3. Railway will automatically set the `REDIS_URL` variable

---

## Step 4: Set Environment Variables

In your web service, go to **Variables** and add:

| Variable | Value | Required |
|----------|-------|----------|
| `OPENAI_API_KEY` | Your OpenAI API key | ✅ |
| `META_VERIFY_TOKEN` | Your webhook verify token | ✅ |
| `META_APP_SECRET` | Your Meta app secret | ✅ |
| `ADMIN_EMAIL` | Admin login email | ✅ |
| `ADMIN_PASSWORD` | Admin login password | ✅ |
| `DEBUG` | `false` | ✅ |
| `PORT` | `8000` | ✅ |

> Note: `REDIS_URL` is auto-set by Railway when you add Redis service.

---

## Step 5: Deploy

1. Railway will automatically deploy after you set variables
2. Wait for the build to complete (2-5 minutes)
3. Click on your service to see the deployment URL

---

## Step 6: Get Your URL

Your app will be available at:
```
https://your-project-name.railway.app
```

URLs:
- **Dashboard**: `https://your-project.railway.app/`
- **Health Check**: `https://your-project.railway.app/health`
- **API Docs**: `https://your-project.railway.app/docs`

---

## Step 7: Update Meta Webhook

1. Go to [Meta Developers Console](https://developers.facebook.com)
2. Navigate to your app → Webhooks
3. Update the webhook URL to:
   ```
   https://your-project.railway.app/webhook
   ```

---

## Troubleshooting

### Build Failed
- Check the build logs in Railway
- Ensure `requirements.txt` has all dependencies
- Ensure `Dockerfile` is correct

### Redis Connection Error
- Make sure you added the Redis service
- Check if `REDIS_URL` variable exists in your web service

### 500 Errors
- Check the runtime logs in Railway
- Verify all environment variables are set

---

## Costs

Railway free tier includes:
- $5 worth of usage per month
- Enough for small-medium traffic apps
- Sleep after inactivity (wakes on request)

For production with consistent traffic, expect ~$5-20/month.

---

## Files Created for Deployment

| File | Purpose |
|------|---------|
| `Dockerfile` | Multi-stage build (frontend + backend) |
| `railway.json` | Railway configuration |
| `.env.production.template` | Environment variable template |
| `DEPLOY.md` | This guide |
