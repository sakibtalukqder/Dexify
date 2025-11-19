# RDP Web Viewer - Alternative Setup Guide

Since the Node.js RDP library has authentication issues, here are better alternatives:

## Option 1: Use Apache Guacamole (RECOMMENDED)

Apache Guacamole is a production-ready HTML5 remote desktop gateway.

### Installation:

1. **Install Docker Desktop** (if not already installed)

2. **Run Guacamole with Docker:**
```bash
# Create network
docker network create guacamole-network

# Start guacd (Guacamole daemon)
docker run -d --name guacd --network guacamole-network guacamole/guacd

# Start Guacamole
docker run -d --name guacamole --network guacamole-network -p 8080:8080 guacamole/guacamole
```

3. **Access Guacamole:**
   - Open: http://localhost:8080/guacamole
   - Default login: `guacadmin` / `guacadmin`
   - Add RDP connection with your target IP and credentials

### Advantages:
- ✅ Production-ready and stable
- ✅ Full RDP support with audio, clipboard, file transfer
- ✅ Web-based, no special software needed
- ✅ Multi-user support
- ✅ Connection recording capability

---

## Option 2: Use Native Windows RDP + mstsc

Create a simple launcher that opens Windows Remote Desktop:

### Create RDP Launcher:

1. **Create batch file** (`connect.bat`):
```batch
@echo off
set /p ip="Enter IP Address: "
set /p user="Enter Username: "
cmdkey /generic:TERMSRV/%ip% /user:%user% /pass
mstsc /v:%ip%
```

2. **Run the batch file** - it will prompt for credentials and open RDP

---

## Option 3: Web-based RDP Clients (Commercial)

### MyrtilleIO
- Open source HTML5 RDP gateway
- GitHub: https://github.com/cedrozor/myrtille
- Requires Windows Server with IIS

### RD Web Access
- Built into Windows Server
- Provides web interface for RDP
- Requires Windows Server license

---

## Option 4: Use the Current App with External RDP

Keep your React app for the UI, but launch native RDP:

### Modified Approach:

1. Your web app collects IP/credentials
2. Generates a `.rdp` file with settings
3. User downloads and opens it with native RDP client

### Update frontend to generate RDP files:

```typescript
const handleConnect = () => {
  const rdpContent = `
screen mode id:i:2
use multimon:i:0
desktopwidth:i:1920
desktopheight:i:1080
session bpp:i:32
full address:s:${connection.ip}:${connection.port}
compression:i:1
keyboardhook:i:2
audiomode:i:0
redirectprinters:i:1
redirectcomports:i:0
redirectsmartcards:i:1
redirectclipboard:i:1
redirectposdevices:i:0
autoreconnection enabled:i:1
authentication level:i:2
prompt for credentials:i:0
negotiate security layer:i:1
username:s:${connection.username}
`;

  const blob = new Blob([rdpContent], { type: 'application/rdp' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${connection.ip}.rdp`;
  a.click();
  URL.revokeObjectURL(url);
};
```

---

## Recommendation

**For your use case, I strongly recommend Option 1 (Guacamole)**:

1. Easy setup with Docker (2 commands)
2. Works reliably with Windows RDP
3. No authentication issues
4. Professional solution
5. Can integrate with your React frontend

### Quick Start with Guacamole:

```bash
# One-line setup:
docker run --name guacamole --link guacd:guacd -d -p 8080:8080 guacamole/guacamole

# Access at: http://localhost:8080/guacamole
# Login: guacadmin / guacadmin
# Then configure your RDP connection in the UI
```

Your React app can then embed Guacamole or redirect to it.

---

## Why node-rdpjs doesn't work well

The `node-rdpjs` library:
- ❌ Outdated and unmaintained
- ❌ Authentication issues with modern Windows
- ❌ Doesn't support NLA (Network Level Authentication)
- ❌ Limited protocol support
- ❌ Poor error handling

That's why professional solutions use native RDP clients or proven gateways like Guacamole.
