"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/main/api/accounts.ts
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
// ==================== EXPENSES ====================
// Get expense analysis - THIS WAS THE MISSING ENDPOINT CAUSING THE 404 ERROR
router.get('/expenses/analysis', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                error: 'startDate and endDate are required'
            });
        }
        console.log('📊 Fetching expense analysis:', { startDate, endDate });
        // Get total expenses and count
        const totalExpensesQuery = `
      SELECT 
        COUNT(*) as expense_count,
        COALESCE(SUM(amount), 0) as total_amount,
        COALESCE(AVG(amount), 0) as average_amount
      FROM expenses 
      WHERE expense_date BETWEEN ? AND ?
        AND status != 'cancelled'
    `;
        // Get category breakdown
        const categoryBreakdownQuery = `
      SELECT 
        category,
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as amount
      FROM expenses 
      WHERE expense_date BETWEEN ? AND ?
        AND status != 'cancelled'
      GROUP BY category
      ORDER BY amount DESC
    `;
        // Get monthly trend (last 6 months)
        const monthlyTrendQuery = `
      SELECT 
        strftime('%Y-%m', expense_date) as month,
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as amount
      FROM expenses 
      WHERE expense_date BETWEEN date('now', '-6 months') AND date('now')
        AND status != 'cancelled'
      GROUP BY strftime('%Y-%m', expense_date)
      ORDER BY month DESC
      LIMIT 6
    `;
        // Get top vendors
        const topVendorsQuery = `
      SELECT 
        COALESCE(vendor_name, 'Unknown') as vendor_name,
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as amount
      FROM expenses 
      WHERE expense_date BETWEEN ? AND ?
        AND status != 'cancelled'
        AND vendor_name IS NOT NULL
      GROUP BY vendor_name
      ORDER BY amount DESC
      LIMIT 10
    `;
        // Execute all queries
        const [totalExpensesResult] = await dbAll(totalExpensesQuery, [startDate, endDate]);
        const categoryBreakdown = await dbAll(categoryBreakdownQuery, [startDate, endDate]);
        const monthlyTrend = await dbAll(monthlyTrendQuery);
        const topVendors = await dbAll(topVendorsQuery, [startDate, endDate]);
        // Calculate percentages for category breakdown
        const totalAmount = totalExpensesResult.total_amount || 0;
        const categoryBreakdownWithPercentage = categoryBreakdown.map((category) => ({
            ...category,
            percentage: totalAmount > 0 ? (category.amount / totalAmount) * 100 : 0
        }));
        const analysisData = {
            totalExpenses: totalExpensesResult.total_amount || 0,
            expenseCount: totalExpensesResult.expense_count || 0,
            averageExpense: totalExpensesResult.average_amount || 0,
            categoryBreakdown: categoryBreakdownWithPercentage,
            monthlyTrend: monthlyTrend.map((month) => ({
                month: month.month,
                amount: month.amount,
                count: month.count
            })),
            topVendors: topVendors.map((vendor) => ({
                vendor_name: vendor.vendor_name,
                amount: vendor.amount,
                count: vendor.count
            }))
        };
        console.log('✅ Expense analysis fetched successfully:', {
            totalExpenses: analysisData.totalExpenses,
            expenseCount: analysisData.expenseCount,
            categories: analysisData.categoryBreakdown.length
        });
        res.json({
            success: true,
            data: analysisData
        });
    }
    catch (error) {
        console.error('❌ Error fetching expense analysis:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch expense analysis',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});
