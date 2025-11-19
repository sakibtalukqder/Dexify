const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const os = require('os');

const app = express();
const PORT = 9091;

app.use(cors());
app.use(express.json());

// API to launch RDP connection directly
app.post('/api/launch-rdp', (req, res) => {
  const { ip, port, username, password } = req.body;

  if (!ip || !username) {
    return res.json({ success: false, message: 'IP and username are required' });
  }

  try {
    // First, save credentials using cmdkey (Windows Credential Manager)
    if (password) {
      const cmdkeyCommand = `cmdkey /generic:TERMSRV/${ip} /user:${username} /pass:${password}`;
      
      exec(cmdkeyCommand, (error) => {
        if (error) {
          console.error(`Warning: Failed to store credentials: ${error.message}`);
        } else {
          console.log(`✅ Stored credentials for ${username}@${ip}`);
        }
      });
    }

    // Create RDP file content
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
allow font smoothing:i:0
allow desktop composition:i:0
disable full window drag:i:1
disable menu anims:i:1
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
authentication level:i:2
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
drivestoredirect:s:`;

    // Create temp directory if it doesn't exist
    const tempDir = path.join(os.tmpdir(), 'rdp-connections');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Write RDP file to temp directory
    const filename = `remote-${ip}-${Date.now()}.rdp`;
    const filepath = path.join(tempDir, filename);
    fs.writeFileSync(filepath, rdpContent);

    console.log(`✅ Created RDP file: ${filepath}`);

    // Wait a moment for credentials to be stored, then launch RDP
    setTimeout(() => {
      const command = `start mstsc "${filepath}"`;
      
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error launching RDP: ${error.message}`);
          return res.json({ success: false, message: 'Failed to launch RDP client' });
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
        }, 5000);
      });
    }, 500);

    res.json({ 
      success: true, 
      message: 'RDP connection launched successfully'
    });

  } catch (err) {
    console.error('Error:', err);
    res.json({ 
      success: false, 
      message: err.message 
    });
  }
});

// API to create Guacamole connection dynamically
app.post('/api/create-guacamole-connection', (req, res) => {
  const { ip, port, username, password } = req.body;

  if (!ip || !username || !password) {
    return res.json({ success: false, message: 'IP, username and password are required' });
  }

  try {
    const connectionName = `RDP-${ip.replace(/\./g, '-')}-${Date.now()}`;
    
    // Read existing user-mapping.xml or create new one
    const configPath = path.join(__dirname, '..', 'guacamole-config', 'user-mapping.xml');
    let xml = '';
    
    if (fs.existsSync(configPath)) {
      xml = fs.readFileSync(configPath, 'utf8');
      // Remove closing tags to append new connection
      xml = xml.replace('</authorize>', '').replace('</user-mapping>', '');
    } else {
      xml = `<user-mapping>\n    <authorize username="admin" password="admin">\n`;
    }
    
    // Add new connection
    xml += `        <connection name="${connectionName}">\n`;
    xml += `            <protocol>rdp</protocol>\n`;
    xml += `            <param name="hostname">${ip}</param>\n`;
    xml += `            <param name="port">${port || '3389'}</param>\n`;
    xml += `            <param name="username">${username}</param>\n`;
    xml += `            <param name="password">${password}</param>\n`;
    xml += `            <param name="ignore-cert">true</param>\n`;
    xml += `            <param name="security">any</param>\n`;
    xml += `            <param name="enable-drive">true</param>\n`;
    xml += `            <param name="create-drive-path">true</param>\n`;
    xml += `        </connection>\n`;
    xml += `    </authorize>\n</user-mapping>`;
    
    // Write updated XML
    fs.writeFileSync(configPath, xml);
    console.log(`✅ Added Guacamole connection: ${connectionName}`);
    
    // Restart Guacamole to load new connection
    exec('docker restart guacamole', (error) => {
      if (error) {
        console.error('Failed to restart Guacamole:', error.message);
      } else {
        console.log('🔄 Restarted Guacamole container');
      }
    });
    
    res.json({ 
      success: true, 
      connectionName,
      message: 'Guacamole connection created successfully'
    });
    
  } catch (err) {
    console.error('Error:', err);
    res.json({ 
      success: false, 
      message: err.message 
    });
  }
});

app.get('/', (req, res) => {
  res.json({ 
    status: 'RDP Launcher API Running',
    port: PORT,
    info: 'POST to /api/launch-rdp to launch RDP connections'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 RDP Launcher API running on http://localhost:${PORT}`);
  console.log('📡 Ready to launch RDP connections automatically');
});

