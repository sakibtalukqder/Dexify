# Windows RDP Web Viewer - Complete Setup Guide

## ⚠️ Issue with Current Implementation

The `node-rdpjs-2` library has authentication issues with modern Windows RDP servers. Error code 5 (Access Denied) occurs because the library doesn't properly support Network Level Authentication (NLA) which is enabled by default on Windows.

## ✅ RECOMMENDED SOLUTION: Apache Guacamole

Apache Guacamole is a clientless remote desktop gateway. It's production-ready and handles Windows RDP perfectly.

### Quick Setup (5 minutes):

#### Option A: Using Docker Compose (Easiest)

1. **Make sure Docker Desktop is running**

2. **Start Guacamole:**
```bash
cd c:\Users\iam Readoy\Desktop\remote_desk
docker-compose -f docker-compose-guacamole.yml up -d
```

3. **Access Guacamole:**
   - Open: http://localhost:8080/guacamole
   - Login: `guacadmin` / `guacadmin`

4. **Add RDP Connection:**
   - Click username (top-right) → Settings
   - Click "Connections" → "New Connection"
   - Name: "My PC"
   - Protocol: RDP
   - Network:
     - Hostname: 192.168.3.94 (your target IP)
     - Port: 3389
   - Authentication:
     - Username: Your Windows username
     - Password: Your Windows password
   - Click "Save"

5. **Connect:**
   - Go back to home
   - Click on your connection
   - You should see the remote desktop!

#### Option B: Manual Docker Commands

```bash
# Create network
docker network create guacamole-net

# Start guacd
docker run -d --name guacd --network guacamole-net guacamole/guacd

# Start guacamole
docker run -d --name guacamole --network guacamole-net -p 8080:8080 guacamole/guacamole
```

### Integrate with Your React App

Update your React frontend to redirect to Guacamole or embed it in an iframe:

```typescript
const handleConnect = () => {
  // Redirect to Guacamole with connection
  window.location.href = `http://localhost:8080/guacamole/#/client/${connectionId}`;
  
  // Or embed in iframe:
  // <iframe src="http://localhost:8080/guacamole" />
};
```

### Stop Guacamole

```bash
docker-compose -f docker-compose-guacamole.yml down
```

---

## Alternative: RDP File Generator

If you don't want to use Guacamole, create a simple RDP file generator:

### Update Frontend (App.tsx):

```typescript
const handleConnect = () => {
  // Generate RDP file
  const rdpContent = `screen mode id:i:2
desktopwidth:i:1920
desktopheight:i:1080
session bpp:i:32
full address:s:${connection.ip}:${connection.port}
username:s:${connection.username}
prompt for credentials:i:0
authentication level:i:2`;

  const blob = new Blob([rdpContent], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `remote-${connection.ip}.rdp`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  alert('RDP file downloaded! Open it with Remote Desktop Connection.');
};
```

Users download the `.rdp` file and open it with Windows Remote Desktop Client.

---

## Comparison

| Solution | Pros | Cons |
|----------|------|------|
| **Guacamole** | ✅ Works in browser<br>✅ No client software<br>✅ Production-ready<br>✅ Multi-protocol | Requires Docker |
| **RDP File** | ✅ Simple<br>✅ Uses native client<br>✅ Best performance | ❌ Not web-based<br>❌ Requires RDP client |
| **node-rdpjs** | ✅ Pure JavaScript | ❌ Doesn't work with modern Windows<br>❌ Authentication fails |

---

## Recommended Next Steps

1. **Stop the current backend server** (it won't work properly)
2. **Start Guacamole** using the Docker Compose command above
3. **Configure your RDP connection** in Guacamole
4. **Test the connection** directly in Guacamole
5. **Optionally**: Integrate Guacamole into your React frontend

---

## Troubleshooting

### Cannot access Guacamole:
- Make sure Docker Desktop is running
- Check if port 8080 is free: `netstat -ano | findstr :8080`
- Restart containers: `docker-compose -f docker-compose-guacamole.yml restart`

### RDP Connection fails in Guacamole:
- Verify target PC has RDP enabled
- Check firewall allows RDP (port 3389)
- Verify credentials are correct
- Make sure user is in "Remote Desktop Users" group

### Want to use a different port:
Edit `docker-compose-guacamole.yml` and change:
```yaml
ports:
  - "8888:8080"  # Use port 8888 instead
```

---

## For Production Use

1. Set up Guacamole with PostgreSQL/MySQL database
2. Enable HTTPS/SSL
3. Configure proper authentication (LDAP, SSO, etc.)
4. Set up user management
5. Enable session recording if needed

See Guacamole documentation: https://guacamole.apache.org/doc/gug/
