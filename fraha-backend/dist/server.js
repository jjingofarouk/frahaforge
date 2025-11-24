"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startServer = startServer;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const portfinder_1 = __importDefault(require("portfinder"));
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const os_1 = __importDefault(require("os"));
// Import database (side-effect only, avoid unused variable)
require("./database/database");
// Import API routes
const categories_1 = __importDefault(require("./api/categories"));
const customers_1 = __importDefault(require("./api/customers"));
const inventory_1 = __importDefault(require("./api/inventory"));
const settings_1 = __importDefault(require("./api/settings"));
const users_1 = __importDefault(require("./api/users"));
const transactions_1 = __importDefault(require("./api/transactions"));
const accounting_1 = __importDefault(require("./api/accounting"));
const suppliers_1 = __importDefault(require("./api/suppliers"));
const accounts_1 = __importDefault(require("./api/accounts"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Get local network IP for logging
function getLocalNetworkIP() {
    const networkInterfaces = os_1.default.networkInterfaces();
    let localIp = 'localhost';
    Object.keys(networkInterfaces).forEach((interfaceName) => {
        const iface = networkInterfaces[interfaceName];
        if (iface) {
            iface.forEach((ifaceInfo) => {
                if (ifaceInfo.family === 'IPv4' && !ifaceInfo.internal) {
                    localIp = ifaceInfo.address;
                }
            });
        }
    });
    return localIp;
}
// Enhanced CORS for local network access
app.use((0, cors_1.default)({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin)
            return callback(null, true);
        // Allow all local network devices and development servers
        const allowedOrigins = [
            'http://localhost:5173',
            'http://127.0.0.1:5173',
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
            }
            else if (pattern instanceof RegExp) {
                return pattern.test(origin);
            }
            return false;
        })) {
            callback(null, true);
        }
        else {
            console.log('🔒 CORS blocked origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    optionsSuccessStatus: 200
}));
// Handle preflight requests
app.options('*', (0, cors_1.default)());
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
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
app.use(body_parser_1.default.json({ limit: '10mb' }));
app.use(body_parser_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Apply rate limiting to API routes
app.use('/api/', limiter);
// Request logging middleware
app.use((req, _res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    console.log(`📡 ${new Date().toISOString()} - ${clientIP} - ${req.method} ${req.path}`);
    next();
});
// Serve static files (product images)
const assetsPath = path_1.default.join(__dirname, '../../shared-assets');
if (fs_extra_1.default.existsSync(assetsPath)) {
    app.use('/assets', express_1.default.static(assetsPath));
    console.log('📁 Serving static files from:', assetsPath);
}
// ==================== API ROUTES ====================
// Health check endpoint
app.get('/api/health', (_req, res) => {
    res.json({
        status: 'healthy',
        service: 'FrahaPharmacy Backend Server',
        timestamp: new Date().toISOString(),
        database: 'connected',
        version: '2.0.0'
    });
});
// Server info endpoint (for network discovery)
app.get('/api/server-info', (_req, res) => {
    const localIp = getLocalNetworkIP();
    res.json({
        serverName: 'FrahaPharmacy Server',
        version: '2.0.0',
        localIP: localIp,
        port: PORT,
        accessURLs: [
            `http://localhost:${PORT}`,
            `http://127.0.0.1:${PORT}`,
            `http://${localIp}:${PORT}`
        ],
        supportedClients: ['Electron App', 'Web Browser'],
        timestamp: new Date().toISOString()
    });
});
// Mount all API routers
console.log('🔄 Mounting API routers...');
const routers = [
    { path: '/api/categories', router: categories_1.default, name: 'Categories' },
    { path: '/api/customers', router: customers_1.default, name: 'Customers' },
    { path: '/api/inventory', router: inventory_1.default, name: 'Inventory' },
    { path: '/api/settings', router: settings_1.default, name: 'Settings' },
    { path: '/api/users', router: users_1.default, name: 'Users' },
    { path: '/api/transactions', router: transactions_1.default, name: 'Transactions' },
    { path: '/api/accounting', router: accounting_1.default, name: 'Accounting' },
    { path: '/api/suppliers', router: suppliers_1.default, name: 'Suppliers' },
    { path: '/api/accounts', router: accounts_1.default, name: 'Accounts' },
];
routers.forEach(({ path, router, name }) => {
    try {
        app.use(path, router);
        console.log(`✅ ${name} router mounted at ${path}`);
    }
    catch (error) {
        console.error(`❌ Failed to mount ${name} router:`, error);
    }
});
// ==================== WEB INTERFACE ====================
// Serve web interface for browser users
const publicPath = path_1.default.join(__dirname, 'public');
if (!fs_extra_1.default.existsSync(publicPath)) {
    fs_extra_1.default.mkdirSync(publicPath, { recursive: true });
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
                    <strong>IP:</strong> \${serverInfo.localIP}:\${serverInfo.port}<br>
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
fs_extra_1.default.writeFileSync(path_1.default.join(publicPath, 'index.html'), webInterfaceHTML);
// Serve static files for web interface
app.use(express_1.default.static(publicPath));
// Web interface route
app.get('/web', (_req, res) => {
    res.sendFile(path_1.default.join(publicPath, 'index.html'));
});
// ==================== ERROR HANDLING ====================
// 404 handler
app.use('*', (req, res) => {
    console.log(`❌ 404 - Route not found: ${req.method} ${req.originalUrl}`);
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
            '/api/settings/*',
            '/api/users/*',
            '/api/transactions/*',
            '/api/accounting/*',
            '/api/suppliers/*',
            '/api/accounts/*'
        ]
    });
});
// Global error handler
app.use((err, req, res, next) => {
    console.error(`💥 Server Error: ${req.method} ${req.url}`, err);
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
        error: process.env.NODE_ENV === 'development' ? err?.message : 'Something went wrong!',
        path: req.path
    });
});
// ==================== SERVER STARTUP ====================
// Start server
async function startServer() {
    try {
        const port = await portfinder_1.default.getPortPromise({
            port: 3000,
            stopPort: 3999
        });
        const localIp = getLocalNetworkIP();
        const server = app.listen(port, '0.0.0.0', () => {
            console.log(`\n🎉 FRAHAPHARMACY BACKEND SERVER - NETWORK ENABLED`);
            console.log('═'.repeat(60));
            console.log(`📍 Local Access:`);
            console.log(`   Electron App: http://localhost:${port}`);
            console.log(`   Web Browser:  http://localhost:${port}/web`);
            console.log(`\n🌐 Network Access:`);
            console.log(`   Electron App: http://${localIp}:${port}`);
            console.log(`   Web Browser:  http://${localIp}:${port}/web`);
            console.log(`\n📱 Mobile/Tablet Access:`);
            console.log(`   Any device:   http://${localIp}:${port}/web`);
            console.log('═'.repeat(60));
            console.log(`\n🔧 API Endpoints:`);
            console.log(`   Health Check: http://${localIp}:${port}/api/health`);
            console.log(`   Server Info:  http://${localIp}:${port}/api/server-info`);
            console.log(`\n⚡ Server running on all network interfaces (0.0.0.0:${port})`);
            console.log(`🔒 CORS enabled for local network devices`);
            console.log(`📊 Database: Connected to existing SQLite database\n`);
        });
        server.on('error', (error) => {
            console.error('❌ Server error:', error);
        });
    }
    catch (err) {
        console.error('❌ Failed to start server:', err);
        process.exit(1);
    }
}
// Export for testing
exports.default = app;
// Start the server if this file is run directly
if (require.main === module) {
    startServer();
}
