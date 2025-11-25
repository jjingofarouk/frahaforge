// src/server.ts
import express, { Request, Response, Express, NextFunction } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs-extra';
import os from 'os';

// === GOOGLE DRIVE BACKUP INTEGRATION (ONLY ADDITION) ===
import { createEncryptedBackup, setupGoogleDriveOnce } from './backup/google-drive-backup';

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
      safeConsole.log('CORS blocked origin:', origin);
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
  safeConsole.log(` ${new Date().toISOString()} - ${clientIP} - ${req.method} ${req.path}`);
  next();
});

// Serve static files (product images)
const assetsPath = path.join(__dirname, '../../shared-assets');
if (fs.existsSync(assetsPath)) {
  app.use('/assets', express.static(assetsPath));
  safeConsole.log('Serving static files from:', assetsPath);
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
    supportedClients: ['Electron App'],
    timestamp: new Date().toISOString()
  });
});

// Mount all API routers
safeConsole.log('Mounting API routers...');
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
    safeConsole.log(`${name} router mounted at ${path}`);
  } catch (error: any) {
    safeConsole.error(`Failed to mount ${name} router:`, error);
  }
});

// ==================== ERROR HANDLING ====================
// 404 handler
app.use('*', (req: Request, res: Response) => {
  safeConsole.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    availableEndpoints: [
      '/api/health',
      '/api/server-info',
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
  safeConsole.error(`Server Error: ${req.method} ${req.url}`, err);
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
    // ONE-TIME GOOGLE DRIVE SETUP
    setupGoogleDriveOnce();

    // BACKUP 15 SECONDS AFTER STARTUP (in case last shutdown was killed)
    setTimeout(() => {
      safeConsole.log('Running startup encrypted backup...');
      createEncryptedBackup();
    }, 15_000);

    // Force port 3000 instead of using portfinder
    const port = PORT;
    safeConsole.log(`Attempting to start server on port ${port}...`);
    const networkIPs = getAllNetworkIPs();
    const primaryIP = networkIPs.find(ip => ip !== 'localhost' && ip !== '127.0.0.1') || 'localhost';

    // FIXED: Explicitly bind to 0.0.0.0 for network access
    const server = app.listen(port, '0.0.0.0', () => {
      safeConsole.log(`\nFRAHAPHARMACY BACKEND SERVER - NETWORK ENABLED`);
      safeConsole.log('═'.repeat(70));
      safeConsole.log(`Local Access:`);
      safeConsole.log(` Electron App: http://localhost:${port}`);
      safeConsole.log(`\nNetwork Access (All Available IPs):`);
      networkIPs.forEach(ip => {
        if (ip !== 'localhost' && ip !== '127.0.0.1') {
          safeConsole.log(` http://${ip}:${port}`);
        }
      });
      safeConsole.log('═'.repeat(70));
      safeConsole.log(`\nAPI Endpoints:`);
      safeConsole.log(` Health Check: http://${primaryIP}:${port}/api/health`);
      safeConsole.log(` Server Info: http://${primaryIP}:${port}/api/server-info`);
      safeConsole.log(`\nServer running on ALL network interfaces (0.0.0.0:${port})`);
      safeConsole.log(`CORS enabled for all local network devices`);
      safeConsole.log(`Database: Connected to existing SQLite database`);
      safeConsole.log(`ENCRYPTED GOOGLE DRIVE BACKUPS: ENABLED`);
      safeConsole.log(`Ready to accept connections from Electron app!\n`);
    });

    // Enhanced error handling
    server.on('error', (error: any) => {
      safeConsole.error('Server startup error:', error);
      if (error.code === 'EADDRINUSE') {
        safeConsole.error(`Port ${port} is already in use!`);
        safeConsole.log(`Try: kill -9 $(lsof -t -i:${port})`);
        safeConsole.log(`Or use: lsof -i :${port} to see what's using the port`);
      } else if (error.code === 'EACCES') {
        safeConsole.error(`Permission denied for port ${port}`);
        safeConsole.log(`Try using a port above 1024`);
      }
      process.exit(1);
    });

    // Handle graceful shutdown
    const gracefulShutdown = () => {
      if (isServerShuttingDown) return;
      isServerShuttingDown = true;
      safeConsole.log('Server is shutting down gracefully...');
      safeConsole.log('Creating final encrypted Google Drive backup before exit...');

      createEncryptedBackup().finally(() => {
        server.close((err) => {
          if (err) {
            safeConsole.error('Error during server shutdown:', err);
            process.exit(1);
          } else {
            safeConsole.log('Server closed successfully. Final backup complete.');
            process.exit(0);
          }
        });

        // Force close after 30 seconds
        setTimeout(() => {
          safeConsole.error('Forcing server shutdown after timeout');
          process.exit(1);
        }, 30_000);
      });
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
      safeConsole.error('Uncaught Exception:', error);
      gracefulShutdown();
    });
    process.on('unhandledRejection', (reason, promise) => {
      safeConsole.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

  } catch (err: any) {
    safeConsole.error('Failed to start server:', err);
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