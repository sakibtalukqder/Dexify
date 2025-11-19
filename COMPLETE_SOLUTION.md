# 🎯 Complete Solution - Remote Desktop Web Application

## Overview

This application provides **two methods** to connect to remote Windows computers via RDP:

1. **🖥️ Windows RDP** - Native client (best performance)
2. **🌐 Browser RDP** - Web-based via Apache Guacamole (works anywhere)

## Architecture

```
┌─────────────────────┐
│   User Browser      │
│  (localhost:3000)   │
└──────────┬──────────┘
           │
     ┌─────┴──────┬──────────────┬─────────────┐
     │            │              │             │
┌────▼────┐  ┌───▼────┐  ┌─────▼──────┐ ┌───▼────────┐
│ React   │  │ RDP    │  │ Guacamole  │ │ Guacamole  │
│ Frontend│  │ API    │  │ Proxy      │ │ (Docker)   │
│ :3000   │  │ :9091  │  │ :9092      │ │ :9090      │
└─────────┘  └────┬───┘  └────┬───────┘ └────┬───────┘
                  │           │              │
              ┌───▼───────────▼──────────────▼────┐
              │                                    │
              │     Target Windows RDP Server     │
              │       (IP:3389)                   │
              └────────────────────────────────────┘
```

## Components

### 1. Frontend (React App) - Port 3000
- User interface for connection management
- Connection form with IP, username, password
- Saved connections with localStorage
- React Toastify for notifications (top-right)
- Two connection buttons: Windows RDP & Browser

### 2. RDP API Server (Node.js) - Port 9091
- **Runs natively on Windows** (NOT in Docker)
- Creates .rdp files with credentials
- Uses Windows Credential Manager (cmdkey)
- Launches native mstsc.exe (Windows RDP client)
- Auto-fills username and password

### 3. Guacamole Proxy (Node.js) - Port 9092
- Runs in Docker
- Proxies requests to Guacamole
- Auto-authenticates (bypasses login)
- Handles CORS
- Creates RDP connections dynamically

### 4. Apache Guacamole - Port 9090
- RDP gateway (guacd + web app)
- PostgreSQL database for connections
- Browser-based RDP client

## Setup Instructions

### Prerequisites

```powershell
# Check Docker
docker --version

# Check Node.js
node --version  # Should be v16 or higher
npm --version
```

### Installation

```powershell
# Clone or extract the project
cd remote_desk

# Install frontend dependencies
cd remote-desktop-viewer
npm install --legacy-peer-deps
cd ..

# Install backend dependencies
cd rdp-websocket-server
npm install
cd ..
```

### Starting the Application

**Method 1: Automated (Recommended)**
```powershell
.\start.bat
```

**Method 2: Manual**
```powershell
# Terminal 1: Start Docker services
docker-compose up -d

# Wait 45 seconds for initialization...

# Terminal 2: Start RDP API
cd rdp-websocket-server
node api-server.js
```

### Verifying Services

```powershell
.\check-status.bat
```

Or manually:
```powershell
# Check Docker containers
docker ps

# Test endpoints
curl http://localhost:3000
curl http://localhost:9091
curl http://localhost:9092
curl http://localhost:9090/guacamole/
```

## Usage Guide

### Connecting via Windows RDP (Recommended)

1. Open http://localhost:3000
2. Enter:
   - IP Address: e.g., `192.168.1.100`
   - Port: `3389` (default)
   - Username: e.g., `Administrator`
   - Password: Your password
3. Click **"🖥️ Windows RDP"**
4. Windows Remote Desktop opens automatically
5. ✅ Credentials are pre-filled

**Benefits:**
- Zero additional clicks
- Best performance
- All RDP features available
- Native Windows experience

### Connecting via Browser

1. Open http://localhost:3000
2. Enter connection details (same as above)
3. Click **"🌐 Browser"**
4. Guacamole opens in new tab
5. Connection starts automatically
6. ✅ No Windows client needed

**Benefits:**
- Works on any platform
- No client installation
- Remote-friendly
- Cross-platform

### Saving Connections

1. Fill in connection details
2. Click **"💾 Save"**
3. Enter a friendly name (e.g., "Office PC")
4. Click "Save"
5. ✅ Connection appears in saved list

