# RDP WebSocket Server

A Node.js WebSocket server that proxies RDP connections to web browsers.

## Installation

```bash
npm install
```

## Usage

```bash
npm start
```

Server will run on http://localhost:8080

## Configuration

The server accepts WebSocket connections at: `ws://localhost:8080/remote?ip=<target_ip>&port=<target_port>`

Default RDP port: 3389

## Security Notes

⚠️ This is a basic implementation. For production:
- Add authentication
- Use HTTPS/WSS
- Validate inputs
- Store credentials securely
- Implement rate limiting
- Add proper error handling

## Requirements

- Node.js 14+
- Target machine with RDP enabled
- Network access to target machine
