# Environment Variables Documentation

This document describes all environment variables used in the FixFlow application.

## Setup Instructions

1. Copy `.env.example` to `.env` in the `fixflow-app` directory
2. Fill in the required values for your environment
3. Never commit `.env` files to version control

## Required Variables

### Core Environment
- `NODE_ENV`: Application environment (`development`, `test`, `production`)
- `DATABASE_URL`: PostgreSQL connection string
- `ENCRYPTION_KEY`: Secret key for NextAuth.js (generate with `openssl rand -base64 32`)

## Optional Variables

### Authentication
- `NEXTAUTH_URL`: Full URL of your application (required in production)

### Email Service
Configure SMTP settings for sending emails (notifications, password reset, etc.):
- `EMAIL_SERVER_HOST`: SMTP server hostname
- `EMAIL_SERVER_PORT`: SMTP server port
- `EMAIL_SERVER_USER`: SMTP username
- `EMAIL_SERVER_PASSWORD`: SMTP password
- `EMAIL_FROM`: From email address

### File Upload & Storage
- `UPLOAD_MAX_SIZE`: Maximum file size in bytes (default: 5MB)
- `ALLOWED_FILE_TYPES`: Comma-separated list of allowed MIME types

### Payment Processing (Stripe)
- `STRIPE_SECRET_KEY`: Stripe secret key for server-side operations
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook secret for verifying webhooks
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Stripe publishable key for client-side

### External APIs
- `GOOGLE_MAPS_API_KEY`: Server-side Google Maps API key
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: Client-side Google Maps API key

### Rate Limiting (Upstash Redis)
- `UPSTASH_REDIS_REST_URL`: Upstash Redis REST API URL
- `UPSTASH_REDIS_REST_TOKEN`: Upstash Redis REST API token

### Monitoring & Analytics
- `SENTRY_DSN`: Sentry DSN for error tracking
- `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID`: Google Analytics tracking ID
- `NEXT_PUBLIC_POSTHOG_KEY`: PostHog API key for product analytics

### Feature Flags
Server-side feature flags:
- `FEATURE_BILLING_ENABLED`: Enable/disable billing features
- `FEATURE_NOTIFICATIONS_ENABLED`: Enable/disable notifications
- `FEATURE_ANALYTICS_ENABLED`: Enable/disable analytics

Client-side feature flags:
- `NEXT_PUBLIC_FEATURE_DEMO_MODE`: Enable demo mode
- `NEXT_PUBLIC_FEATURE_MAINTENANCE_MODE`: Enable maintenance mode

### App Configuration
- `NEXT_PUBLIC_APP_NAME`: Application name (default: "FixFlow")
- `NEXT_PUBLIC_APP_VERSION`: Application version
- `NEXT_PUBLIC_APP_URL`: Full URL of the application
- `NEXT_PUBLIC_API_URL`: API base URL

### Contact Information
- `NEXT_PUBLIC_CONTACT_EMAIL`: Support email address
- `NEXT_PUBLIC_SUPPORT_PHONE`: Support phone number

## Example .env File

```bash
# Core
NODE_ENV=development
DATABASE_URL="postgresql://postgres:password@localhost:5432/fixflow"
ENCRYPTION_KEY="your-secret-key-here"

# Optional - Email
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=your-app-password
EMAIL_FROM=noreply@fixflow.com

# Optional - Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# Optional - Google Maps
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# App Configuration
NEXT_PUBLIC_APP_NAME=FixFlow
NEXT_PUBLIC_CONTACT_EMAIL=support@fixflow.com
```

## Environment Validation

The application uses `@t3-oss/env-nextjs` for environment variable validation. This ensures:

- Required variables are present
- Variables have correct types/formats
- Client-side variables are properly prefixed with `NEXT_PUBLIC_`
- Build fails early if environment is misconfigured

## Security Notes

1. Never commit `.env` files to version control
2. Use different secrets for each environment (dev, staging, production)
3. Rotate secrets regularly
4. Use environment-specific databases
5. Be careful with client-side variables - they're exposed to users

## Deployment

For production deployment, ensure all required variables are set in your hosting platform:

- Vercel: Use the Environment Variables section in project settings
- Railway: Use the Variables tab in your project
- Docker: Use environment variables or mounted secret files
- Other platforms: Follow their specific environment variable documentation 