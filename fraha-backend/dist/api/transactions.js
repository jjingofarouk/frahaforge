"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/main/api/transactions.ts
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
// === GET ALL TRANSACTIONS ===
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 50, customer_id, status, start_date, end_date } = req.query;
        let whereClause = 'WHERE 1=1';
        const params = [];
        if (customer_id) {
            whereClause += ' AND customer_id = ?';
            params.push(String(customer_id));
        }
        if (status) {
            whereClause += ' AND status = ?';
            params.push(parseInt(String(status)));
        }
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
        res.json({
            transactions,
            pagination: {
                page: parseInt(String(page)),
                limit: parseInt(String(limit)),
                total: totalResult.total,
                pages: Math.ceil(totalResult.total / parseInt(String(limit)))
            }
        });
    }
    catch (err) {
        console.error('GET /transactions error:', err.message);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch transactions: ' + err.message
        });
    }
});
// === GET SINGLE TRANSACTION WITH ITEMS ===
router.get('/:transactionId', async (req, res) => {
    try {
        const transactionId = parseInt(req.params.transactionId);
        if (isNaN(transactionId)) {
            return res.status(400).json({ error: 'Invalid transaction ID' });
        }
        const transaction = await dbGet('SELECT * FROM transactions WHERE id = ?', [transactionId]);
        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        const items = await dbAll('SELECT * FROM transaction_items WHERE transaction_id = ? ORDER BY id', [transactionId]);
        res.json({
            ...transaction,
            items
        });
    }
    catch (err) {
        console.error('GET /transactions/:id error:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});
// === CREATE NEW TRANSACTION ===
router.post('/', async (req, res) => {
    try {
        const transactionData = req.body;
        console.log('📥 Received transaction data:', JSON.stringify(transactionData, null, 2));
        // Validate required fields
        if (!transactionData.subtotal || !transactionData.total || !transactionData.paid ||
            !transactionData.user_id || !transactionData.user_name || !transactionData.items?.length) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Missing required fields: subtotal, total, paid, user_id, user_name, and items are required'
            });
        }
        // ✅ GENERATE TIMESTAMP-BASED ID AND ORDER NUMBER (MATCHING EXISTING PATTERN)
        const timestampId = Math.floor(Date.now() / 1000);
        const orderNumber = timestampId;
        const transactionId = timestampId;
        // Generate reference number if not provided
        const refNumber = transactionData.ref_number || `REF-${timestampId}`;
        console.log('🆔 Setting ID and order_number to:', transactionId);
        console.log('🔖 Using ref_number:', refNumber);
        // Start transaction
        await dbRun('BEGIN TRANSACTION');
        try {
            // ✅ EXPLICITLY SET BOTH ID AND ORDER_NUMBER TO SAME TIMESTAMP VALUE
            const insertSQL = `
        INSERT INTO transactions (
          id, order_number, ref_number, discount, customer_id, customer_name, status,
          subtotal, tax, order_type, total, paid, change_amount, payment_type,
          payment_info, till, user_id, user_name, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `;
            const insertParams = [
                transactionId, // id (explicitly set to timestamp)
                orderNumber, // order_number (same as id)
                refNumber,
                transactionData.discount || 0.00,
                transactionData.customer_id || 'walkin_customer',
                transactionData.customer_name || 'Walk-in Customer',
                1, // status: completed
                transactionData.subtotal,
                transactionData.tax || 0.00,
                1, // order_type: sale
                transactionData.total,
                transactionData.paid,
                transactionData.change_amount || 0.00,
                transactionData.payment_type,
                transactionData.payment_info || '',
                transactionData.till || 1,
                transactionData.user_id,
                transactionData.user_name
            ];
            console.log('📝 Executing INSERT with explicit ID:', transactionId);
            await dbRun(insertSQL, insertParams);
            console.log('✅ Transaction created with ID:', transactionId);
            // Insert transaction items and update product quantities
            for (const item of transactionData.items) {
                console.log('📦 Adding item:', item.product_name, 'x', item.quantity);
                await dbRun(`
          INSERT INTO transaction_items (
            transaction_id, product_id, product_name, price, quantity, category
          ) VALUES (?, ?, ?, ?, ?, ?)
        `, [
                    transactionId, // Use our explicit transactionId
                    item.product_id,
                    item.product_name,
                    item.price,
                    item.quantity,
                    item.category || 'Uncategorized'
                ]);
                // Update product inventory
                await dbRun(`
          UPDATE products 
          SET quantity = quantity - ?, 
              sales_count = COALESCE(sales_count, 0) + ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [item.quantity, item.quantity, item.product_id]);
                console.log('📉 Updated inventory for product ID:', item.product_id);
            }
            // Update customer analytics if customer exists (and not walk-in)
            if (transactionData.customer_id && transactionData.customer_id !== 'walkin_customer' && transactionData.customer_id !== 0) {
                const customer = await dbGet('SELECT total_spent, total_orders FROM customers WHERE id = ?', [transactionData.customer_id]);
                if (customer) {
                    const newTotalSpent = parseFloat(customer.total_spent || '0') + transactionData.total;
                    const newTotalOrders = (customer.total_orders || 0) + 1;
                    const newAverage = newTotalSpent / newTotalOrders;
                    await dbRun(`
            UPDATE customers 
            SET total_spent = ?,
                total_orders = ?,
                last_order_date = CURRENT_TIMESTAMP,
                average_order_value = ?,
                loyalty_points = COALESCE(loyalty_points, 0) + ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `, [newTotalSpent, newTotalOrders, newAverage, Math.floor(transactionData.total / 1000), transactionData.customer_id]);
                    console.log('👤 Updated customer analytics');
                    // ✅ AUTOMATICALLY UPDATE CUSTOMER SEGMENT AFTER TRANSACTION
                    try {
                        console.log('🔄 Triggering automatic segment update for customer:', transactionData.customer_id);
                        await dbRun(`
              UPDATE customers 
              SET segment = CASE 
                WHEN total_spent >= 1000000 OR loyalty_points >= 1000 OR total_orders >= 50 THEN 'vip'
                WHEN total_orders >= 10 AND loyalty_points >= 200 AND julianday('now') - julianday(COALESCE(last_order_date, created_at)) <= 60 THEN 'loyal'
                WHEN total_orders >= 3 AND julianday('now') - julianday(COALESCE(last_order_date, created_at)) <= 90 THEN 'regular'
                WHEN total_orders > 0 AND julianday('now') - julianday(COALESCE(last_order_date, created_at)) > 180 THEN 'inactive'
                ELSE 'new'
              END,
              updated_at = CURRENT_TIMESTAMP
              WHERE id = ?
            `, [transactionData.customer_id]);
                        console.log('✅ Customer segment updated automatically');
                    }
                    catch (segmentError) {
                        console.log('⚠️ Segment update failed (non-critical):', segmentError.message);
                        // Don't fail the transaction if segment update fails
                    }
                }
            }
            // Insert into accounting table
            await dbRun(`
        INSERT INTO accounting (
          date, description, amount, category, payment_method, reference, created_at
        ) VALUES (datetime('now'), ?, ?, 'sales', ?, ?, datetime('now'))
      `, [
                `Sale - Order #${orderNumber}`,
                transactionData.total,
                transactionData.payment_type,
                refNumber
            ]);
            console.log('💰 Added to accounting ledger');
            await dbRun('COMMIT');
            console.log('✅ Transaction committed successfully');
            // ✅ RETURN THE EXPLICIT ID WE SET (MATCHING ORDER_NUMBER)
            res.status(201).json({
                success: true,
                id: transactionId, // Return our explicit timestamp ID
                transactionId: transactionId, // Same value
                order_number: orderNumber, // Same value  
                ref_number: refNumber,
                message: 'Transaction completed successfully'
            });
        }
        catch (error) {
            // Rollback on error
            await dbRun('ROLLBACK');
            console.error('❌ Transaction creation failed during database operations:', error.message);
            throw new Error(`Database operation failed: ${error.message}`);
        }
    }
    catch (err) {
        console.error('❌ POST /transactions error:', err.message);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to create transaction: ' + err.message
        });
    }
});
// === CREATE TRANSACTION (with /create endpoint for compatibility) ===
router.post('/create', async (req, res) => {
    try {
        const transactionData = req.body;
        console.log('📥 Received transaction data at /create:', JSON.stringify(transactionData, null, 2));
        // Validate required fields
        if (!transactionData.subtotal || !transactionData.total || !transactionData.paid ||
            !transactionData.user_id || !transactionData.user_name || !transactionData.items?.length) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Missing required fields: subtotal, total, paid, user_id, user_name, and items are required'
            });
        }
        // ✅ GENERATE TIMESTAMP-BASED ID AND ORDER NUMBER (MATCHING EXISTING PATTERN)
        const timestampId = Math.floor(Date.now() / 1000);
        const orderNumber = timestampId;
        const transactionId = timestampId;
        const refNumber = transactionData.ref_number || `REF-${timestampId}`;
        // Start transaction
        await dbRun('BEGIN TRANSACTION');
        try {
            // ✅ EXPLICITLY SET BOTH ID AND ORDER_NUMBER TO SAME TIMESTAMP VALUE
            await dbRun(`
        INSERT INTO transactions (
          id, order_number, ref_number, discount, customer_id, customer_name, status,
          subtotal, tax, order_type, total, paid, change_amount, payment_type,
          payment_info, till, user_id, user_name, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `, [
                transactionId, // id (explicitly set to timestamp)
                orderNumber, // order_number (same as id)
                refNumber,
                transactionData.discount || 0.00,
                transactionData.customer_id || 'walkin_customer',
                transactionData.customer_name || 'Walk-in Customer',
                1,
                transactionData.subtotal,
                transactionData.tax || 0.00,
                1,
                transactionData.total,
                transactionData.paid,
                transactionData.change_amount || 0.00,
                transactionData.payment_type,
                transactionData.payment_info || '',
                transactionData.till || 1,
                transactionData.user_id,
                transactionData.user_name
            ]);
            // Insert transaction items and update product quantities
            for (const item of transactionData.items) {
                await dbRun(`
          INSERT INTO transaction_items (
            transaction_id, product_id, product_name, price, quantity, category
          ) VALUES (?, ?, ?, ?, ?, ?)
        `, [
                    transactionId,
                    item.product_id,
                    item.product_name,
                    item.price,
                    item.quantity,
                    item.category || 'Uncategorized'
                ]);
                await dbRun(`
          UPDATE products 
          SET quantity = quantity - ?, 
              sales_count = COALESCE(sales_count, 0) + ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [item.quantity, item.quantity, item.product_id]);
            }
            // Update customer analytics if applicable
            if (transactionData.customer_id && transactionData.customer_id !== 'walkin_customer' && transactionData.customer_id !== 0) {
                const customer = await dbGet('SELECT total_spent, total_orders FROM customers WHERE id = ?', [transactionData.customer_id]);
                if (customer) {
                    const newTotalSpent = parseFloat(customer.total_spent || '0') + transactionData.total;
                    const newTotalOrders = (customer.total_orders || 0) + 1;
                    const newAverage = newTotalSpent / newTotalOrders;
                    await dbRun(`
            UPDATE customers 
            SET total_spent = ?,
                total_orders = ?,
                last_order_date = CURRENT_TIMESTAMP,
                average_order_value = ?,
                loyalty_points = COALESCE(loyalty_points, 0) + ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `, [newTotalSpent, newTotalOrders, newAverage, Math.floor(transactionData.total / 1000), transactionData.customer_id]);
                    // ✅ AUTOMATICALLY UPDATE CUSTOMER SEGMENT AFTER TRANSACTION
                    try {
                        await dbRun(`
              UPDATE customers 
              SET segment = CASE 
                WHEN total_spent >= 1000000 OR loyalty_points >= 1000 OR total_orders >= 50 THEN 'vip'
                WHEN total_orders >= 10 AND loyalty_points >= 200 AND julianday('now') - julianday(COALESCE(last_order_date, created_at)) <= 60 THEN 'loyal'
                WHEN total_orders >= 3 AND julianday('now') - julianday(COALESCE(last_order_date, created_at)) <= 90 THEN 'regular'
                WHEN total_orders > 0 AND julianday('now') - julianday(COALESCE(last_order_date, created_at)) > 180 THEN 'inactive'
                ELSE 'new'
              END
              WHERE id = ?
            `, [transactionData.customer_id]);
                    }
                    catch (segmentError) {
                        console.log('Segment update failed (non-critical):', segmentError.message);
                    }
                }
            }
            // Insert into accounting
            await dbRun(`
        INSERT INTO accounting (
          date, description, amount, category, payment_method, reference, created_at
        ) VALUES (datetime('now'), ?, ?, 'sales', ?, ?, datetime('now'))
      `, [
                `Sale - Order #${orderNumber}`,
                transactionData.total,
                transactionData.payment_type,
                refNumber
            ]);
            await dbRun('COMMIT');
            // ✅ RETURN THE EXPLICIT ID WE SET (MATCHING ORDER_NUMBER)
            res.status(201).json({
                success: true,
                id: transactionId, // Return our explicit timestamp ID
                transactionId: transactionId, // Same value
                order_number: orderNumber, // Same value  
                ref_number: refNumber,
                message: 'Transaction completed successfully'
            });
        }
        catch (error) {
            await dbRun('ROLLBACK');
            console.error('Transaction creation failed:', error.message);
            throw new Error(`Database operation failed: ${error.message}`);
        }
    }
    catch (err) {
        console.error('POST /transactions/create error:', err.message);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to create transaction: ' + err.message
        });
    }
});
// === GET TRANSACTION ITEMS ===
router.get('/:transactionId/items', async (req, res) => {
    try {
        const transactionId = parseInt(req.params.transactionId);
        if (isNaN(transactionId)) {
            return res.status(400).json({ error: 'Invalid transaction ID' });
        }
        const items = await dbAll('SELECT * FROM transaction_items WHERE transaction_id = ? ORDER BY id', [transactionId]);
        res.json(items);
    }
    catch (err) {
        console.error('GET /transactions/:id/items error:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});
// === SALES REPORTS ===
router.get('/reports/sales', async (req, res) => {
    try {
        const { startDate, endDate, period = 'daily' } = req.query;
        let dateFormat = '%Y-%m-%d';
        let groupBy = 'DATE(created_at)';
        switch (period) {
            case 'weekly':
                dateFormat = '%Y-%W';
                groupBy = 'strftime("%Y-%W", created_at)';
                break;
            case 'monthly':
                dateFormat = '%Y-%m';
                groupBy = 'strftime("%Y-%m", created_at)';
                break;
            case 'yearly':
                dateFormat = '%Y';
                groupBy = 'strftime("%Y", created_at)';
                break;
        }
        let whereClause = 'WHERE status = 1';
        const params = [];
        if (startDate) {
            whereClause += ' AND DATE(created_at) >= ?';
            params.push(startDate);
        }
        if (endDate) {
            whereClause += ' AND DATE(created_at) <= ?';
            params.push(endDate);
        }
        const salesData = await dbAll(`
      SELECT 
        ${groupBy} as period,
        COUNT(*) as transaction_count,
        SUM(total) as total_sales,
        SUM(subtotal) as total_subtotal,
        SUM(tax) as total_tax,
        SUM(discount) as total_discount,
        AVG(total) as average_sale
      FROM transactions 
      ${whereClause}
      GROUP BY ${groupBy}
      ORDER BY period DESC
    `, params);
        res.json(salesData);
    }
    catch (err) {
        console.error('GET /transactions/reports/sales error:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});
// === TOP SELLING PRODUCTS ===
router.get('/reports/top-products', async (req, res) => {
    try {
        const { limit = 10, startDate, endDate } = req.query;
        let whereClause = 'WHERE t.status = 1';
        const params = [];
        if (startDate) {
            whereClause += ' AND DATE(t.created_at) >= ?';
            params.push(String(startDate));
        }
        if (endDate) {
            whereClause += ' AND DATE(t.created_at) <= ?';
            params.push(String(endDate));
        }
        const topProducts = await dbAll(`
      SELECT 
        ti.product_id,
        ti.product_name,
        ti.category,
        SUM(ti.quantity) as total_quantity,
        SUM(ti.price * ti.quantity) as total_revenue,
        COUNT(DISTINCT t.id) as transaction_count
      FROM transaction_items ti
      JOIN transactions t ON ti.transaction_id = t.id
      ${whereClause}
      GROUP BY ti.product_id, ti.product_name, ti.category
      ORDER BY total_quantity DESC
      LIMIT ?
    `, [...params, parseInt(String(limit))]);
        res.json(topProducts);
    }
    catch (err) {
        console.error('GET /transactions/reports/top-products error:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});
// === REFUND/UPDATE TRANSACTION ===
router.put('/:transactionId/refund', async (req, res) => {
    try {
        const transactionId = parseInt(req.params.transactionId);
        const { reason, items, user_id, user_name } = req.body;
        if (isNaN(transactionId)) {
            return res.status(400).json({ error: 'Invalid transaction ID' });
        }
        if (!user_id || !user_name) {
            return res.status(400).json({ error: 'User information required for refund' });
        }
        const transaction = await dbGet('SELECT * FROM transactions WHERE id = ?', [transactionId]);
        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        await dbRun('BEGIN TRANSACTION');
        try {
            await dbRun('UPDATE transactions SET status = 0 WHERE id = ?', [transactionId]);
            if (items && items.length > 0) {
                for (const item of items) {
                    await dbRun(`
            UPDATE products 
            SET quantity = quantity + ?, 
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `, [item.quantity, item.product_id]);
                }
            }
            else {
                const transactionItems = await dbAll('SELECT * FROM transaction_items WHERE transaction_id = ?', [transactionId]);
                for (const item of transactionItems) {
                    await dbRun(`
            UPDATE products 
            SET quantity = quantity + ?, 
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `, [item.quantity, item.product_id]);
                }
            }
            await dbRun(`
        INSERT INTO accounting (
          date, description, amount, category, payment_method, reference, created_at
        ) VALUES (datetime('now'), ?, ?, 'refunds', ?, ?, datetime('now'))
      `, [
                `Refund - Order #${transaction.order_number}${reason ? ` - ${reason}` : ''}`,
                -transaction.total,
                transaction.payment_type,
                `REFUND-TXN-${transactionId}`
            ]);
            await dbRun('COMMIT');
            res.json({
                success: true,
                message: 'Transaction refunded successfully'
            });
        }
        catch (error) {
            await dbRun('ROLLBACK');
            console.error('Refund operation failed:', error.message);
            throw error;
        }
    }
    catch (err) {
        console.error('PUT /transactions/:id/refund error:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});
// === GET DAILY SUMMARY ===
router.get('/reports/daily-summary', async (req, res) => {
    try {
        const { date } = req.query;
        const targetDate = date ? String(date) : new Date().toISOString().split('T')[0];
        const summary = await dbGet(`
      SELECT 
        COUNT(*) as total_transactions,
        SUM(total) as total_sales,
        SUM(subtotal) as total_subtotal,
        SUM(tax) as total_tax,
        SUM(discount) as total_discount,
        SUM(paid) as total_paid,
        SUM(change_amount) as total_change,
        MIN(created_at) as first_transaction,
        MAX(created_at) as last_transaction
      FROM transactions 
      WHERE DATE(created_at) = ? AND status = 1
    `, [targetDate]);
        const paymentMethods = await dbAll(`
      SELECT 
        payment_type,
        COUNT(*) as transaction_count,
        SUM(total) as total_amount
      FROM transactions 
      WHERE DATE(created_at) = ? AND status = 1
      GROUP BY payment_type
    `, [targetDate]);
        res.json({
            date: targetDate,
            summary: summary || {
                total_transactions: 0,
                total_sales: 0,
                total_subtotal: 0,
                total_tax: 0,
                total_discount: 0,
                total_paid: 0,
                total_change: 0,
                first_transaction: null,
                last_transaction: null
            },
            payment_methods: paymentMethods
        });
    }
    catch (err) {
        console.error('GET /transactions/reports/daily-summary error:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});
// Add this endpoint to your existing transactions API router
router.get('/reports/product-sales', async (req, res) => {
    try {
        const { startDate, endDate, limit = 50 } = req.query;
        console.log('📊 Product sales report requested:', { startDate, endDate, limit });
        let whereClause = 'WHERE t.status = 1'; // Only completed transactions
        let params = [];
        if (startDate && endDate) {
            whereClause += ' AND DATE(t.created_at) BETWEEN ? AND ?';
            params.push(String(startDate), String(endDate));
        }
        const sql = `
      SELECT 
        ti.product_name as productName,
        ti.category,
        SUM(ti.quantity) as totalQuantity,
        SUM(ti.price * ti.quantity) as totalRevenue,
        COUNT(DISTINCT t.id) as transactionCount,
        AVG(ti.price) as averagePrice
      FROM transaction_items ti
      JOIN transactions t ON ti.transaction_id = t.id
      ${whereClause}
      GROUP BY ti.product_name, ti.category
      ORDER BY totalRevenue DESC
      LIMIT ?
    `;
        params.push(parseInt(String(limit)));
        console.log('🔍 Executing SQL:', sql);
        console.log('📋 With params:', params);
        const productSales = await dbAll(sql, params);
        console.log('✅ Product sales data found:', productSales.length, 'products');
        res.json(productSales);
    }
    catch (err) {
        console.error('❌ Product sales report error:', err.message);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to generate product sales report: ' + err.message
        });
    }
});
exports.default = router;
