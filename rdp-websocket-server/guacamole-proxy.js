const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 9092;

// Use environment variable or default to Docker service name
const GUACAMOLE_URL = process.env.GUACAMOLE_URL || 'http://guacamole:8080/guacamole';
const GUACAMOLE_USER = 'guacadmin';
const GUACAMOLE_PASS = 'guacadmin';

// Enhanced CORS configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

// Store active tokens
let authToken = null;
let tokenExpiry = null;

// Function to get Guacamole auth token
async function getGuacamoleToken() {
  try {
    // Check if we have a valid token
    if (authToken && tokenExpiry && Date.now() < tokenExpiry) {
      return authToken;
    }

    // Get new token
    const response = await axios.post(
      `${GUACAMOLE_URL}/api/tokens`,
      new URLSearchParams({
        username: GUACAMOLE_USER,
        password: GUACAMOLE_PASS
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    authToken = response.data.authToken;
    tokenExpiry = Date.now() + (55 * 60 * 1000); // 55 minutes (token expires in 60)
    
    console.log('✅ Obtained Guacamole auth token');
    return authToken;
  } catch (error) {
    console.error('❌ Failed to get Guacamole token:', error.message);
    throw error;
  }
}

// API to create RDP connection in Guacamole
app.post('/api/create-connection', async (req, res) => {
  const { ip, port, username, password, name } = req.body;

  if (!ip || !username || !password) {
    return res.json({ 
      success: false, 
      message: 'IP, username and password are required' 
    });
  }

  try {
    const token = await getGuacamoleToken();
    
    const connectionName = name || `RDP-${ip.replace(/\./g, '-')}`;
    
    // Create connection via Guacamole REST API
    const connectionData = {
      name: connectionName,
      protocol: 'rdp',
      parameters: {
        hostname: ip,
        port: port || '3389',
        username: username,
        password: password,
        'ignore-cert': 'true',
        security: 'any',
        'enable-drive': 'true',
        'create-drive-path': 'true',
        'enable-wallpaper': 'true',
        'enable-theming': 'true',
        'enable-font-smoothing': 'true',
        'enable-full-window-drag': 'true',
        'enable-desktop-composition': 'true',
        'enable-menu-animations': 'true',
        'disable-bitmap-caching': 'false',
        'disable-offscreen-caching': 'false',
        'disable-glyph-caching': 'false'
      },
      attributes: {
        'max-connections': '1',
        'max-connections-per-user': '1'
      }
    };

    // First, get the data source identifier
    const dataSourceResponse = await axios.get(
      `${GUACAMOLE_URL}/api/session/data?token=${token}`
    );
    
    const dataSources = Object.keys(dataSourceResponse.data);
    const dataSource = dataSources[0]; // Use the first available data source
    
    console.log(`Using data source: ${dataSource}`);

    const response = await axios.post(
      `${GUACAMOLE_URL}/api/session/data/${dataSource}/connections?token=${token}`,
      connectionData,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    const connectionId = response.data.identifier;
    console.log(`✅ Created Guacamole connection: ${connectionName} (ID: ${connectionId})`);

    res.json({
      success: true,
      connectionId: connectionId,
      connectionName: connectionName,
      token: token,
      dataSource: dataSource,
      message: 'Connection created successfully'
    });

  } catch (error) {
    console.error('❌ Error creating connection:', error.response?.data || error.message);
    const errorMessage = error.response?.data?.message || error.message || 'Unexpected internal error';
    res.json({
      success: false,
      message: errorMessage,
      details: error.response?.data
    });
  }
});

// API to list all connections
app.get('/api/connections', async (req, res) => {
  try {
    const token = await getGuacamoleToken();
    
    // Get data source first
    const dataSourceResponse = await axios.get(
      `${GUACAMOLE_URL}/api/session/data?token=${token}`
    );
    
    const dataSources = Object.keys(dataSourceResponse.data);
    const dataSource = dataSources[0];
    
    const response = await axios.get(
      `${GUACAMOLE_URL}/api/session/data/${dataSource}/connections?token=${token}`
    );

    res.json({
      success: true,
      connections: response.data,
      dataSource: dataSource
    });

  } catch (error) {
    console.error('❌ Error listing connections:', error.message);
    res.json({
      success: false,
      message: error.message
    });
  }
});

// API to delete a connection
app.delete('/api/connections/:id', async (req, res) => {
  try {
    const token = await getGuacamoleToken();
    const connectionId = req.params.id;
    
    // Get data source first
    const dataSourceResponse = await axios.get(
      `${GUACAMOLE_URL}/api/session/data?token=${token}`
    );
    
    const dataSources = Object.keys(dataSourceResponse.data);
    const dataSource = dataSources[0];
    
    await axios.delete(
      `${GUACAMOLE_URL}/api/session/data/${dataSource}/connections/${connectionId}?token=${token}`
    );

    console.log(`🗑️ Deleted connection: ${connectionId}`);

    res.json({
      success: true,
      message: 'Connection deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting connection:', error.message);
    res.json({
      success: false,
      message: error.message
    });
  }
});

// Proxy WebSocket connections to Guacamole
app.use('/guacamole', createProxyMiddleware({
  target: GUACAMOLE_URL,
  changeOrigin: true,
  ws: true,
  pathRewrite: {
    '^/guacamole': ''
  },
  onProxyReq: async (proxyReq, req, res) => {
    // Auto-inject authentication token
    if (!req.url.includes('token=')) {
      try {
        const token = await getGuacamoleToken();
        const separator = req.url.includes('?') ? '&' : '?';
        req.url += `${separator}token=${token}`;
      } catch (error) {
        console.error('Failed to inject token:', error.message);
      }
    }
  }
}));

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'Guacamole Proxy Running',
    port: PORT,
    guacamoleUrl: GUACAMOLE_URL,
    authenticated: authToken ? true : false
  });
});

// Pre-authenticate on startup with retry logic
async function startServer() {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Guacamole Proxy running on http://0.0.0.0:${PORT}`);
    console.log(`🔗 Proxying to: ${GUACAMOLE_URL}`);
    
    // Try to authenticate, but don't block server startup
    setTimeout(async () => {
      try {
        await getGuacamoleToken();
        console.log(`✅ Pre-authenticated with Guacamole`);
      } catch (err) {
        console.error('❌ Failed to pre-authenticate with Guacamole:', err.message);
        console.log('⚠️ Will retry authentication on first API request');
      }
    }, 5000); // Wait 5 seconds for Guacamole to be ready
  });
}

startServer();