### Using Saved Connections

1. Find saved connection in right panel
2. Click **"🖥️ RDP"** for native client
3. Or click **"🌐 Browser"** for web client
4. ✅ Connects instantly

### Removing Saved Connections

1. Click **"✕"** button on saved connection
2. Confirm removal
3. ✅ Connection deleted

## Troubleshooting

### Problem: Cannot connect to RDP API (port 9091)

**Cause:** RDP API server not running

**Solution:**
```powershell
cd rdp-websocket-server
node api-server.js
```

Check output for:
```
🚀 RDP Launcher API Server Started
📡 Listening on: http://0.0.0.0:9091
```

### Problem: CORS errors with Guacamole Proxy

**Cause:** Proxy not running or Guacamole not ready

**Solution:**
```powershell
# Check proxy logs
docker logs guacamole-proxy

# Restart if needed
docker restart guacamole-proxy

# Check if responding
curl http://localhost:9092/
```

### Problem: Guacamole not responding (port 9090)

**Cause:** Guacamole still initializing or database not ready

**Solution:**
```powershell
# Wait 30-60 seconds on first start

# Check logs
docker logs guacamole
docker logs guacdb
docker logs guacd

# Restart if needed
docker-compose restart guacamole
```

### Problem: Frontend not loading (port 3000)

**Cause:** React app not started or building

**Solution:**
```powershell
# Check logs
docker logs remote-desktop-viewer

# Restart container
docker restart remote-desktop-viewer

# Or run locally:
cd remote-desktop-viewer
npm start
```

### Problem: Toast notifications not showing

**Cause:** React Toastify not configured properly

**Solution:** Already fixed! Toasts show at top-right with:
- Success (green): Connection successful
- Error (red): Connection failed
- Warning (yellow): Missing info
- Info (blue): Confirmations

### Problem: "Cannot find type definition file for 'minimatch'"

**Cause:** TypeScript dependency issue during build

**Solution:**
The app now runs in development mode (no build needed). If you need to build:
```powershell
cd remote-desktop-viewer
npm install --legacy-peer-deps @types/minimatch
npm run build
```

But recommended: Just run `npm start` (dev mode).

### Problem: RDP launches but credentials not filled

**Cause:** cmdkey failed to store credentials

**Solution:**
1. Run as Administrator
2. Check Windows Credential Manager
3. Manually add credentials:
```powershell
cmdkey /generic:TERMSRV/192.168.1.100 /user:Administrator /pass:YourPassword
```

### Problem: Port already in use

**Solution:**
```powershell
# Find process using port
netstat -ano | findstr :3000
netstat -ano | findstr :9091

# Kill process
taskkill /PID <PID> /F

# Or change ports in docker-compose.yml
```

## Configuration

### Change Guacamole Admin Password

Edit `rdp-websocket-server/guacamole-proxy.js`:
```javascript
const GUACAMOLE_USER = 'your_new_username';
const GUACAMOLE_PASS = 'your_new_password';
```

Then restart:
```powershell
docker restart guacamole-proxy
```

### Change Ports

Edit `docker-compose.yml`:
```yaml
frontend:
  ports:
    - "3001:3000"  # Change 3001 to your preferred port

guacamole-proxy:
  ports:
    - "9093:9092"  # Change 9093 to your preferred port
```

### Enable Additional RDP Features

Edit `rdp-websocket-server/api-server.js`, add to rdpContent:
```
redirectdrives:i:1        # Redirect drives
redirectposdevices:i:1     # Redirect USB devices
camerastoredirect:s:*      # Redirect cameras
```

## Security Considerations

⚠️ **Important Security Notes:**

1. **Passwords in localStorage**: Saved connections store passwords in browser localStorage (plain text). Only use on trusted computers.

2. **Network Security**: This app should only be used on trusted networks. For internet exposure, add:
   - HTTPS/TLS
   - Authentication layer
   - Network firewall rules

3. **Guacamole Access**: Default credentials are `guacadmin/guacadmin`. Change these!

4. **RDP Security**: Ensure target machines have:
   - Strong passwords
   - Updated Windows
   - Network Level Authentication (NLA)
   - Firewall rules

## Performance Tips

