# FixFlow Deployment Guide

This guide covers various deployment options for the FixFlow application, from local development to production environments.

## 🐳 Docker Deployment

### Prerequisites
- Docker Engine 20.10+
- Docker Compose 2.0+

### Local Development with Docker

1. **Clone and setup environment:**
```bash
git clone <repository-url>
cd fixflow-app
cp .env.example .env.local
```

2. **Configure environment variables:**
Edit `.env.local` with your database and authentication settings:
```env
DATABASE_URL="postgresql://fixflow:fixflow_password@localhost:5432/fixflow"
NEXTAUTH_URL="http://localhost:3000"
ENCRYPTION_KEY="your-secure-secret-key"
```

3. **Start services:**
```bash
# Start all services (app + database + redis)
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

4. **Database setup:**
```bash
# Run migrations
docker-compose exec app npm run db:migrate

# Seed database (optional)
docker-compose exec app npm run db:seed
```

### Production Docker Deployment

1. **Build production image:**
```bash
docker build -t fixflow-app:latest .
```

2. **Run with production settings:**
```bash
docker run -d \
  --name fixflow-app \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e DATABASE_URL="your-production-db-url" \
  -e NEXTAUTH_URL="https://your-domain.com" \
  -e ENCRYPTION_KEY="your-production-secret" \
  fixflow-app:latest
```

## ☁️ Cloud Platform Deployment

### Vercel (Recommended)

1. **Connect repository to Vercel:**
   - Import project from GitHub/GitLab
   - Framework preset: Next.js
   - Root directory: `fixflow-app`

2. **Configure environment variables:**
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `NEXTAUTH_URL`: Your production URL
   - `ENCRYPTION_KEY`: Random secure string

3. **Database setup:**
   - Use Vercel Postgres, Supabase, or external PostgreSQL
   - Run migrations: `npx prisma migrate deploy`

### Railway

1. **Deploy via CLI:**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

2. **Configure services:**
   - Add PostgreSQL plugin
   - Set environment variables
   - Connect domain

### DigitalOcean App Platform

1. **Create app spec:**
```yaml
name: fixflow-app
services:
- name: web
  source_dir: fixflow-app
  github:
    repo: your-username/fixflow
    branch: main
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  env:
  - key: NODE_ENV
    value: production
databases:
- name: fixflow-db
  engine: PG
  version: "15"
```

### AWS (Docker + ECS)

1. **Push to ECR:**
```bash
# Create ECR repository
aws ecr create-repository --repository-name fixflow-app

# Get login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build and push
docker build -t fixflow-app .
docker tag fixflow-app:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/fixflow-app:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/fixflow-app:latest
```

2. **ECS Task Definition:**
```json
{
  "family": "fixflow-app",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [
    {
      "name": "fixflow-app",
      "image": "<account-id>.dkr.ecr.us-east-1.amazonaws.com/fixflow-app:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ]
    }
  ]
}
```

## 🔧 Production Configuration

### Environment Variables

**Required:**
- `NODE_ENV=production`
- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_URL`: Your application URL
- `ENCRYPTION_KEY`: Secure random string (32+ characters)

**Optional:**
- `REDIS_URL`: Redis connection for sessions
- `EMAIL_SERVER_URL`: SMTP server for emails
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`: OAuth
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`: OAuth

### Database Setup

1. **Run migrations:**
```bash
npx prisma migrate deploy
```

2. **Generate Prisma client:**
```bash
npx prisma generate
```

3. **Seed initial data (optional):**
```bash
npx tsx prisma/seed.ts
```

### Health Checks

The application includes a health check endpoint at `/api/health`:

```bash
curl http://your-domain.com/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456
}
```

## 🔒 Security Considerations

### SSL/HTTPS
- Always use HTTPS in production
- Configure proper SSL certificates
- Use HSTS headers

### Environment Security
- Never commit `.env` files
- Use secrets management (AWS Secrets Manager, etc.)
- Rotate secrets regularly

### Database Security
- Use connection pooling
- Enable SSL for database connections
- Regular backups and monitoring

### Application Security
- Keep dependencies updated
- Use security headers
- Implement rate limiting
- Monitor for vulnerabilities

## 📊 Monitoring & Logging

### Application Monitoring
- Health check endpoint: `/api/health`
- Next.js built-in analytics
- Custom metrics via APM tools

### Infrastructure Monitoring
- Docker container health
- Database performance
- Memory and CPU usage
- Network traffic

### Logging
- Structured JSON logging
- Error tracking (Sentry)
- Access logs
- Database query logs

## 🚀 CI/CD Pipeline

Example GitHub Actions workflow:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm test
        
      - name: Build application
        run: npm run build
        
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 📋 Troubleshooting

### Common Issues

1. **Build failures:**
   - Check Node.js version (20+)
   - Verify all environment variables
   - Clear `.next` cache

2. **Database connection issues:**
   - Verify DATABASE_URL format
   - Check network connectivity
   - Ensure database is running

3. **Authentication problems:**
   - Verify NEXTAUTH_URL matches domain
   - Check ENCRYPTION_KEY is set
   - Ensure OAuth provider settings

### Debug Commands

```bash
# Check application logs
docker-compose logs -f app

# Verify database connection
docker-compose exec app npx prisma db pull

# Test health endpoint
curl http://localhost:3000/api/health

# Check environment variables
docker-compose exec app env | grep -E "(DATABASE|NEXTAUTH)"
```

## 📞 Support

For deployment issues:
1. Check this documentation
2. Review application logs
3. Consult Next.js deployment docs
4. Contact development team

---

**Note:** This deployment guide is specific to the FixFlow application. Adjust configurations based on your specific requirements and infrastructure setup. 