# Vercel Deployment Guide

## Quick Deploy

### Admin Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/admin-web`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

5. Add Environment Variable:
   - **Key**: `NEXT_PUBLIC_API_BASE_URL`
   - **Value**: `https://fynd-api.onrender.com` (or your backend URL)

6. Click "Deploy"

### User Dashboard

1. Repeat the same steps as above
2. Use **Root Directory**: `apps/user-web`
3. Add the same environment variable with your backend URL
4. Click "Deploy"

## Environment Variables

Both dashboards need this environment variable:

| Variable | Value | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_API_BASE_URL` | `https://your-api-url.com` | Backend API base URL |

### Setting Environment Variables in Vercel

1. Go to your project settings
2. Navigate to "Settings" → "Environment Variables"
3. Add `NEXT_PUBLIC_API_BASE_URL` with your backend URL
4. Select environments: Production, Preview, Development
5. Click "Save"

### Important Notes

- ⚠️ **DO NOT** use `localhost` URLs for production deployments
- ✅ Use your deployed backend URL (e.g., Render, Railway, etc.)
- 🔄 Redeploy after changing environment variables
- 🌐 `NEXT_PUBLIC_` prefix makes the variable accessible in browser

## Troubleshooting

### Error: "Secret does not exist"

**Solution**: The `vercel.json` files have been updated to remove secret references. Pull the latest changes and redeploy:

```bash
git pull origin main
git push
```

### Error: "API calls failing"

**Check**:
1. Verify `NEXT_PUBLIC_API_BASE_URL` is set correctly in Vercel dashboard
2. Ensure the backend URL is accessible (not localhost)
3. Check CORS settings in backend allow your Vercel domain

### Error: "Environment variable not found"

**Solution**: 
1. Go to Vercel project settings
2. Add the environment variable
3. Trigger a new deployment (Settings → Deployments → Redeploy)

## Backend URL Examples

Depending on where you deployed your backend:

- **Render**: `https://fynd-api.onrender.com`
- **Railway**: `https://fynd-api.railway.app`
- **Heroku**: `https://fynd-api.herokuapp.com`
- **Docker (Self-hosted)**: `https://your-domain.com`

## Alternative: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy admin dashboard
cd apps/admin-web
vercel --prod

# Deploy user dashboard
cd apps/user-web
vercel --prod
```

## Monorepo Configuration

If deploying from a monorepo, ensure:

1. **Root Directory** is set correctly (`apps/admin-web` or `apps/user-web`)
2. **Install Command** might need to be: `npm install` (Vercel auto-detects)
3. **Build Command**: `npm run build`

## After Deployment

1. Test the deployed URLs
2. Verify API connectivity by submitting a test review
3. Update README.md with your deployment URLs

## Support

If issues persist:
1. Check Vercel deployment logs
2. Verify backend is running and accessible
3. Test API endpoint directly: `curl https://your-api-url.com/health`
