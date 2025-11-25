import express, { Request, Response } from 'express';
import { database } from '../database/database';
import bcrypt from 'bcryptjs';
import validator from 'validator';

const router = express.Router();

// Use the shared database instance
const db = database.getDatabase();

// Helper functions using the shared database
const dbAll = (sql: string, params: any[] = []): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

const dbGet = (sql: string, params: any[] = []): Promise<any> => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

const dbRun = (sql: string, params: any[] = []): Promise<{ changes: number; lastID: number }> => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve({ changes: this.changes, lastID: this.lastID });
        });
    });
};

const saltRounds = 10;

interface User {
    id: number;
    username: string;
    fullname: string;
    password: string;
    perm_products: number;
    perm_categories: number;
    perm_transactions: number;
    perm_users: number;
    perm_settings: number;
    status: string;
    last_login?: string;
    is_logged_in: number;
    created_at: string;
    session_token?: string;
    session_expiry?: string;
}

// ===== PUBLIC ROUTES (Matching former system) =====

// Check if admin user exists - create if not
router.get('/check', async (req: Request, res: Response) => {
    try {
        console.log('🔄 Checking for admin user...');
        
        const adminUser = await dbGet('SELECT * FROM users WHERE id = 1') as User;
        
        if (!adminUser) {
            console.log('🔄 Creating default admin user...');
            const hash = await bcrypt.hash('admin', saltRounds);
            const now = new Date().toISOString();
            
            await dbRun(`
                INSERT INTO users (
                    id, username, fullname, password, perm_products, perm_categories,
                    perm_transactions, perm_users, perm_settings, status, is_logged_in, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                1, 'admin', 'Administrator', hash,
                1, 1, 1, 1, 1, '', 0, now
            ]);
            
            console.log('✅ Admin user created');
            res.json({ success: true, message: 'Admin user created' });
        } else {
            console.log('ℹ️ Admin user already exists');
            res.json({ success: true, message: 'Admin user already exists' });
        }
    } catch (error) {
        console.error('Init error:', error);
        res.status(500).json({ 
            error: 'Internal Server Error', 
            message: 'Failed to initialize admin user' 
        });
    }
});

// Login endpoint - matching former system
router.post('/login', async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.json({ 
                auth: false, 
                message: 'Username and password required' 
            });
        }

        console.log('🔐 Login attempt for username:', username);

        // Find user by username
        const user = await dbGet('SELECT * FROM users WHERE username = ?', 
            [validator.escape(username)]) as User;

        if (!user) {
            console.log('❌ User not found:', username);
            return res.json({ 
                auth: false, 
                message: 'Invalid username or password' 
            });
        }

        // Verify password
        const passwordValid = await bcrypt.compare(password, user.password);
        if (!passwordValid) {
            console.log('❌ Invalid password for user:', username);
            return res.json({ 
                auth: false, 
                message: 'Invalid username or password' 
            });
        }

        // Update user status with timestamp and set last_login
        const now = new Date().toISOString();
        await dbRun(`
            UPDATE users SET 
                status = ?,
                last_login = ?,
                is_logged_in = 1,
                session_expiry = datetime('now', '+1 day')
            WHERE id = ?
        `, [
            `Logged In_${now}`,
            now, // Set last_login to current time
            user.id
        ]);

        console.log('✅ Login successful for user:', user.fullname);

        // Return user data without password
        const { password: _, ...userData } = user;
        
        res.json({ 
            ...userData, 
            auth: true,
            message: 'Login successful'
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            auth: false, 
            message: 'Login failed due to server error' 
        });
    }
});

// Enhanced logout to preserve last_login
router.get('/logout/:userId', async (req: Request, res: Response) => {
    try {
        const userId = parseInt(req.params.userId);
        const now = new Date().toISOString();
        
        console.log('🚪 Logging out user:', userId);

        // Get current user to preserve last_login (it's already set from login)
        await dbRun(`
            UPDATE users SET 
                is_logged_in = 0,
                status = ?,
                session_token = NULL,
                session_expiry = NULL
            WHERE id = ?
        `, [
            `Logged Out_${now}`,
            userId
        ]);

        console.log('✅ User logged out successfully');
        res.sendStatus(200);
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Logout failed' 
        });
    }
});

// Get all users - NO AUTHENTICATION REQUIRED (Admin only access via navigation)
router.get('/all', async (req: Request, res: Response) => {
    try {
        console.log('🔄 Fetching all users (no auth required - admin access via navigation)');
        
        const users = await dbAll(`
            SELECT id, username, fullname, perm_products, perm_categories, 
                   perm_transactions, perm_users, perm_settings, status, 
                   last_login, is_logged_in, created_at, session_expiry
            FROM users
        `) as User[];

        console.log(`✅ Found ${users.length} users`);
        res.json(users);
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ 
            error: 'Internal Server Error', 
            message: 'Failed to retrieve users' 
        });
    }
});

// Get specific user - NO AUTHENTICATION REQUIRED
router.get('/user/:userId', async (req: Request, res: Response) => {
    try {
        const userId = parseInt(req.params.userId);
        console.log(`🔄 Fetching user ${userId} (no auth required)`);
        
        const user = await dbGet(`
            SELECT id, username, fullname, perm_products, perm_categories, 
                   perm_transactions, perm_users, perm_settings, status, 
                   last_login, is_logged_in, created_at
            FROM users WHERE id = ?
        `, [userId]) as User;

        if (!user) {
            return res.status(404).json({ 
                error: 'Not Found', 
                message: 'User not found' 
            });
        }

        res.json(user);
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ 
            error: 'Internal Server Error', 
            message: 'Failed to retrieve user' 
        });
    }
});

// Enhanced user update to handle username changes properly
router.post('/user', async (req: Request, res: Response) => {
    try {
        console.log('🔄 Creating/updating user');
        
        const { id, username, fullname, password, ...permissions } = req.body;

        if (!username || !fullname) {
            return res.status(400).json({ 
                error: 'Bad Request', 
                message: 'Username and fullname are required' 
            });
        }

        // Check if username already exists (for new users or username changes)
        if (id) {
            const existingUser = await dbGet(
                'SELECT id FROM users WHERE username = ? AND id != ?', 
                [username, parseInt(id)]
            );
            if (existingUser) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Username already exists'
                });
            }
        } else {
            const existingUser = await dbGet(
                'SELECT id FROM users WHERE username = ?', 
                [username]
            );
            if (existingUser) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Username already exists'
                });
            }
        }

        // Validate permissions
        const perms = [
            'perm_products',
            'perm_categories',
            'perm_transactions',
            'perm_users',
            'perm_settings',
        ];

        const userData: any = { username, fullname };
        for (const perm of perms) {
            userData[perm] = permissions[perm] ? 1 : 0;
        }

        if (id) {
            // Update existing user
            if (password) {
                userData.password = await bcrypt.hash(password, saltRounds);
                await dbRun(`
                    UPDATE users SET 
                        username = ?, fullname = ?, password = ?, perm_products = ?,
                        perm_categories = ?, perm_transactions = ?, perm_users = ?,
                        perm_settings = ?
                    WHERE id = ?
                `, [
                    userData.username, userData.fullname, userData.password,
                    userData.perm_products, userData.perm_categories,
                    userData.perm_transactions, userData.perm_users,
                    userData.perm_settings, parseInt(id)
                ]);
            } else {
                await dbRun(`
                    UPDATE users SET 
                        username = ?, fullname = ?, perm_products = ?,
                        perm_categories = ?, perm_transactions = ?, perm_users = ?,
                        perm_settings = ?
                    WHERE id = ?
                `, [
                    userData.username, userData.fullname,
                    userData.perm_products, userData.perm_categories,
                    userData.perm_transactions, userData.perm_users,
                    userData.perm_settings, parseInt(id)
                ]);
            }
            console.log(`✅ Updated user ${id}`);
        } else {
            // Create new user
            if (!password) {
                return res.status(400).json({ 
                    error: 'Bad Request', 
                    message: 'Password is required for new users' 
                });
            }

            userData.password = await bcrypt.hash(password, saltRounds);
            userData.status = '';
            userData.is_logged_in = 0;

            const result = await dbRun(`
                INSERT INTO users (
                    username, fullname, password, perm_products, perm_categories,
                    perm_transactions, perm_users, perm_settings, status, is_logged_in
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                userData.username, userData.fullname, userData.password,
                userData.perm_products, userData.perm_categories,
                userData.perm_transactions, userData.perm_users,
                userData.perm_settings, userData.status, userData.is_logged_in
            ]);
            
            console.log(`✅ Created new user with ID: ${result.lastID}`);
        }

        res.json({ success: true, message: 'User saved successfully' });
    } catch (error) {
        console.error('Save user error:', error);
        res.status(500).json({ 
            error: 'Internal Server Error', 
            message: 'Failed to save user' 
        });
    }
});

// Delete user - NO AUTHENTICATION REQUIRED
router.delete('/user/:userId', async (req: Request, res: Response) => {
    try {
        const userId = parseInt(req.params.userId);
        console.log(`🔄 Deleting user ${userId} (no auth required)`);
        
        // Prevent deletion of primary admin (ID 1)
        if (userId === 1) {
            return res.status(400).json({ 
                error: 'Bad Request', 
                message: 'Cannot delete the primary administrator account' 
            });
        }

        const result = await dbRun('DELETE FROM users WHERE id = ?', [userId]);
        
        if (result.changes === 0) {
            return res.status(404).json({ 
                error: 'Not Found', 
                message: 'User not found' 
            });
        }

        console.log(`✅ Deleted user ${userId}`);
        res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ 
            error: 'Internal Server Error', 
            message: 'Failed to delete user' 
        });
    }
});

export default router;