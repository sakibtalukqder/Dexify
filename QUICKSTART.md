# 🚀 Quick Start Guide - Remote Desktop Web App

## Prerequisites

1. **Docker Desktop** - Must be running
2. **Node.js** (v16+) - For RDP API server
3. **Windows OS** - For native RDP support

## Installation

### Step 1: Install Dependencies

```bash
# Install frontend dependencies
cd remote-desktop-viewer
npm install --legacy-peer-deps
cd ..

# Install backend dependencies
cd rdp-websocket-server
npm install
cd ..
```

### Step 2: Start Services

**Option A: Use the start script (Recommended)**
```bash
start.bat
```

**Option B: Manual startup**
```bash
# Start Docker services
docker-compose up -d

# Wait 45 seconds for Guacamole to initialize
# Then start RDP API (native Windows)
cd rdp-websocket-server
node api-server.js
```

### Step 3: Access the Application

Open your browser to: **http://localhost:3000**

## 🎯 How to Use

### Method 1: Windows RDP (Recommended) 🖥️

1. Enter IP address, username, and password
2. Click **"🖥️ Windows RDP"**
3. Windows Remote Desktop opens automatically with credentials pre-filled
4. ✅ Best performance, all features

### Method 2: Browser RDP 🌐

1. Enter IP address, username, and password
2. Click **"🌐 Browser"**
3. Connects via Guacamole (web-based RDP client)
4. ✅ Works anywhere, no client needed

### Saving Connections 💾

1. Fill in connection details
2. Click **"💾 Save"**
3. Enter a friendly name
4. Connection saved for quick access
5. Click saved connections to reconnect instantly

## 🔧 Troubleshooting

### Issue: Cannot connect to services

**Solution:**
```bash
# Check if all services are running
docker ps

# Check specific service logs
docker logs guacamole
docker logs guacamole-proxy
docker logs remote-desktop-viewer

# Restart everything
stop.bat
start.bat
```

### Issue: Guacamole not responding

**Solution:**
```bash
# Wait for Guacamole to fully initialize (takes 30-60 seconds)
# Check status:
curl http://localhost:9090/guacamole/

# If still not working, restart:
docker restart guacamole
```

### Issue: RDP API not working

**Solution:**
```bash
# Make sure Node.js is installed
node --version

# Restart the API manually
cd rdp-websocket-server
node api-server.js
```

### Issue: CORS errors

**Solution:**
The Guacamole proxy handles CORS. Make sure it's running:
```bash
curl http://localhost:9092/
```

### Issue: Toast notifications not showing

The app uses React Toastify with:
- Position: top-right
- Auto-close: 3-5 seconds
- Dark theme

Check browser console for errors.

## 📊 Port Reference

| Service | Port | URL |
|---------|------|-----|
| Frontend | 3000 | http://localhost:3000 |
| Guacamole | 9090 | http://localhost:9090/guacamole |
| RDP API | 9091 | http://localhost:9091 |
| Guac Proxy | 9092 | http://localhost:9092 |

## 🛑 Stopping Services

```bash
stop.bat
```

Or manually:
```bash
# Stop Docker containers
docker-compose down

# Kill Node.js processes
taskkill /F /IM node.exe
```

## 🔐 Default Credentials

**Guacamole (if accessing directly):**
- Username: `guacadmin`
- Password: `guacadmin`

**Note:** The proxy bypasses Guacamole login when using "Browser" button.

## 💡 Tips

1. **First-time setup**: Guacamole takes 30-60 seconds to initialize on first run
2. **Best performance**: Use "Windows RDP" button for native experience
3. **Remote access**: Use "Browser" button when Windows client isn't available
4. **Save connections**: Store frequently used connections for one-click access
5. **Multiple PCs**: You can have unlimited saved connections

## 🐛 Known Issues

1. **First connection to Guacamole may take time** - Database initialization
2. **RDP API must run natively on Windows** - Cannot be dockerized due to Windows RDP client dependency
3. **Port conflicts** - Ensure ports 3000, 9090, 9091, 9092 are available

## 📝 Advanced Configuration

### Change Guacamole credentials

Edit `rdp-websocket-server/guacamole-proxy.js`:
```javascript
const GUACAMOLE_USER = 'your_username';
const GUACAMOLE_PASS = 'your_password';
```

### Change ports

Edit `docker-compose.yml` and update port mappings.

### Enable persistent connections

Connections are saved in browser localStorage automatically.

## 🆘 Need Help?

1. Check logs: `docker-compose logs -f`
2. Restart services: `stop.bat && start.bat`
3. Clear browser cache and reload
4. Check Windows Firewall settings
5. Ensure Docker Desktop has enough resources (2GB+ RAM)

## ✅ Success Checklist

- [ ] Docker Desktop running
- [ ] All 4 containers running (`docker ps`)
- [ ] Can access http://localhost:3000
- [ ] Can access http://localhost:9092
- [ ] RDP API responding at http://localhost:9091
- [ ] No firewall blocking connections
- [ ] Target RDP server accessible from your network

---

**Ready to connect!** 🎉

Open http://localhost:3000 and start connecting to your remote computers!
