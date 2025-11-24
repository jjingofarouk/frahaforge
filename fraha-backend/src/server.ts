import express, { Request, Response, Express, NextFunction } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import rateLimit from 'express-rate-limit';
import portfinder from 'portfinder';
import path from 'path';
import fs from 'fs-extra';
import os from 'os';

// Import database (side-effect only, avoid unused variable)
import './database/database';

// Import API routes
import categoriesRouter from './api/categories';
import customersRouter from './api/customers';
import inventoryRouter from './api/inventory';
import usersRouter from './api/users';
import transactionsRouter from './api/transactions';
import accountingRouter from './api/accounting';
import suppliersRouter from './api/suppliers';
import accountsRouter from './api/accounts';

const app: Express = express();

// FIXED: Use environment variable or default to 3000
const PORT = parseInt(process.env.PORT || '3000', 10);

// Safe console wrapper to prevent EIO errors
let isServerShuttingDown = false;

const safeConsole = {
  log: (...args: any[]) => {
    if (isServerShuttingDown) return;
    try {
      console.log(...args);
    } catch (error: any) {
      if (error.code !== 'EIO') {
        throw error;
      }
      // Silently ignore EIO errors during shutdown
    }
  },
  error: (...args: any[]) => {
    if (isServerShuttingDown) return;
    try {
      console.error(...args);
    } catch (error: any) {
      if (error.code !== 'EIO') {
        throw error;
      }
    }
  },
  warn: (...args: any[]) => {
    if (isServerShuttingDown) return;
    try {
      console.warn(...args);
    } catch (error: any) {
      if (error.code !== 'EIO') {
        throw error;
      }
    }
  }
};

// Get ALL local network IPs for logging
function getAllNetworkIPs(): string[] {
  const networkInterfaces = os.networkInterfaces();
  const ips: string[] = ['localhost', '127.0.0.1'];
  
  Object.keys(networkInterfaces).forEach((interfaceName) => {
    const iface = networkInterfaces[interfaceName];
    if (iface) {
      iface.forEach((ifaceInfo) => {
        if (ifaceInfo.family === 'IPv4' && !ifaceInfo.internal) {
          ips.push(ifaceInfo.address);
        }
      });
    }
  });
  
  return ips;
}

// FIXED: Enhanced CORS - allow all origins for development
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, electron)
    if (!origin) return callback(null, true);
    
    // In development, allow ALL origins for testing
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    // Allow all local network devices and development servers
    const allowedOrigins = [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3000', 
      'http://127.0.0.1:3000',
      // Allow any IP address on local network
      /http:\/\/192\.168\.\d+\.\d+:\d+/,
      /http:\/\/10\.\d+\.\d+\.\d+:\d+/,
      /http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+:\d+/,
      /http:\/\/localhost:\d+/,
      /http:\/\/127\.0\.0\.1:\d+/,
    ];
    
    if (allowedOrigins.some(pattern => {
      if (typeof pattern === 'string') {
        return origin === pattern;
      } else if (pattern instanceof RegExp) {
        return pattern.test(origin);
      }
      return false;
    })) {
      callback(null, true);
    } else {
      safeConsole.log('🔒 CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Handle preflight requests
app.options('*', cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: {
    error: 'Rate limit exceeded',
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Body parsing middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiting to API routes
app.use('/api/', limiter);

// Request logging middleware
app.use((req: Request, _res: Response, next: any) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  safeConsole.log(`📡 ${new Date().toISOString()} - ${clientIP} - ${req.method} ${req.path}`);
  next();
});

// Serve static files (product images)
const assetsPath = path.join(__dirname, '../../shared-assets');
if (fs.existsSync(assetsPath)) {
  app.use('/assets', express.static(assetsPath));
  safeConsole.log('📁 Serving static files from:', assetsPath);
}

// ==================== API ROUTES ====================

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ 
    status: 'healthy', 
    service: 'FrahaPharmacy Backend Server',
    timestamp: new Date().toISOString(),
    database: 'connected',
    version: '2.0.0',
    networkIPs: getAllNetworkIPs()
  });
});

// Server info endpoint (for network discovery)
app.get('/api/server-info', (_req: Request, res: Response) => {
  const networkIPs = getAllNetworkIPs();
  const primaryIP = networkIPs.find(ip => ip !== 'localhost' && ip !== '127.0.0.1') || 'localhost';
  
  res.json({
    serverName: 'FrahaPharmacy Server',
    version: '2.0.0',
    primaryIP: primaryIP,
    allIPs: networkIPs,
    port: PORT,
    accessURLs: networkIPs.map(ip => `http://${ip}:${PORT}`),
    supportedClients: ['Electron App', 'Web Browser'],
    timestamp: new Date().toISOString()
  });
});

// Mount all API routers
safeConsole.log('🔄 Mounting API routers...');

