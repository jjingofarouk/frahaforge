"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/main/api/customers.ts
const express_1 = __importDefault(require("express"));
const database_1 = require("../database/database");
const router = express_1.default.Router();
// Use the shared database instance
const db = database_1.database.getDatabase();
// Database helper functions
const dbAll = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows);
        });
    });
};
const dbGet = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err)
                reject(err);
            else
                resolve(row);
        });
    });
};
const dbRun = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err)
                reject(err);
            else
                resolve({ changes: this.changes, lastID: this.lastID });
        });
    });
};
// === AUTOMATIC CUSTOMER SEGMENTATION LOGIC ===
const calculateCustomerSegment = (customer) => {
    const totalSpent = customer.total_spent || 0;
    const totalOrders = customer.total_orders || 0;
    const loyaltyPoints = customer.loyalty_points || 0;
    const lastOrderDate = customer.last_order_date;
    // Calculate days since last order
    let daysSinceLastOrder = Infinity;
    if (lastOrderDate) {
        const lastOrder = new Date(lastOrderDate);
        daysSinceLastOrder = (Date.now() - lastOrder.getTime()) / (1000 * 60 * 60 * 24);
    }
    // 🏆 VIP Customers: High spenders or very loyal
    if (totalSpent >= 1000000 || loyaltyPoints >= 1000 || totalOrders >= 50) {
        return 'vip';
    }
    // 💎 Loyal Customers: Regular shoppers with good loyalty
    if (totalOrders >= 10 && loyaltyPoints >= 200 && daysSinceLastOrder <= 60) {
        return 'loyal';
    }
    // 🔄 Regular Customers: Active shoppers
    if (totalOrders >= 3 && daysSinceLastOrder <= 90) {
        return 'regular';
    }
    // 😴 Inactive Customers: No orders in 6+ months
    if (daysSinceLastOrder > 180 && totalOrders > 0) {
        return 'inactive';
    }
    // 🆕 New Customers: Default for new or low-activity customers
    return 'new';
};
// === GET ALL CUSTOMERS ===
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 50, search, segment, sortBy = 'created_at', sortOrder = 'DESC' } = req.query;
        let whereClause = 'WHERE 1=1';
        const params = [];
        if (search) {
            whereClause += ' AND (name LIKE ? OR phone LIKE ? OR email LIKE ?)';
            const searchTerm = `%${String(search)}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }
        if (segment) {
            whereClause += ' AND segment = ?';
            params.push(String(segment));
        }
        const offset = (parseInt(String(page)) - 1) * parseInt(String(limit));
        const validSortColumns = ['name', 'total_spent', 'total_orders', 'created_at', 'last_order_date'];
        const sortColumn = validSortColumns.includes(String(sortBy)) ? String(sortBy) : 'created_at';
        const order = String(sortOrder).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        const customers = await dbAll(`
      SELECT * FROM customers 
      ${whereClause}
      ORDER BY ${sortColumn} ${order}
      LIMIT ? OFFSET ?
    `, [...params, parseInt(String(limit)), offset]);
        const totalResult = await dbGet(`
      SELECT COUNT(*) as total FROM customers ${whereClause}
    `, params);
        res.json({
            customers,
            pagination: {
                page: parseInt(String(page)),
                limit: parseInt(String(limit)),
                total: totalResult.total,
                pages: Math.ceil(totalResult.total / parseInt(String(limit)))
            }
        });
    }
    catch (err) {
        console.error('GET /customers error:', err.message);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch customers: ' + err.message
        });
    }
});
// === GET SINGLE CUSTOMER ===
router.get('/:customerId', async (req, res) => {
    try {
        const customerId = parseInt(req.params.customerId);
        if (isNaN(customerId)) {
            return res.status(400).json({ error: 'Invalid customer ID' });
        }
        const customer = await dbGet('SELECT * FROM customers WHERE id = ?', [customerId]);
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        res.json(customer);
    }
    catch (err) {
        console.error('GET /customers/:id error:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});
// === CREATE NEW CUSTOMER ===
router.post('/', async (req, res) => {
    try {
        const customerData = req.body;
        // Validate required fields
        if (!customerData.name || customerData.name.trim() === '') {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Customer name is required'
            });
        }
        // Check for duplicate phone or email
        if (customerData.phone) {
            const existingPhone = await dbGet('SELECT id FROM customers WHERE phone = ?', [customerData.phone]);
            if (existingPhone) {
                return res.status(409).json({
                    error: 'Conflict',
                    message: 'Customer with this phone number already exists'
                });
            }
        }
        if (customerData.email) {
            const existingEmail = await dbGet('SELECT id FROM customers WHERE email = ?', [customerData.email]);
            if (existingEmail) {
                return res.status(409).json({
                    error: 'Conflict',
                    message: 'Customer with this email already exists'
                });
            }
        }
        // ✅ AUTO-CALCULATE SEGMENT for new customers
        const initialSegment = 'new'; // All new customers start as 'new'
        const result = await dbRun(`
      INSERT INTO customers (
        name, phone, email, address, store, segment
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
            customerData.name.trim(),
            customerData.phone?.trim() || null,
            customerData.email?.trim() || null,
            customerData.address?.trim() || null,
            customerData.store?.trim() || 'FrahaPharmacy',
            initialSegment
        ]);
        const newCustomer = await dbGet('SELECT * FROM customers WHERE id = ?', [result.lastID]);
        res.status(201).json({
            success: true,
            customer: newCustomer,
            message: 'Customer created successfully'
        });
    }
    catch (err) {
        console.error('POST /customers error:', err.message);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to create customer: ' + err.message
        });
    }
});
// === UPDATE CUSTOMER ===
router.put('/:customerId', async (req, res) => {
    try {
        const customerId = parseInt(req.params.customerId);
        const customerData = req.body;
        if (isNaN(customerId)) {
            return res.status(400).json({ error: 'Invalid customer ID' });
        }
        // Check if customer exists
        const existingCustomer = await dbGet('SELECT id FROM customers WHERE id = ?', [customerId]);
        if (!existingCustomer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        // Check for duplicate phone or email (excluding current customer)
        if (customerData.phone) {
            const existingPhone = await dbGet('SELECT id FROM customers WHERE phone = ? AND id != ?', [customerData.phone, customerId]);
            if (existingPhone) {
                return res.status(409).json({
                    error: 'Conflict',
                    message: 'Another customer with this phone number already exists'
                });
            }
        }
        if (customerData.email) {
            const existingEmail = await dbGet('SELECT id FROM customers WHERE email = ? AND id != ?', [customerData.email, customerId]);
            if (existingEmail) {
                return res.status(409).json({
                    error: 'Conflict',
                    message: 'Another customer with this email already exists'
                });
            }
        }
        // Build dynamic update query
        const updates = [];
        const params = [];
        if (customerData.name !== undefined) {
            updates.push('name = ?');
            params.push(customerData.name.trim());
        }
        if (customerData.phone !== undefined) {
            updates.push('phone = ?');
            params.push(customerData.phone?.trim() || null);
        }
        if (customerData.email !== undefined) {
            updates.push('email = ?');
            params.push(customerData.email?.trim() || null);
        }
        if (customerData.address !== undefined) {
            updates.push('address = ?');
            params.push(customerData.address?.trim() || null);
        }
        if (customerData.store !== undefined) {
            updates.push('store = ?');
            params.push(customerData.store.trim());
        }
        updates.push('updated_at = CURRENT_TIMESTAMP');
        if (updates.length === 1) { // Only updated_at was added
            return res.status(400).json({
                error: 'Bad Request',
                message: 'No fields to update'
            });
        }
        params.push(customerId);
        await dbRun(`
      UPDATE customers 
      SET ${updates.join(', ')}
      WHERE id = ?
    `, params);
        const updatedCustomer = await dbGet('SELECT * FROM customers WHERE id = ?', [customerId]);
        res.json({
            success: true,
            customer: updatedCustomer,
            message: 'Customer updated successfully'
        });
    }
    catch (err) {
        console.error('PUT /customers/:id error:', err.message);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to update customer: ' + err.message
        });
    }
});
// === DELETE CUSTOMER ===
router.delete('/:customerId', async (req, res) => {
    try {
        const customerId = parseInt(req.params.customerId);
        if (isNaN(customerId)) {
            return res.status(400).json({ error: 'Invalid customer ID' });
        }
        // Check if customer exists
        const existingCustomer = await dbGet('SELECT id FROM customers WHERE id = ?', [customerId]);
        if (!existingCustomer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        // Check if customer has transactions
        const customerTransactions = await dbGet('SELECT COUNT(*) as count FROM transactions WHERE customer_id = ?', [customerId]);
        if (customerTransactions.count > 0) {
            return res.status(409).json({
                error: 'Conflict',
                message: 'Cannot delete customer with existing transactions. Consider archiving instead.'
            });
        }
        await dbRun('DELETE FROM customers WHERE id = ?', [customerId]);
        res.json({
            success: true,
            message: 'Customer deleted successfully'
        });
    }
    catch (err) {
        console.error('DELETE /customers/:id error:', err.message);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to delete customer: ' + err.message
        });
    }
});
// === GET CUSTOMER TRANSACTIONS ===
router.get('/:customerId/transactions', async (req, res) => {
    try {
        const customerId = parseInt(req.params.customerId);
        const { page = 1, limit = 20, start_date, end_date } = req.query;
        if (isNaN(customerId)) {
            return res.status(400).json({ error: 'Invalid customer ID' });
        }
        let whereClause = 'WHERE customer_id = ?';
        const params = [customerId];
        if (start_date) {
            whereClause += ' AND DATE(created_at) >= ?';
            params.push(String(start_date));
        }
        if (end_date) {
            whereClause += ' AND DATE(created_at) <= ?';
            params.push(String(end_date));
        }
        const offset = (parseInt(String(page)) - 1) * parseInt(String(limit));
        const transactions = await dbAll(`
      SELECT * FROM transactions 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `, [...params, parseInt(String(limit)), offset]);
        const totalResult = await dbGet(`
      SELECT COUNT(*) as total FROM transactions ${whereClause}
    `, params);
        // Get transaction items for each transaction
        const transactionsWithItems = await Promise.all(transactions.map(async (transaction) => {
            const items = await dbAll('SELECT * FROM transaction_items WHERE transaction_id = ?', [transaction.id]);
            return {
                ...transaction,
                items
            };
        }));
        res.json({
            transactions: transactionsWithItems,
            pagination: {
                page: parseInt(String(page)),
                limit: parseInt(String(limit)),
                total: totalResult.total,
                pages: Math.ceil(totalResult.total / parseInt(String(limit)))
            }
        });
    }
    catch (err) {
        console.error('GET /customers/:id/transactions error:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});
// === UPDATE LOYALTY POINTS ===
router.put('/:customerId/loyalty-points', async (req, res) => {
    try {
        const customerId = parseInt(req.params.customerId);
        const { points, action = 'add', reason } = req.body; // action: 'add' or 'subtract'
        if (isNaN(customerId)) {
            return res.status(400).json({ error: 'Invalid customer ID' });
        }
        if (typeof points !== 'number' || points <= 0) {
            return res.status(400).json({ error: 'Points must be a positive number' });
        }
        const customer = await dbGet('SELECT * FROM customers WHERE id = ?', [customerId]);
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        let newPoints = customer.loyalty_points;
        if (action === 'add') {
            newPoints += points;
        }
        else if (action === 'subtract') {
            if (customer.loyalty_points < points) {
                return res.status(400).json({
                    error: 'Insufficient points',
                    message: `Customer only has ${customer.loyalty_points} points`
                });
            }
            newPoints -= points;
        }
        else {
            return res.status(400).json({ error: 'Invalid action. Use "add" or "subtract"' });
        }
        await dbRun(`
      UPDATE customers 
      SET loyalty_points = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [newPoints, customerId]);
        const updatedCustomer = await dbGet('SELECT * FROM customers WHERE id = ?', [customerId]);
        res.json({
            success: true,
            customer: updatedCustomer,
            message: `Loyalty points ${action === 'add' ? 'added' : 'subtracted'} successfully`
        });
    }
    catch (err) {
        console.error('PUT /customers/:id/loyalty-points error:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});
// === GET CUSTOMER STATISTICS ===
router.get('/reports/stats', async (req, res) => {
    try {
        const stats = await dbGet(`
      SELECT 
        COUNT(*) as total_customers,
        COUNT(CASE WHEN total_orders > 0 AND last_order_date >= DATE('now', '-30 days') THEN 1 END) as active_customers,
        COUNT(CASE WHEN DATE(created_at) = DATE('now') THEN 1 END) as new_customers_today,
        SUM(loyalty_points) as total_loyalty_points,
        AVG(CASE WHEN total_orders > 0 THEN average_order_value ELSE NULL END) as average_order_value
      FROM customers
    `);
        // Segment distribution with proper calculations
        const segmentStats = await dbAll(`
      SELECT 
        segment,
        COUNT(*) as customer_count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM customers), 2) as percentage,
        AVG(CASE WHEN total_orders > 0 THEN total_spent ELSE 0 END) as avg_spent,
        AVG(total_orders) as avg_orders
      FROM customers 
      GROUP BY segment
      ORDER BY 
        CASE segment
          WHEN 'vip' THEN 1
          WHEN 'loyal' THEN 2
          WHEN 'regular' THEN 3
          WHEN 'new' THEN 4
          WHEN 'inactive' THEN 5
          ELSE 6
        END
    `);
        res.json({
            ...stats,
            segment_distribution: segmentStats
        });
    }
    catch (err) {
        console.error('GET /customers/reports/stats error:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});
// === GET TOP CUSTOMERS ===
router.get('/reports/top-customers', async (req, res) => {
    try {
        const { limit = 10, period = 'all' } = req.query;
        let dateFilter = '';
        const params = [];
        if (period === 'today') {
            dateFilter = 'AND DATE(t.created_at) = DATE("now")';
        }
        else if (period === 'week') {
            dateFilter = 'AND t.created_at >= DATE("now", "-7 days")';
        }
        else if (period === 'month') {
            dateFilter = 'AND t.created_at >= DATE("now", "-30 days")';
        }
        const topCustomers = await dbAll(`
      SELECT 
        c.id,
        c.name,
        c.phone,
        c.email,
        c.segment,
        COUNT(t.id) as order_count,
        SUM(t.total) as total_spent,
        MAX(t.created_at) as last_order_date
      FROM customers c
      LEFT JOIN transactions t ON c.id = t.customer_id AND t.status = 1 ${dateFilter}
      GROUP BY c.id, c.name, c.phone, c.email, c.segment
      HAVING total_spent > 0
      ORDER BY total_spent DESC
      LIMIT ?
    `, [...params, parseInt(String(limit))]);
        res.json(topCustomers);
    }
    catch (err) {
        console.error('GET /customers/reports/top-customers error:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});
// === SEARCH CUSTOMERS ===
router.get('/search/:query', async (req, res) => {
    try {
        const query = req.params.query;
        if (!query || query.trim().length < 2) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Search query must be at least 2 characters long'
            });
        }
        const searchTerm = `%${query.trim()}%`;
        const customers = await dbAll(`
      SELECT * FROM customers 
      WHERE name LIKE ? OR phone LIKE ? OR email LIKE ?
      ORDER BY 
        CASE 
          WHEN name LIKE ? THEN 1
          WHEN phone LIKE ? THEN 2
          WHEN email LIKE ? THEN 3
        END,
        name ASC
      LIMIT 20
    `, [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm]);
        res.json(customers);
    }
    catch (err) {
        console.error('GET /customers/search/:query error:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});
// === UPDATE CUSTOMER SEGMENT ===
router.put('/:customerId/segment', async (req, res) => {
    try {
        const customerId = parseInt(req.params.customerId);
        const { segment } = req.body;
        if (isNaN(customerId)) {
            return res.status(400).json({ error: 'Invalid customer ID' });
        }
        const validSegments = ['new', 'regular', 'vip', 'loyal', 'inactive'];
        if (!segment || !validSegments.includes(segment)) {
            return res.status(400).json({
                error: 'Bad Request',
                message: `Segment must be one of: ${validSegments.join(', ')}`
            });
        }
        const customer = await dbGet('SELECT id FROM customers WHERE id = ?', [customerId]);
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        await dbRun(`
      UPDATE customers 
      SET segment = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [segment, customerId]);
        const updatedCustomer = await dbGet('SELECT * FROM customers WHERE id = ?', [customerId]);
        res.json({
            success: true,
            customer: updatedCustomer,
            message: 'Customer segment updated successfully'
        });
    }
    catch (err) {
        console.error('PUT /customers/:id/segment error:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});
// === RECALCULATE ALL CUSTOMER SEGMENTS ===
router.post('/recalculate-segments', async (req, res) => {
    try {
        console.log('🔄 Recalculating customer segments...');
        // Get all customers
        const customers = await dbAll('SELECT * FROM customers');
        let updatedCount = 0;
        for (const customer of customers) {
            const newSegment = calculateCustomerSegment(customer);
            // Only update if segment changed
            if (newSegment !== customer.segment) {
                await dbRun('UPDATE customers SET segment = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newSegment, customer.id]);
                updatedCount++;
                console.log(`✅ Updated customer ${customer.name} (${customer.id}) from ${customer.segment} to ${newSegment}`);
            }
        }
        res.json({
            success: true,
            message: `Customer segments recalculated successfully`,
            updated: updatedCount,
            total: customers.length
        });
    }
    catch (err) {
        console.error('POST /customers/recalculate-segments error:', err.message);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to recalculate segments: ' + err.message
        });
    }
});
// === UPDATE SEGMENT FOR SPECIFIC CUSTOMER ===
router.post('/update-segment/:customerId', async (req, res) => {
    try {
        const customerId = parseInt(req.params.customerId);
        if (isNaN(customerId)) {
            return res.status(400).json({ error: 'Invalid customer ID' });
        }
        // Get customer with latest data
        const customer = await dbGet('SELECT * FROM customers WHERE id = ?', [customerId]);
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        // Recalculate segment based on current data
        const newSegment = calculateCustomerSegment(customer);
        // Update if segment changed
        if (newSegment !== customer.segment) {
            await dbRun('UPDATE customers SET segment = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newSegment, customerId]);
            const updatedCustomer = await dbGet('SELECT * FROM customers WHERE id = ?', [customerId]);
            res.json({
                success: true,
                customer: updatedCustomer,
                message: `Customer segment updated from ${customer.segment} to ${newSegment}`
            });
        }
        else {
            res.json({
                success: true,
                customer: customer,
                message: 'Customer segment unchanged'
            });
        }
    }
    catch (err) {
        console.error('POST /customers/update-segment/:id error:', err.message);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to update segment: ' + err.message
        });
    }
});
exports.default = router;
