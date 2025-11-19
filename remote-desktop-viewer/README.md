# Remote Desktop Viewer

A React-based web application for viewing remote desktops via IP address.

## Features

- 🖥️ Connect to remote computers via IP address
- 🎨 Modern, responsive UI
- 🔒 WebSocket-based real-time communication
- 📱 Mobile-friendly design

## Setup

### Prerequisites

- Node.js 16+
- Docker (optional)

### Local Development

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Open http://localhost:3000

### Docker

Build and run with Docker:

```bash
docker build -t remote-desktop-viewer .
docker run -p 3000:3000 remote-desktop-viewer
```

## Backend Server Required

This is a frontend application. For actual remote desktop functionality, you need:

1. **Backend WebSocket Server**: Set up a server that handles VNC/RDP connections
   - Example: [noVNC](https://github.com/novnc/noVNC)
   - Example: [Apache Guacamole](https://guacamole.apache.org/)

2. **Update WebSocket URL**: In `src/App.tsx`, update the WebSocket connection URL:
```typescript
const ws = new WebSocket(`ws://your-backend-server/remote?ip=${connection.ip}&port=${connection.port}`);
```

3. **Configure Target Machines**: Enable VNC or RDP on target computers

## Usage

1. Enter the IP address of the remote computer
2. Enter the port (default: 3389 for RDP, 5900 for VNC)
3. Click "Connect"
4. The remote desktop will be displayed in the canvas area

## Security Note

⚠️ This is a demo application. For production use:
- Implement authentication
- Use HTTPS/WSS
- Add access controls
- Validate and sanitize inputs
- Use secure protocols

## License

MIT