1. **Use Windows RDP for best performance** - Native client is always faster
2. **Use Browser RDP when**:
   - On non-Windows devices
   - Behind restrictive firewalls
   - Need cross-platform access
3. **Close unused connections** to free resources
4. **Increase Docker resources** if Guacamole is slow (Docker Desktop → Settings → Resources)

## Advanced Features

### Viewing Connection Logs

```powershell
# All services
docker-compose logs -f

# Specific service
docker logs -f guacamole-proxy
docker logs -f remote-desktop-viewer

# RDP API (native)
cd rdp-websocket-server
node api-server.js  # Logs to console
```

### Backing Up Saved Connections

Saved connections are in browser localStorage. To backup:

1. Open browser DevTools (F12)
2. Console tab
3. Run:
```javascript
console.log(localStorage.getItem('savedConnections'));
// Copy the output
```

To restore:
```javascript
localStorage.setItem('savedConnections', 'PASTE_HERE');
```

### Database Backup (Guacamole)

```powershell
docker exec guacamole-postgres pg_dump -U guacamole_user guacamole_db > backup.sql
```

Restore:
```powershell
docker exec -i guacamole-postgres psql -U guacamole_user guacamole_db < backup.sql
```

## Project Structure

```
remote_desk/
├── docker-compose.yml          # Main orchestration
├── start.bat                   # Startup script
├── stop.bat                    # Shutdown script
├── check-status.bat            # Health check
├── QUICKSTART.md              # Quick guide
├── SOLUTION.md                # This file
│
├── remote-desktop-viewer/      # Frontend React app
│   ├── src/
│   │   ├── App.tsx            # Main app component
│   │   ├── App.css            # Styles
│   │   └── ...
│   ├── public/
│   ├── package.json
│   ├── Dockerfile
│   └── tsconfig.json
│
├── rdp-websocket-server/       # Backend services
│   ├── api-server.js          # RDP launcher (native Windows)
│   ├── guacamole-proxy.js     # Guacamole proxy (Docker)
│   ├── package.json
│   └── Dockerfile
│
└── guacamole-config/           # Guacamole configuration
    ├── initdb.sql             # Database initialization
    └── user-mapping.xml       # Connection configs
```

## API Reference

### RDP API (Port 9091)

**POST /api/launch-rdp**
```json
{
  "ip": "192.168.1.100",
  "port": "3389",
  "username": "Administrator",
  "password": "YourPassword"
}
```

Response:
```json
{
  "success": true,
  "message": "RDP connection launched successfully",
  "ip": "192.168.1.100",
  "port": "3389",
  "username": "Administrator"
}
```

### Guacamole Proxy API (Port 9092)

**POST /api/create-connection**
```json
{
  "ip": "192.168.1.100",
  "port": "3389",
  "username": "Administrator",
  "password": "YourPassword",
  "name": "Office PC"
}
```

Response:
```json
{
  "success": true,
  "connectionId": "123",
  "connectionName": "Office PC",
  "token": "AUTH_TOKEN",
  "message": "Connection created successfully"
}
```

## FAQ

**Q: Why run RDP API natively instead of in Docker?**
A: Windows mstsc.exe can only be launched from Windows host, not from Docker container.

**Q: Can I use this on Mac/Linux?**
A: Browser mode works on any platform. Windows RDP mode requires Windows.

**Q: How many concurrent connections?**
A: Limited by your system resources and Docker allocation.

**Q: Can I connect to non-Windows machines?**
A: This is designed for RDP (Windows). For SSH/VNC, modify Guacamole settings.

**Q: Is this production-ready?**
A: It's designed for personal/development use. Add security layers for production.

**Q: Why Guacamole authentication bypass?**
A: For seamless UX. The proxy auto-authenticates so users don't log in twice.

## Support

If you encounter issues:

1. Check logs: `docker-compose logs -f`
2. Run health check: `.\check-status.bat`
3. Restart services: `.\stop.bat && .\start.bat`
4. Check Windows Firewall
5. Verify target RDP server is accessible

## License

This solution uses:
- Apache Guacamole (Apache License 2.0)
- React (MIT License)
- Node.js (MIT License)
- Various npm packages (see package.json for licenses)

---

**🎉 You're all set! Enjoy your Remote Desktop Web Application!**

Access at: http://localhost:3000
