# Docker Setup for Market-Place Application

This document provides instructions for running the Market-Place application using Docker.

## Prerequisites

- Docker installed on your system
- Docker Compose installed on your system

## Environment Variables

Before running the application, you need to set up environment variables. Create a `.env` file in the root directory with the following variables:

```bash
# Application Configuration
NODE_ENV=production
PORT=3000

# Database Configuration
SQL_HOST=
SQL_USER=
SQL_PASS=
SQL_DB=
MYSQL_ROOT_PASSWORD=

# Redis Configuration
REDIS_URL=

# JWT Secret
SECRET_KEY=

# Email Configuration
EMAIL_USER=
EMAIL_PASS=

# Twilio Configuration
ACCOUNT_SSID=your_twilio_sid
ACCOUNT_AUTHTOKEN=your_twilio_auth_token

# AWS S3 Configuration
S3ENDPOINT=
S3ACCESSKEYID=
S3SECRETACCESSKEY=
R2BUCKET=
MYBUCKET=
```

Required environment variables:
- ACCOUNT_SSID=${TWILIO_ACCOUNT_SID}

## Running with Docker Compose

1. **Build and start all services:**
   ```bash
   docker-compose up --build
   ```

2. **Run in detached mode:**
   ```bash
   docker-compose up -d --build
   ```

3. **Stop all services:**
   ```bash
   docker-compose down
   ```

4. **Stop and remove volumes:**
   ```bash
   docker-compose down -v
   ```

## Running with Docker only

1. **Build the image:**
   ```bash
   docker build -t market-place .
   ```

2. **Run the container:**
   ```bash
   docker run -p 3000:3000 --env-file .env market-place
   ```

## Services

The application consists of the following services:

- **app**: Main Node.js application (port 3000)
- **mysql**: MySQL database (port 3306)
- **redis**: Redis cache (port 6379)

## Volumes

The following volumes are mounted:
- `./images` → `/app/images` (for uploaded images)
- `./videos` → `/app/videos` (for uploaded videos)
- `./bnsLogo` → `/app/bnsLogo` (for logo uploads)
- `mysql_data` → MySQL data persistence
- `redis_data` → Redis data persistence

## Health Check

The application includes a health check that runs every 30 seconds to ensure the service is running properly.

## Troubleshooting

1. **Port conflicts**: If ports 3000, 3306, or 6379 are already in use, modify the `docker-compose.yml` file to use different ports.

2. **Environment variables**: Make sure all required environment variables are set in your `.env` file.

3. **Database connection**: The application will wait for MySQL to be ready before starting. If you encounter connection issues, check the MySQL service logs:
   ```bash
   docker-compose logs mysql
   ```

4. **Permission issues**: The application runs as a non-root user (nodejs) for security. If you encounter permission issues, check the file ownership in the mounted volumes.

## Development

For development, you can modify the Dockerfile to include development dependencies:

```dockerfile
# Install all dependencies (including dev dependencies)
RUN npm ci
```

And update the docker-compose.yml to use nodemon:

```yaml
command: ["npm", "run", "dev"]
```