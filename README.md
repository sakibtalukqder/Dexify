# Remote Desktop Web Application - Quick Start Guide

## Overview
This application allows you to connect to Windows Remote Desktop (RDP) through your web browser with automatic authentication bypass.

## Features
- ✅ **Direct Windows RDP Connection**: Launch native Windows Remote Desktop
- 🌐 **Browser-Based RDP**: Connect through Apache Guacamole in your browser
- 💾 **Save Connections**: Store credentials for quick access
- 🔐 **Auto-Authentication**: No need to login to Guacamole separately
- 📱 **Modern UI**: Clean, responsive interface with toast notifications

## Quick Start

### Prerequisites
- Docker Desktop installed and running
- Windows PC with Remote Desktop enabled on target machines

### Step 1: Start All Services

```bash
docker-compose up -d
```

This will start:
- **Frontend** (localhost:3000) - Main web interface
- **Guacamole** (localhost:9090) - RDP gateway (used internally)
- **Guacamole Proxy** (localhost:9092) - Authentication bypass proxy
- **RDP Launcher API** (localhost:9091) - Native RDP launcher
- **PostgreSQL** - Guacamole database

### Step 2: Initialize Guacamole Database (First Time Only)

Wait 30 seconds for services to start, then run:

```bash
docker exec -it guacamole-postgres psql -U guacamole_user -d guacamole_db -f /guacamole/schema/001-create-schema.sql
docker exec -it guacamole-postgres psql -U guacamole_user -d guacamole_db -f /guacamole/schema/002-create-admin-user.sql
```

Or simply restart the containers:

```bash
docker-compose restart
```

### Step 3: Access the Application

Open your browser and go to: **http://localhost:3000**

## How to Use

### Option 1: Native Windows RDP Connection

1. Enter the IP address of the remote PC
2. Enter port (default: 3389)
3. Enter username and password
4. Click **"Connect"**
5. Windows Remote Desktop will launch automatically with saved credentials

### Option 2: Browser-Based Connection

1. Enter the IP address, port, username, and password
2. Click **"Connect from Browser"**
3. A new browser tab will open with the remote desktop session
4. **No additional login required** - you'll be connected directly!

### Saving Connections

After connecting, you can save the connection:
1. Your connection appears in the "Recent Connections" section
2. Click the save icon to name and store it
3. Next time, just click the saved connection to reconnect instantly

### Managing Saved Connections

- Click saved connection to connect via Windows RDP
- Use the browser icon to connect through your browser
- Click the trash icon to remove saved connections

## Architecture

```
┌─────────────────────┐
│   Frontend (3000)   │ ← You access this
└──────────┬──────────┘
           │
           ├─→ RDP Launcher API (9091) → Windows RDP Client
           │
           └─→ Guacamole Proxy (9092) ─→ Guacamole (9090) ─→ Remote PC
                  ↑ Auto-authentication      ↑
                  └─────────────────────────┘
```

## Troubleshooting

### Cannot connect to remote PC
- Ensure Remote Desktop is enabled on the target PC
- Check Windows Firewall allows RDP (port 3389)
- Verify network connectivity to the remote PC

### "Cannot connect to proxy service" error
```bash
# Check if proxy is running
docker ps | grep guacamole-proxy

# View proxy logs
docker logs guacamole-proxy

# Restart proxy
docker-compose restart guacamole-proxy
```

### "Cannot connect to launcher service" error
```bash
# Check if launcher is running
docker ps | grep rdp-launcher

# Restart launcher
docker-compose restart rdp-launcher
```

### Browser connection not working
```bash
# Check all Guacamole services
docker ps | grep guac

# View Guacamole logs
docker logs guacamole
docker logs guacd

# Restart all Guacamole services
docker-compose restart guacamole guacd guacdb guacamole-proxy
```

### View all service logs
```bash
docker-compose logs -f
```

## Stopping Services

```bash
# Stop all services
docker-compose down

# Stop and remove all data
docker-compose down -v
```

## Development Mode

To run without Docker:

1. **Start Guacamole Stack**:
```bash
docker-compose up guacamole guacd guacdb -d
```

2. **Start Proxy Server**:
```bash
cd rdp-websocket-server
node guacamole-proxy.js
```

3. **Start Launcher API**:
```bash
cd rdp-websocket-server
node api-server.js
```

4. **Start Frontend**:
```bash
cd remote-desktop-viewer
npm start
```

## Security Notes

⚠️ **Important**: This application is designed for local/private network use.

- The proxy server bypasses Guacamole authentication for convenience
- Default credentials: guacadmin/guacadmin
- Saved passwords are stored in browser localStorage (encrypted recommended for production)
- Use HTTPS in production environments
- Restrict network access to trusted users only

## Advanced Configuration

### Change Guacamole Admin Password

1. Access Guacamole directly: http://localhost:9090/guacamole
2. Login with: guacadmin / guacadmin
3. Go to Settings → Users → guacadmin → Change Password
4. Update `guacamole-proxy.js` with new credentials

### Customize Connection Parameters

Edit `rdp-websocket-server/guacamole-proxy.js` to modify RDP settings:
- Screen resolution
- Audio redirection
- Drive sharing
- Clipboard sharing
- etc.

## Support

For issues or questions, check:
- Application logs: `docker-compose logs`
- Guacamole logs: `docker logs guacamole`
- Proxy logs: `docker logs guacamole-proxy`

## License

MIT License - Free to use and modify