// Get all expenses
router.get('/expenses', async (req, res) => {
    try {
        const { startDate, endDate, category, status, page = '1', limit = '50' } = req.query;
        let whereClause = 'WHERE 1=1';
        const params = [];
        if (startDate && endDate) {
            whereClause += ' AND expense_date BETWEEN ? AND ?';
            params.push(startDate, endDate);
        }
        if (category) {
            whereClause += ' AND category = ?';
            params.push(category);
        }
        if (status) {
            whereClause += ' AND status = ?';
            params.push(status);
        }
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (pageNum - 1) * limitNum;
        const expenses = await dbAll(`
      SELECT * FROM expenses 
      ${whereClause}
      ORDER BY expense_date DESC, id DESC
      LIMIT ? OFFSET ?
    `, [...params, limitNum, offset]);
        const totalResult = await dbGet(`
      SELECT COUNT(*) as total FROM expenses ${whereClause}
    `, params);
        res.json({
            success: true,
            data: expenses,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: totalResult.total,
                pages: Math.ceil(totalResult.total / limitNum)
            }
        });
    }
    catch (error) {
        console.error('GET /expenses error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});
// Get expense by ID
router.get('/expenses/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const expense = await dbGet('SELECT * FROM expenses WHERE id = ?', [id]);
        if (!expense) {
            return res.status(404).json({
                success: false,
                error: 'Expense not found'
            });
        }
        res.json({
            success: true,
            data: expense
        });
    }
    catch (error) {
        console.error('GET /expenses/:id error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});
// Create expense
router.post('/expenses', async (req, res) => {
    try {
        const { expense_date, description, amount, category, subcategory, payment_method, vendor_name, reference_number, receipt_image, status = 'paid', due_date, recurring = false, recurring_frequency, created_by } = req.body;
        if (!expense_date || !description || !amount || !category || !payment_method) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }
        const result = await dbRun(`
      INSERT INTO expenses 
      (expense_date, description, amount, category, subcategory, payment_method, vendor_name, reference_number, receipt_image, status, due_date, recurring, recurring_frequency, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [expense_date, description, amount, category, subcategory, payment_method, vendor_name, reference_number, receipt_image, status, due_date, recurring, recurring_frequency, created_by]);
        // Also create accounting entry for expense
        await dbRun(`
      INSERT INTO accounting_entries 
      (entry_date, entry_type, description, amount, account_type, category, payment_method, reference_id, reference_table, created_by)
      VALUES (?, 'expense', ?, ?, 'expense', ?, ?, ?, 'expenses', ?)
    `, [expense_date, description, amount, category, payment_method, result.lastID, created_by]);
        res.json({ success: true, data: { id: result.lastID } });
    }
    catch (error) {
        console.error('POST /expenses error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});
// Update expense
router.put('/expenses/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'Expense ID is required'
            });
        }
        // Build dynamic update query
        const updateFields = [];
        const updateValues = [];
        const allowedFields = [
            'expense_date', 'description', 'amount', 'category', 'subcategory',
            'payment_method', 'vendor_name', 'reference_number', 'receipt_image',
            'status', 'due_date', 'recurring', 'recurring_frequency'
        ];
        for (const field of allowedFields) {
            if (field in updates) {
                updateFields.push(`${field} = ?`);
                updateValues.push(updates[field]);
            }
        }
        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No valid fields to update'
            });
        }
        updateValues.push(id);
        const updateQuery = `
      UPDATE expenses 
      SET ${updateFields.join(', ')}, updated_at = datetime('now')
      WHERE id = ?
    `;
        const result = await dbRun(updateQuery, updateValues);
        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                error: 'Expense not found'
            });
        }
        // Get updated expense
        const updatedExpense = await dbGet('SELECT * FROM expenses WHERE id = ?', [id]);
        console.log('✅ Expense updated successfully:', { id, changes: result.changes });
        res.json({
            success: true,
            data: updatedExpense,
            message: 'Expense updated successfully'
        });
    }
    catch (error) {
        console.error('PUT /expenses/:id error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});
// Delete expense
router.delete('/expenses/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'Expense ID is required'
            });
        }
        const result = await dbRun('DELETE FROM expenses WHERE id = ?', [id]);
        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                error: 'Expense not found'
            });
        }
        console.log('✅ Expense deleted successfully:', { id, changes: result.changes });
        res.json({
            success: true,
            message: 'Expense deleted successfully'
        });
    }
    catch (error) {
        console.error('DELETE /expenses/:id error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});
// ==================== DASHBOARD SUMMARY ====================
// Get accounting dashboard summary
router.get('/dashboard-summary', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({ success: false, error: 'Start date and end date are required' });
        }
        // Get multiple metrics in parallel
        const [revenueData, expenseData, cashFlowData, payableData, receivableData] = await Promise.all([
            // Revenue
            dbGet(`
        SELECT SUM(total) as total FROM transactions 
        WHERE created_at BETWEEN ? AND ? AND status = 1
      `, [startDate, endDate]),
            // Expenses
            dbGet(`
        SELECT SUM(amount) as total FROM expenses 
        WHERE expense_date BETWEEN ? AND ? AND status = 'paid'
      `, [startDate, endDate]),
            // Cash Flow
            dbGet(`
        SELECT 
          SUM(CASE WHEN flow_type = 'inflow' THEN amount ELSE 0 END) as inflow,
          SUM(CASE WHEN flow_type = 'outflow' THEN amount ELSE 0 END) as outflow
        FROM cash_flow 
        WHERE flow_date BETWEEN ? AND ?
      `, [startDate, endDate]),
            // Accounts Payable
            dbGet(`
        SELECT 
          SUM(amount_due - amount_paid) as total_due,
          COUNT(*) as pending_count
        FROM accounts_payable 
        WHERE status IN ('pending', 'partial')
      `),
            // Accounts Receivable
            dbGet(`
        SELECT 
          SUM(amount_due - amount_paid) as total_due,
          COUNT(*) as pending_count
        FROM accounts_receivable 
        WHERE status IN ('pending', 'partial')
      `)
        ]);
        const totalRevenue = revenueData?.total || 0;
        const totalExpenses = expenseData?.total || 0;
        const netProfit = totalRevenue - totalExpenses;
        res.json({
            success: true,
            data: {
                revenue: totalRevenue,
                expenses: totalExpenses,
                netProfit: netProfit,
                cashFlow: {
                    inflow: cashFlowData?.inflow || 0,
                    outflow: cashFlowData?.outflow || 0,
                    net: (cashFlowData?.inflow || 0) - (cashFlowData?.outflow || 0)
                },
                accountsPayable: {
                    totalDue: payableData?.total_due || 0,
                    pendingCount: payableData?.pending_count || 0
                },
                accountsReceivable: {
                    totalDue: receivableData?.total_due || 0,
                    pendingCount: receivableData?.pending_count || 0
                }
            }
        });
    }
    catch (error) {
        console.error('GET /dashboard-summary error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});
exports.default = router;