const routers = [
  { path: '/api/categories', router: categoriesRouter, name: 'Categories' },
  { path: '/api/customers', router: customersRouter, name: 'Customers' },
  { path: '/api/inventory', router: inventoryRouter, name: 'Inventory' },
  { path: '/api/users', router: usersRouter, name: 'Users' },
  { path: '/api/transactions', router: transactionsRouter, name: 'Transactions' },
  { path: '/api/accounting', router: accountingRouter, name: 'Accounting' },
  { path: '/api/suppliers', router: suppliersRouter, name: 'Suppliers' },
  { path: '/api/accounts', router: accountsRouter, name: 'Accounts' },
];

routers.forEach(({ path, router, name }) => {
  try {
    app.use(path, router);
    safeConsole.log(`✅ ${name} router mounted at ${path}`);
  } catch (error: any) {
    safeConsole.error(`❌ Failed to mount ${name} router:`, error);
  }
});

// ==================== WEB INTERFACE ====================

// Serve web interface for browser users
const publicPath = path.join(__dirname, 'public');
if (!fs.existsSync(publicPath)) {
  fs.mkdirSync(publicPath, { recursive: true });
}

// Create basic web interface files
const webInterfaceHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FrahaPharmacy - Web POS</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .login-container {
            background: white;
            padding: 40px;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            width: 100%;
            max-width: 400px;
        }
        
        .logo {
            text-align: center;
            margin-bottom: 30px;
        }
        
        .logo h1 {
            color: #333;
            font-size: 28px;
            font-weight: 600;
        }
        
        .logo .subtitle {
            color: #666;
            font-size: 14px;
            margin-top: 5px;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 8px;
            color: #333;
            font-weight: 500;
        }
        
        .form-group input {
            width: 100%;
            padding: 12px 15px;
            border: 2px solid #e1e5e9;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.3s;
        }
        
        .form-group input:focus {
            outline: none;
            border-color: #667eea;
        }
        
        .login-btn {
            width: 100%;
            padding: 12px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s;
        }
        
        .login-btn:hover {
            transform: translateY(-2px);
        }
        
        .login-btn:active {
            transform: translateY(0);
        }
        
        .message {
            margin-top: 15px;
            padding: 10px;
            border-radius: 5px;
            text-align: center;
            font-size: 14px;
        }
        
        .error {
            background: #fee;
            color: #c33;
            border: 1px solid #fcc;
        }
        
        .success {
            background: #efe;
            color: #363;
            border: 1px solid #cfc;
        }
        
        .server-info {
            margin-top: 25px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
            font-size: 12px;
            color: #666;
        }
        
        .server-info h3 {
            margin-bottom: 8px;
            color: #333;
        }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="logo">
            <h1>🏥 FrahaPharmacy</h1>
            <div class="subtitle">Point of Sale System</div>
        </div>
        
        <form id="loginForm">
            <div class="form-group">
                <label for="username">Username</label>
                <input type="text" id="username" placeholder="Enter your username" required>
            </div>
            
            <div class="form-group">
                <label for="password">Password</label>
                <input type="password" id="password" placeholder="Enter your password" required>
            </div>
            
            <button type="submit" class="login-btn">Login to POS</button>
        </form>
        
        <div id="message" class="message" style="display: none;"></div>
        
        <div class="server-info">
            <h3>Server Information</h3>
            <div id="serverDetails">Loading server info...</div>
        </div>
    </div>

    <script>
        // Load server information
        async function loadServerInfo() {
            try {
                const response = await fetch('/api/server-info');
                const serverInfo = await response.json();
                
                document.getElementById('serverDetails').innerHTML = \`
                    <strong>Server:</strong> \${serverInfo.serverName}<br>
                    <strong>Primary IP:</strong> \${serverInfo.primaryIP}:\${serverInfo.port}<br>
                    <strong>All IPs:</strong> \${serverInfo.allIPs.join(', ')}<br>
                    <strong>Version:</strong> \${serverInfo.version}
                \`;
            } catch (error) {
                document.getElementById('serverDetails').textContent = 'Unable to load server information';
            }
        }
        
        // Handle login form submission
        document.getElementById('loginForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const messageDiv = document.getElementById('message');
            
            // Clear previous messages
            messageDiv.style.display = 'none';
            messageDiv.className = 'message';
            
            try {
                const response = await fetch('/api/users/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, password })
                });
                
                const result = await response.json();
                
                if (response.ok && result.success) {
                    messageDiv.textContent = 'Login successful! Redirecting to POS...';
                    messageDiv.className = 'message success';
                    messageDiv.style.display = 'block';
                    
                    // Store token and redirect to POS interface
                    localStorage.setItem('authToken', result.token);
                    localStorage.setItem('user', JSON.stringify(result.user));
                    
                    // Redirect to POS after short delay
                    setTimeout(() => {
                        window.location.href = '/web-pos.html';
                    }, 1000);
                    
                } else {
                    messageDiv.textContent = result.error || 'Login failed';
                    messageDiv.className = 'message error';
                    messageDiv.style.display = 'block';
                }
                
            } catch (error) {
                messageDiv.textContent = 'Network error. Please check connection.';
                messageDiv.className = 'message error';
                messageDiv.style.display = 'block';
            }
        });
        
        // Check if already logged in
        if (localStorage.getItem('authToken')) {
            window.location.href = '/web-pos.html';
        }
        
        // Load server info on page load
        loadServerInfo();
    </script>
</body>
</html>
`;

// Write web interface files
fs.writeFileSync(path.join(publicPath, 'index.html'), webInterfaceHTML);

// Serve static files for web interface
app.use(express.static(publicPath));

// Web interface route
app.get('/web', (_req: Request, res: Response) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// ==================== ERROR HANDLING ====================

// 404 handler
app.use('*', (req: Request, res: Response) => {
  safeConsole.log(`❌ 404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    availableEndpoints: [
      '/api/health',
      '/api/server-info',
      '/web (Web Interface)',
      '/api/categories/*',
      '/api/customers/*',
      '/api/inventory/*',
      '/api/users/*',
      '/api/transactions/*',
      '/api/accounting/*',
      '/api/suppliers/*',
      '/api/accounts/*'
    ]
  });
});

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  safeConsole.error(`💥 Server Error: ${req.method} ${req.url}`, err);

  // If headers have already been sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(err);
  }
  
  if (err && err.status === 429) {
    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please slow down your requests.',
      retryAfter: '1 minute'
    });
  }
  
  return res.status(500).json({
    message: 'Internal Server Error',
    error: process.env.NODE_ENV !== 'production' ? err?.message : 'Something went wrong!',
    path: req.path
  });
});

// ==================== SERVER STARTUP ====================

// FIXED: Improved server startup with better error handling
async function startServer() {
  try {
    // Force port 3000 instead of using portfinder
    const port = PORT;
    
    safeConsole.log(`🔧 Attempting to start server on port ${port}...`);
    
    const networkIPs = getAllNetworkIPs();
    const primaryIP = networkIPs.find(ip => ip !== 'localhost' && ip !== '127.0.0.1') || 'localhost';
    
    // FIXED: Explicitly bind to 0.0.0.0 for network access
    const server = app.listen(port, '0.0.0.0', () => {
      safeConsole.log(`\n🎉 FRAHAPHARMACY BACKEND SERVER - NETWORK ENABLED`);
      safeConsole.log('═'.repeat(70));
      safeConsole.log(`📍 Local Access:`);
      safeConsole.log(`   Electron App: http://localhost:${port}`);
      safeConsole.log(`   Web Browser:  http://localhost:${port}/web`);
      safeConsole.log(`\n🌐 Network Access (All Available IPs):`);
      networkIPs.forEach(ip => {
        if (ip !== 'localhost' && ip !== '127.0.0.1') {
          safeConsole.log(`   http://${ip}:${port}`);
        }
      });
      safeConsole.log(`\n📱 Mobile/Tablet Access:`);
      safeConsole.log(`   Any device:   http://${primaryIP}:${port}/web`);
      safeConsole.log('═'.repeat(70));
      safeConsole.log(`\n🔧 API Endpoints:`);
      safeConsole.log(`   Health Check: http://${primaryIP}:${port}/api/health`);
      safeConsole.log(`   Server Info:  http://${primaryIP}:${port}/api/server-info`);
      safeConsole.log(`\n⚡ Server running on ALL network interfaces (0.0.0.0:${port})`);
      safeConsole.log(`🔒 CORS enabled for all local network devices`);
      safeConsole.log(`📊 Database: Connected to existing SQLite database`);
      safeConsole.log(`🚀 Ready to accept connections from Electron app!\n`);
    });
    
    // Enhanced error handling
    server.on('error', (error: any) => {
      safeConsole.error('❌ Server startup error:', error);
      if (error.code === 'EADDRINUSE') {
        safeConsole.error(`💥 Port ${port} is already in use!`);
        safeConsole.log(`💡 Try: kill -9 $(lsof -t -i:${port})`);
        safeConsole.log(`💡 Or use: lsof -i :${port} to see what's using the port`);
      } else if (error.code === 'EACCES') {
        safeConsole.error(`💥 Permission denied for port ${port}`);
        safeConsole.log(`💡 Try using a port above 1024`);
      }
      process.exit(1);
    });
    
    // Handle graceful shutdown
    const gracefulShutdown = () => {
      if (isServerShuttingDown) return;
      
      isServerShuttingDown = true;
      safeConsole.log('🛑 Server is shutting down gracefully...');
      
      server.close((err) => {
        if (err) {
          safeConsole.error('❌ Error during server shutdown:', err);
          process.exit(1);
        } else {
          safeConsole.log('✅ Server closed successfully');
          process.exit(0);
        }
      });
      
      // Force close after 10 seconds
      setTimeout(() => {
        safeConsole.error('💥 Forcing server shutdown after timeout');
        process.exit(1);
      }, 10000);
    };
    
    // Handle process signals
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      if (error.message.includes('EIO')) {
        // Ignore EIO errors during shutdown
        return;
      }
      safeConsole.error('💥 Uncaught Exception:', error);
      gracefulShutdown();
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      safeConsole.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    });
    
  } catch (err: any) {
    safeConsole.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

// Export for testing
export default app;
export { startServer };

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}