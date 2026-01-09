# Deployment Configuration

This document provides instructions for deploying the Fynd Review System to production.

## 🚀 Backend Deployment (Render.com)

### Prerequisites

- GitHub account with the repository
- Render.com account
- OpenAI API key

### Steps

1. **Push your code to GitHub**

   ```bash
   git add .
   git commit -m "Add deployment configs"
   git push origin main
   ```

2. **Connect to Render**

   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Blueprint"
   - Connect your GitHub repository
   - Select the repository containing the `services/api/render.yaml` file

3. **Configure Environment Variables**
   Render will automatically read the `render.yaml` file. You need to set:

   - `OPENAI_API_KEY`: Your OpenAI API key (set as secret)
   - Database will be auto-provisioned with the name `fynd-reviews-db`

4. **Deploy**
   - Render will automatically build and deploy your API
   - Note the API URL (e.g., `https://fynd-reviews-api.onrender.com`)

### Database Setup

The PostgreSQL database is automatically provisioned via the `render.yaml` config:

- **Database Name**: `fynd_reviews`
- **User**: `fynd_reviews_user`
- **Plan**: Free tier
- **Region**: Oregon

After deployment, you may need to run migrations manually via Render Shell.

---

## 🌐 Frontend Deployment (Vercel)

### Prerequisites

- GitHub account with the repository
- Vercel account

### Deploy User Web App

1. **Go to Vercel Dashboard**

   - Visit [Vercel](https://vercel.com)
   - Click "Add New" → "Project"

2. **Import Repository**

   - Select your GitHub repository
   - Choose the `apps/user-web` directory as the root

3. **Configure Project**

   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/user-web`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

4. **Environment Variables**
   Add the following environment variable:

   - `NEXT_PUBLIC_API_BASE_URL`: Your Render API URL (e.g., `https://fynd-reviews-api.onrender.com`)

5. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy your app
   - Note the deployed URL

### Deploy Admin Web App

Repeat the same steps but:

- **Root Directory**: `apps/admin-web`
- Same environment variables as User Web App

---

## 📝 Configuration Files

### Backend: `render.yaml`

Located at: `services/api/render.yaml`

Key configurations:

- **Runtime**: Python 3.11
- **Build**: `pip install -r requirements.txt`
- **Start**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Region**: Oregon (change as needed)
- **Plan**: Free tier

### Frontend: `vercel.json`

Located at:

- `apps/user-web/vercel.json`
- `apps/admin-web/vercel.json`

Key configurations:

- Uses `@vercel/next` builder
- Automatic routing for Next.js
- Environment variable for API connection

---

## 🔧 Post-Deployment Steps

### 1. Update CORS Settings

Update the backend to allow your Vercel domains:

```python
# In services/api/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-user-app.vercel.app",
        "https://your-admin-app.vercel.app"
    ],
    ...
)
```

### 2. Initialize Database

Connect to Render Shell and run:

```bash
python init_db.py
```

### 3. Test the Connection

- Visit your User Web App
- Submit a test review
- Check Admin Web App to see if it appears

---

## 🔄 Continuous Deployment

Both Render and Vercel support automatic deployments:

- **Render**: Deploys automatically on push to `main` branch
- **Vercel**: Deploys automatically on push to `main` branch
- Preview deployments are created for pull requests

---

## 💰 Cost Considerations

### Free Tier Limits

**Render (Free)**

- Sleeps after 15 minutes of inactivity
- 750 hours/month
- 512 MB RAM
- PostgreSQL: 1 GB storage, 1 month retention

**Vercel (Hobby - Free)**

- Unlimited deployments
- 100 GB bandwidth/month
- 6000 build minutes/month
- Automatic HTTPS

### Upgrade Options

Consider upgrading if you need:

- No sleep/downtime (Render: $7/mo)
- More database storage (Render: $7/mo)
- More bandwidth (Vercel: $20/mo)
- Team features (Both platforms)

---

## 🐛 Troubleshooting

### Backend Issues

- **500 errors**: Check Render logs in dashboard
- **Database connection**: Verify DATABASE_URL is set correctly
- **OpenAI errors**: Check API key is valid

### Frontend Issues

- **API connection failed**: Verify NEXT_PUBLIC_API_BASE_URL
- **Build errors**: Check Next.js version compatibility
- **CORS errors**: Update backend CORS settings

### Common Fixes

```bash
# Rebuild backend
git commit --allow-empty -m "Rebuild"
git push

# Clear Vercel cache
vercel --prod --force
```

---

## 📊 Monitoring

### Render Dashboard

- View logs: `Dashboard → Service → Logs`
- Metrics: CPU, Memory usage
- Events: Deployment history

### Vercel Dashboard

- Analytics: Page views, performance
- Logs: Build and runtime logs
- Deployments: Version history

---

## 🔐 Security Best Practices

1. **Environment Variables**

   - Never commit `.env` files
   - Use Render/Vercel secret management
   - Rotate API keys regularly

2. **Database**

   - Use SSL connections (enabled by default on Render)
   - Regular backups (manual on free tier)
   - Monitor for unusual activity

3. **API**
   - Implement rate limiting
   - Add authentication for admin endpoints
   - Monitor API usage

---

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
