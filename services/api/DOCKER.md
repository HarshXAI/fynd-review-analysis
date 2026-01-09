# Docker Deployment Guide

This guide explains how to deploy the Fynd Review API using Docker.

## Prerequisites

- Docker (v20.10+)
- Docker Compose (v2.0+)
- API keys for LLM provider (OpenAI, Gemini, or OpenRouter)

## Quick Start

### 1. Environment Setup

Create a `.env` file in the `services/api/` directory:

```bash
# Database Configuration
POSTGRES_USER=fynd
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=fynd_reviews
POSTGRES_PORT=5432

# API Configuration
API_PORT=8000

# LLM Configuration
LLM_PROVIDER=openai
LLM_API_KEY=your_api_key_here
LLM_MODEL=gpt-3.5-turbo
```

### 2. Build and Run (Development)

```bash
cd services/api

# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build
```

The API will be available at `http://localhost:8000`

### 3. Build and Run (Production)

For production deployment with multi-stage build:

```bash
# Build production image
docker build -f Dockerfile.prod -t fynd-api:latest .

# Run with PostgreSQL
docker run -d \
  --name fynd-api \
  -p 8000:8000 \
  -e DATABASE_URL=postgresql://user:pass@host:5432/dbname \
  -e LLM_API_KEY=your_api_key \
  -e LLM_PROVIDER=openai \
  -e LLM_MODEL=gpt-3.5-turbo \
  fynd-api:latest
```

## Docker Commands

### Start Services
```bash
docker-compose up -d
```

### Stop Services
```bash
docker-compose down
```

### Stop and Remove Volumes
```bash
docker-compose down -v
```

### View Logs
```bash
# All services
docker-compose logs -f

# API only
docker-compose logs -f api

# PostgreSQL only
docker-compose logs -f postgres
```

### Rebuild After Code Changes
```bash
docker-compose up -d --build api
```

### Check Service Status
```bash
docker-compose ps
```

### Execute Commands in Container
```bash
# Access API container shell
docker-compose exec api bash

# Access PostgreSQL shell
docker-compose exec postgres psql -U fynd -d fynd_reviews
```

## Container Details

### API Container
- **Base Image**: python:3.11-slim
- **Port**: 8000
- **Health Check**: `/health` endpoint
- **Workers**: 4 (production build)

### PostgreSQL Container
- **Image**: postgres:16-alpine
- **Port**: 5432
- **Volume**: Persistent data storage
- **Health Check**: pg_isready

## File Structure

```
services/api/
├── Dockerfile              # Development Docker image
├── Dockerfile.prod         # Production Docker image (multi-stage)
├── docker-compose.yml      # Docker Compose configuration
├── .dockerignore          # Files to exclude from build
├── .env                   # Environment variables (create this)
├── .env.example           # Example environment file
└── requirements.txt       # Python dependencies
```

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection string | SQLite (dev) | Yes (prod) |
| `POSTGRES_USER` | PostgreSQL username | fynd | No |
| `POSTGRES_PASSWORD` | PostgreSQL password | - | Yes |
| `POSTGRES_DB` | PostgreSQL database name | fynd_reviews | No |
| `POSTGRES_PORT` | PostgreSQL port | 5432 | No |
| `API_PORT` | API port mapping | 8000 | No |
| `LLM_PROVIDER` | LLM provider (openai/gemini/openrouter) | openai | Yes |
| `LLM_API_KEY` | LLM API key | - | Yes |
| `LLM_MODEL` | LLM model name | gpt-3.5-turbo | No |

## Health Checks

The API includes built-in health checks:

```bash
# Check API health
curl http://localhost:8000/health

# Expected response
{"status": "ok"}
```

Docker also performs automatic health checks every 30 seconds.

## Production Deployment

### Docker Image Optimization

The production Dockerfile (`Dockerfile.prod`) uses:
- **Multi-stage build** to reduce image size
- **Non-root user** for security
- **Multiple workers** for better performance
- **Minimal dependencies** for smaller attack surface

### Deployment Platforms

#### Deploy to Render.com
```bash
# Render will automatically detect and use Dockerfile
# Set environment variables in Render dashboard
```

#### Deploy to AWS ECS/Fargate
```bash
# Build and push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com
docker build -f Dockerfile.prod -t fynd-api .
docker tag fynd-api:latest <account>.dkr.ecr.us-east-1.amazonaws.com/fynd-api:latest
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/fynd-api:latest
```

#### Deploy to Google Cloud Run
```bash
# Build and push to GCR
gcloud builds submit --tag gcr.io/PROJECT_ID/fynd-api
gcloud run deploy fynd-api --image gcr.io/PROJECT_ID/fynd-api --platform managed
```

#### Deploy to DigitalOcean App Platform
```bash
# Connect your GitHub repo
# App Platform will auto-detect Dockerfile
# Configure environment variables in dashboard
```

## Troubleshooting

### Container Won't Start
```bash
# Check logs
docker-compose logs api

# Check if port is already in use
lsof -i :8000

# Restart services
docker-compose restart
```

### Database Connection Issues
```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Check database logs
docker-compose logs postgres

# Test connection
docker-compose exec postgres psql -U fynd -d fynd_reviews
```

### API Performance Issues
```bash
# Monitor container resources
docker stats

# Increase workers (edit Dockerfile.prod CMD)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "8"]
```

### Clear Everything and Start Fresh
```bash
# Stop and remove everything
docker-compose down -v

# Remove all images
docker rmi $(docker images -q fynd-api)

# Rebuild
docker-compose up --build
```

## Security Best Practices

1. **Never commit `.env` files** - Use `.env.example` as template
2. **Use strong database passwords** in production
3. **Restrict CORS origins** in production (edit `main.py`)
4. **Run as non-root user** (already configured in Dockerfile.prod)
5. **Use secrets management** for API keys in production
6. **Enable HTTPS** with reverse proxy (nginx, Caddy, or cloud provider)
7. **Regular image updates** for security patches

## Monitoring

### Container Health
```bash
# Check health status
docker inspect --format='{{.State.Health.Status}}' fynd-api

# Watch health checks
watch 'docker inspect --format="{{json .State.Health}}" fynd-api | jq'
```

### Logs
```bash
# Follow logs with timestamps
docker-compose logs -f -t api

# Last 100 lines
docker-compose logs --tail=100 api
```

## Backup and Restore

### Backup PostgreSQL Database
```bash
docker-compose exec postgres pg_dump -U fynd fynd_reviews > backup.sql
```

### Restore PostgreSQL Database
```bash
docker-compose exec -T postgres psql -U fynd fynd_reviews < backup.sql
```

## Scaling

### Horizontal Scaling with Docker Swarm
```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml fynd

# Scale API service
docker service scale fynd_api=3
```

### Load Balancing
Use a reverse proxy like Nginx or Traefik to load balance across multiple API containers.

## Support

For issues or questions:
- Check logs: `docker-compose logs -f`
- Review health status: `curl http://localhost:8000/health`
- Inspect containers: `docker-compose ps`
