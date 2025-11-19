const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 9091;

// Enhanced CORS configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'RDP Launcher API Running',
    port: PORT,
    platform: os.platform(),
    hostname: os.hostname(),
    info: 'POST to /api/launch-rdp to launch RDP connections'
  });
});

// API to launch RDP connection directly
app.post('/api/launch-rdp', (req, res) => {
  const { ip, port, username, password } = req.body;

  console.log(`📞 Received RDP launch request for ${username}@${ip}:${port || 3389}`);

  if (!ip || !username) {
    console.error('❌ Missing required fields');
    return res.json({ success: false, message: 'IP and username are required' });
  }

  try {
    // First, save credentials using cmdkey (Windows Credential Manager)
    if (password) {
      const cmdkeyCommand = `cmdkey /generic:TERMSRV/${ip} /user:"${username}" /pass:"${password}"`;
      
      exec(cmdkeyCommand, (error, stdout, stderr) => {
        if (error) {
          console.error(`⚠️ Warning: Failed to store credentials: ${error.message}`);
        } else {
          console.log(`✅ Stored credentials for ${username}@${ip}`);
        }
      });
    }

    // Create RDP file content with enhanced settings
    const rdpContent = `screen mode id:i:2
use multimon:i:0
desktopwidth:i:1920
desktopheight:i:1080
session bpp:i:32
winposstr:s:0,3,0,0,800,600
compression:i:1
keyboardhook:i:2
audiocapturemode:i:0
videoplaybackmode:i:1
connection type:i:7
networkautodetect:i:1
bandwidthautodetect:i:1
displayconnectionbar:i:1
enableworkspacereconnect:i:0
disable wallpaper:i:0
allow font smoothing:i:1
allow desktop composition:i:1
disable full window drag:i:0
disable menu anims:i:0
disable themes:i:0
disable cursor setting:i:0
bitmapcachepersistenable:i:1
full address:s:${ip}:${port || '3389'}
audiomode:i:0
redirectprinters:i:1
redirectcomports:i:0
redirectsmartcards:i:1
redirectclipboard:i:1
redirectposdevices:i:0
autoreconnection enabled:i:1
authentication level:i:0
prompt for credentials:i:0
negotiate security layer:i:1
remoteapplicationmode:i:0
alternate shell:s:
shell working directory:s:
gatewayhostname:s:
gatewayusagemethod:i:4
gatewaycredentialssource:i:4
gatewayprofileusagemethod:i:0
promptcredentialonce:i:0
gatewaybrokeringtype:i:0
use redirection server name:i:0
rdgiskdcproxy:i:0
kdcproxyname:s:
username:s:${username}
domain:s:
drivestoredirect:s:
enablecredsspsupport:i:1
smart sizing:i:1`;

    // Create temp directory if it doesn't exist
    const tempDir = path.join(os.tmpdir(), 'rdp-connections');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Write RDP file to temp directory
    const filename = `remote-${ip.replace(/\./g, '-')}-${Date.now()}.rdp`;
    const filepath = path.join(tempDir, filename);
    fs.writeFileSync(filepath, rdpContent, { encoding: 'utf8' });

    console.log(`✅ Created RDP file: ${filepath}`);

    // Send response immediately
    res.json({ 
      success: true, 
      message: 'RDP connection launched successfully',
      ip: ip,
      port: port || '3389',
      username: username
    });

    // Wait a moment for credentials to be stored, then launch RDP
    setTimeout(() => {
      const command = process.platform === 'win32' 
        ? `start mstsc "${filepath}"`
        : `xdg-open "${filepath}"`;
      
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`❌ Error launching RDP: ${error.message}`);
          return;
        }
        
        console.log(`🚀 Launched RDP connection to ${ip}`);
        
        // Clean up file after a delay
        setTimeout(() => {
          try {
            if (fs.existsSync(filepath)) {
              fs.unlinkSync(filepath);
              console.log(`🗑️ Cleaned up temp file: ${filename}`);
            }
          } catch (err) {
            console.error(`Failed to clean up temp file: ${err.message}`);
          }
        }, 10000); // Wait 10 seconds before cleanup
      });
    }, 500);

  } catch (err) {
    console.error('❌ Error:', err);
    res.json({ 
      success: false, 
      message: err.message 
    });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message
  });
});

// Start server on all interfaces
app.listen(PORT, '0.0.0.0', () => {
  console.log('========================================');
  console.log('🚀 RDP Launcher API Server Started');
  console.log('========================================');
  console.log(`📡 Listening on: http://0.0.0.0:${PORT}`);
  console.log(`🌐 Local access: http://localhost:${PORT}`);
  console.log(`💻 Platform: ${os.platform()}`);
  console.log(`🖥️  Hostname: ${os.hostname()}`);
  console.log('📝 Ready to launch RDP connections');
  console.log('========================================');
  console.log();
  console.log('API Endpoints:');
  console.log(`  GET  /           - Health check`);
  console.log(`  POST /api/launch-rdp - Launch RDP connection`);
  console.log();
  console.log('Press Ctrl+C to stop');
  console.log('========================================');
});

// Handle shutdown gracefully
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down RDP Launcher API...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n🛑 Shutting down RDP Launcher API...');
  process.exit(0);
});

