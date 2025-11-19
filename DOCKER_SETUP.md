# Docker Compose Setup for Remote Desktop Viewer

This Docker Compose setup runs both the frontend and backend services for the Remote Desktop Viewer application.

## Prerequisites

- Docker Desktop installed and running
- Windows with WSL2 (for Windows users)
- Ports 3000 and 8080 available

## Quick Start

### 1. Start all services

```bash
docker-compose up --build
```

Or run in detached mode (background):

```bash
docker-compose up -d --build
```

### 2. Access the application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080

### 3. Stop all services

```bash
docker-compose down
```

## Individual Service Commands

### Start only the backend
```bash
docker-compose up rdp-server
```

### Start only the frontend
```bash
docker-compose up frontend
```

### View logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f frontend
docker-compose logs -f rdp-server
```

### Rebuild after code changes
```bash
docker-compose up --build
```

### Remove all containers and volumes
```bash
docker-compose down -v
```

## Troubleshooting

### Port already in use
If you get an error about ports being in use:

```bash
# Stop any running containers
docker-compose down

# Kill processes on specific ports (Windows PowerShell)
netstat -ano | findstr :3000
taskkill /PID <PID> /F

netstat -ano | findstr :8080
taskkill /PID <PID> /F
```

### Container won't start
Check logs:
```bash
docker-compose logs <service-name>
```

Rebuild from scratch:
```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up
```

### TypeScript build errors
The frontend is configured to run in development mode, which should avoid build errors. If issues persist:

1. Clear node_modules and reinstall:
```bash
cd remote-desktop-viewer
rm -rf node_modules package-lock.json
npm install
cd ..
docker-compose up --build
```

## Environment Variables

You can customize the setup by creating a `.env` file:

```env
# Frontend port
FRONTEND_PORT=3000

# Backend port
BACKEND_PORT=8080

# Node environment
NODE_ENV=development
```

Then update docker-compose.yml to use these variables:
```yaml
ports:
  - "${FRONTEND_PORT:-3000}:3000"
```

## Network Configuration

Both services run on the same Docker network (`remote-desktop-network`) which allows them to communicate with each other.

## Development Workflow

1. Make code changes in your editor
2. The frontend has hot-reload enabled, so changes should reflect automatically
3. For backend changes, restart the service:
   ```bash
   docker-compose restart rdp-server
   ```

## Production Deployment

For production, you may want to:

1. Build the frontend for production
2. Serve it with nginx
3. Use environment-specific configuration

See `docker-compose-guacamole.yml` for an alternative production setup using Apache Guacamole.
