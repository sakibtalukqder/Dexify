# Windows RDP Remote Desktop Viewer

Complete web-based solution for accessing Windows Remote Desktop (RDP) through a browser.

## Project Structure

```
remote_desk/
├── remote-desktop-viewer/    # React frontend (Port 3000)
└── rdp-websocket-server/     # Node.js backend (Port 8080)
```

## Quick Start

### 1. Start Backend Server (Required First!)

```bash
cd rdp-websocket-server
npm install
npm start
```

Backend will run on: http://localhost:8080

### 2. Start Frontend

```bash
cd remote-desktop-viewer
npm install
npm start
```

Frontend will open at: http://localhost:3000

## Usage

1. **Enable RDP on Target Windows PC**:
   - Right-click "This PC" → Properties
   - Click "Remote settings"
   - Enable "Allow remote connections to this computer"
   - Note the PC's IP address (run `ipconfig` in cmd)

2. **Connect from Browser**:
   - Open http://localhost:3000
   - Enter target PC's IP address (e.g., 192.168.3.94)
   - Enter port (default: 3389)
   - Enter Windows username (optional)
   - Enter Windows password (optional)
   - Click "Connect"

## Network Configuration

### For Local Network Access:
- Ensure both PCs are on same network
- Firewall must allow RDP (port 3389)
- Target PC must have RDP enabled

### For Internet Access:
- Configure router port forwarding (3389 → target PC)
- Use public IP or DDNS
- ⚠️ Security warning: Add VPN or strong authentication

## Troubleshooting

### "Connection failed" Error:
- ✅ Check backend server is running (localhost:8080)
- ✅ Verify target PC has RDP enabled
- ✅ Confirm correct IP address and port
- ✅ Check Windows Firewall allows RDP
- ✅ Ensure network connectivity between machines

### "Access Denied" Error:
- ✅ Verify Windows credentials are correct
- ✅ Ensure user has remote desktop permissions
- ✅ Check target PC allows remote connections

### Backend Server Issues:
- Update Node.js to version 14+
- Reinstall dependencies: `rm -rf node_modules && npm install`

## Docker Deployment

### Frontend:
```bash
cd remote-desktop-viewer
docker build -t rdp-viewer-frontend .
docker run -p 3000:3000 rdp-viewer-frontend
```

### Backend:
```bash
cd rdp-websocket-server
docker build -t rdp-viewer-backend .
docker run -p 8080:8080 rdp-viewer-backend
```

## Security Recommendations

⚠️ **Important**: This is a development setup. For production:

1. **Use HTTPS/WSS**: Enable SSL certificates
2. **Authentication**: Implement user authentication on backend
3. **Encryption**: Encrypt credentials in transit
4. **Rate Limiting**: Prevent brute force attacks
5. **Access Control**: Whitelist allowed IP addresses
6. **Logging**: Monitor and log all connections
7. **VPN**: Use VPN for remote access instead of exposing RDP

## Technical Details

- **Frontend**: React 18 + TypeScript + WebSocket
- **Backend**: Node.js + Express + WebSocket (ws) + node-rdpjs-2
- **Protocol**: WebSocket bridge to RDP (port 3389)
- **Resolution**: 1280x720 (configurable in server.js)

## Known Limitations

- Audio streaming not implemented
- Clipboard sharing not implemented
- File transfer not implemented
- Limited to one connection per session
- Performance depends on network speed

## Contributing

To improve this project:
1. Add authentication system
2. Implement TLS/SSL
3. Add session management
4. Improve error handling
5. Add connection status indicators

## License

MIT
