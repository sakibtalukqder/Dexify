import React, { useState, useRef, useEffect } from 'react';
import './App.css';

interface Connection {
  ip: string;
  port: string;
  username: string;
  password: string;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
}

interface SavedConnection {
  id: string;
  name: string;
  ip: string;
  port: string;
  username: string;
  password: string;
  lastConnected?: string;
}

function App() {
  const [connection, setConnection] = useState<Connection>({
    ip: '',
    port: '3389',
    username: '',
    password: '',
    status: 'disconnected'
  });
  const [error, setError] = useState<string>('');
  const [savedConnections, setSavedConnections] = useState<SavedConnection[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState<boolean>(false);
  const [saveConnectionName, setSaveConnectionName] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Load saved connections from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('savedConnections');
    if (saved) {
      try {
        setSavedConnections(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load saved connections:', e);
      }
    }
  }, []);

  // Save connections to localStorage whenever they change
  useEffect(() => {
    if (savedConnections.length > 0) {
      localStorage.setItem('savedConnections', JSON.stringify(savedConnections));
    }
  }, [savedConnections]);

  const saveConnection = () => {
    if (!saveConnectionName.trim()) {
      alert('Please enter a name for this connection');
      return;
    }

    const newConnection: SavedConnection = {
      id: Date.now().toString(),
      name: saveConnectionName.trim(),
      ip: connection.ip,
      port: connection.port,
      username: connection.username,
      password: connection.password,
      lastConnected: new Date().toISOString()
    };

    setSavedConnections(prev => [...prev, newConnection]);
    setSaveConnectionName('');
    setShowSaveDialog(false);
    alert(`✅ Connection "${newConnection.name}" saved successfully!`);
  };

  const loadConnection = (saved: SavedConnection) => {
    setConnection({
      ip: saved.ip,
      port: saved.port,
      username: saved.username,
      password: saved.password,
      status: 'disconnected'
    });
  };

  const removeConnection = (id: string) => {
    if (confirm('Are you sure you want to remove this saved connection?')) {
      setSavedConnections(prev => prev.filter(conn => conn.id !== id));
    }
  };

  const connectToSaved = (saved: SavedConnection, useBrowser: boolean = false) => {
    // Update last connected time
    setSavedConnections(prev => 
      prev.map(conn => 
        conn.id === saved.id 
          ? { ...conn, lastConnected: new Date().toISOString() }
          : conn
      )
    );

    // Load connection and connect
    setConnection({
      ip: saved.ip,
      port: saved.port,
      username: saved.username,
      password: saved.password,
      status: 'connecting'
    });

    setError('');

    if (useBrowser) {
      handleConnectBrowserWithData(saved);
    } else {
      handleConnectWithData(saved);
    }
  };

  const handleConnectWithData = (data: { ip: string; port: string; username: string; password: string }) => {
    fetch('http://localhost:9091/api/launch-rdp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
      if (result.success) {
        setConnection(prev => ({ ...prev, status: 'connected' }));
        setTimeout(() => {
          alert('✅ Windows Remote Desktop is opening!\n\nYour credentials have been saved. The connection should open automatically.');
        }, 500);
      } else {
        setError('Failed to launch RDP: ' + result.message);
        setConnection(prev => ({ ...prev, status: 'error' }));
      }
    })
    .catch(err => {
      setError('Cannot connect to launcher service. Make sure the API server is running on port 9091.');
      setConnection(prev => ({ ...prev, status: 'error' }));
      console.error('Connection error:', err);
    });
  };

  const handleConnect = () => {
    if (!connection.ip) {
      setError('Please enter an IP address');
      return;
    }

    if (!connection.username || !connection.password) {
      setError('Username and password are required for RDP connection');
      return;
    }

    setError('');
    setConnection(prev => ({ ...prev, status: 'connecting' }));
    handleConnectWithData(connection);
  };

  const handleConnectBrowserWithData = (data: { ip: string; port: string; username: string; password: string }) => {
    fetch('http://localhost:9091/api/create-guacamole-connection', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
      if (result.success) {
        setConnection(prev => ({ ...prev, status: 'connected' }));
        window.open('http://localhost:9090/guacamole', '_blank');
        setTimeout(() => {
          alert('✅ Guacamole is opening!\n\nLogin: admin / admin\nThen click on your connection to connect.');
        }, 500);
      } else {
        setError('Failed to create Guacamole connection: ' + result.message);
        setConnection(prev => ({ ...prev, status: 'error' }));
      }
    })
    .catch(err => {
      setError('Cannot connect to API service. Make sure the API server is running on port 9091.');
      setConnection(prev => ({ ...prev, status: 'error' }));
      console.error('Connection error:', err);
    });
  };

  const handleConnectBrowser = () => {
    if (!connection.ip) {
      setError('Please enter an IP address');
      return;
    }

    if (!connection.username || !connection.password) {
      setError('Username and password are required for RDP connection');
      return;
    }

    setError('');
    setConnection(prev => ({ ...prev, status: 'connecting' }));
    handleConnectBrowserWithData(connection);
  };

  const handleDisconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnection(prev => ({ ...prev, status: 'disconnected' }));
  };

  const drawBitmap = (bitmapData: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      // Decode base64 bitmap data
      const imageData = ctx.createImageData(bitmapData.width, bitmapData.height);
      const binaryData = atob(bitmapData.data);
      
      for (let i = 0; i < binaryData.length; i++) {
        imageData.data[i] = binaryData.charCodeAt(i);
      }
      
      ctx.putImageData(imageData, bitmapData.x, bitmapData.y);
    } catch (err) {
      console.error('Error drawing bitmap:', err);
    }
  };

  const drawFrame = (data: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw demo pattern
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#64748b';
    ctx.font = '24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Remote Desktop Display', canvas.width / 2, canvas.height / 2 - 40);
    ctx.font = '16px monospace';
    ctx.fillText(`Connected to: ${connection.ip}:${connection.port}`, canvas.width / 2, canvas.height / 2);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px monospace';
    ctx.fillText('Waiting for screen data...', canvas.width / 2, canvas.height / 2 + 40);
  };

  useEffect(() => {
    if (connection.status === 'connected') {
      drawFrame(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connection.status]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (connection.status === 'connected' && wsRef.current) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Send mouse click to remote
      wsRef.current.send(JSON.stringify({
        type: 'mouse',
        action: 'click',
        x,
        y
      }));
    }
  };

  return (
    <div className="App">
      <header className="header">
        <h1>🖥️ Remote Desktop Viewer</h1>
        <p className="subtitle">Connect to remote computers via IP address</p>
      </header>

      <div className="container">
        <div className="control-panel">
          <div className="input-group">
            <label htmlFor="ip">IP Address</label>
            <input
              id="ip"
              type="text"
              placeholder="e.g., 192.168.1.100"
              value={connection.ip}
              onChange={(e) => setConnection({ ...connection, ip: e.target.value })}
              disabled={connection.status === 'connected'}
            />
          </div>

          <div className="input-group">
            <label htmlFor="port">Port</label>
            <input
              id="port"
              type="text"
              placeholder="3389"
              value={connection.port}
              onChange={(e) => setConnection({ ...connection, port: e.target.value })}
              disabled={connection.status === 'connected'}
            />
          </div>

          <div className="input-group">
            <label htmlFor="username">Username (required) *</label>
            <input
              id="username"
              type="text"
              placeholder="Administrator or DOMAIN\username"
              value={connection.username}
              onChange={(e) => setConnection({ ...connection, username: e.target.value })}
              disabled={connection.status === 'connected'}
              autoComplete="username"
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password (required) *</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={connection.password}
              onChange={(e) => setConnection({ ...connection, password: e.target.value })}
              disabled={connection.status === 'connected'}
              autoComplete="current-password"
              required
            />
          </div>

          <div className="button-group">
            {connection.status !== 'connected' ? (
              <>
                <button
                  className="btn btn-primary"
                  onClick={handleConnect}
                  disabled={connection.status === 'connecting'}
                >
                  {connection.status === 'connecting' ? 'Connecting...' : '🖥️ Windows RDP'}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={handleConnectBrowser}
                  disabled={connection.status === 'connecting'}
                >
                  🌐 Browser
                </button>
                <button
                  className="btn btn-save"
                  onClick={() => setShowSaveDialog(true)}
                  disabled={!connection.ip || !connection.username || !connection.password}
                >
                  💾 Save
                </button>
              </>
            ) : (
              <button
                className="btn btn-danger"
                onClick={handleDisconnect}
              >
                Disconnect
              </button>
            )}
          </div>

          {showSaveDialog && (
            <div className="save-dialog">
              <input
                type="text"
                placeholder="Enter connection name (e.g., Office PC)"
                value={saveConnectionName}
                onChange={(e) => setSaveConnectionName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && saveConnection()}
                className="save-input"
              />
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button onClick={saveConnection} className="btn btn-primary">Save</button>
                <button onClick={() => { setShowSaveDialog(false); setSaveConnectionName(''); }} className="btn btn-secondary">Cancel</button>
              </div>
            </div>
          )}

          <div className="status">
            <span className={`status-indicator ${connection.status}`}></span>
            <span className="status-text">
              {connection.status === 'disconnected' && 'Disconnected'}
              {connection.status === 'connecting' && 'Connecting...'}
              {connection.status === 'connected' && `Connected to ${connection.ip}`}
              {connection.status === 'error' && 'Connection Error'}
            </span>
          </div>

          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

          <div className="info-box">
            <h3>ℹ️ How It Works</h3>
            <p style={{ marginBottom: '1rem', lineHeight: '1.6' }}>
              This app supports <strong>two connection methods</strong>:
            </p>
            <div style={{ marginBottom: '1rem', padding: '1rem', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '4px', borderLeft: '3px solid #10b981' }}>
              <strong>🖥️ Connect with Windows RDP (Recommended)</strong>
              <ol style={{ marginTop: '0.5rem', marginBottom: 0 }}>
                <li>Enter IP, username, and password</li>
                <li>Click "Connect with Windows RDP"</li>
                <li>Native Windows Remote Desktop opens automatically</li>
                <li>Best performance, all RDP features</li>
              </ol>
            </div>
            <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '4px', borderLeft: '3px solid #3b82f6' }}>
              <strong>🌐 Connect from Browser</strong>
              <ol style={{ marginTop: '0.5rem', marginBottom: 0 }}>
                <li>Enter IP, username, and password</li>
                <li>Click "Connect from Browser"</li>
                <li>Guacamole opens (login: admin/admin)</li>
                <li>Click your connection to start</li>
                <li>Works in any browser, no client needed</li>
              </ol>
            </div>
            <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '4px', fontSize: '0.9rem', borderLeft: '3px solid #10b981' }}>
              <strong>✅ Windows RDP:</strong> Zero-click • Password auto-filled • Best performance • All features
            </div>
            <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '4px', fontSize: '0.9rem', borderLeft: '3px solid #3b82f6' }}>
              <strong>🌐 Browser RDP:</strong> No client needed • Works anywhere • Cross-platform • Remote access friendly
            </div>
          </div>
        </div>

        <div className="saved-connections-panel">
          <h2>💾 Saved Connections</h2>
          
          {savedConnections.length === 0 ? (
            <div className="empty-state">
              <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>🖥️</p>
              <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: '#6b7280' }}>No saved connections yet</p>
              <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Save connections for quick access</p>
            </div>
          ) : (
            <div className="connections-grid">
              {savedConnections.map((saved) => (
                <div key={saved.id} className="connection-card">
                  <div className="connection-card-header">
                    <h3>{saved.name}</h3>
                    <button 
                      onClick={() => removeConnection(saved.id)}
                      className="remove-button"
                      title="Remove connection"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="connection-details">
                    <p><strong>IP:</strong> {saved.ip}:{saved.port}</p>
                    <p><strong>User:</strong> {saved.username}</p>
                    {saved.lastConnected && (
                      <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', marginTop: '4px' }}>
                        Last: {new Date(saved.lastConnected).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="connection-card-actions">
                    <button 
                      onClick={() => connectToSaved(saved, false)}
                      className="quick-connect-button"
                    >
                      🖥️ RDP
                    </button>
                    <button 
                      onClick={() => connectToSaved(saved, true)}
                      className="quick-connect-browser-button"
                    >
                      🌐 Browser
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
