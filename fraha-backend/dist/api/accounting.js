"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_1 = require("../database/database");
const router = express_1.default.Router();
// Use the shared database instance
const db = database_1.database.getDatabase();
// Helper functions using the shared database
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
// Initialize with sample expenses if empty
async function initializeSampleData() {
    try {
        const expenseCount = await dbGet('SELECT COUNT(*) as count FROM accounting');
        if (expenseCount.count === 0) {
            const sampleExpenses = [
                {
                    id: '1',
                    date: new Date().toISOString(),
                    description: 'Rent Payment',
                    category: 'Operating Expenses',
                    amount: 1500,
                    paymentMethod: 'Bank Transfer',
                    reference: 'RENT-001'
                },
                {
                    id: '2',
                    date: new Date(Date.now() - 86400000).toISOString(),
                    description: 'Office Supplies',
                    category: 'Supplies',
                    amount: 250,
                    paymentMethod: 'Cash',
                    reference: 'SUP-001'
                }
            ];
            for (const expense of sampleExpenses) {
                await dbRun(`
                    INSERT INTO accounting (id, date, description, amount, category, payment_method, reference)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `, [
                    expense.id,
                    expense.date,
                    expense.description,
                    expense.amount,
                    expense.category,
                    expense.paymentMethod,
                    expense.reference || ''
                ]);
            }
            console.log('Sample expenses initialized');
        }
    }
    catch (err) {
        console.error('Error initializing sample data:', err);
    }
}
// Call initialization
initializeSampleData();
// NEW: Get product margin analysis
router.get('/analytics/product-margins', async (req, res) => {
    try {
        const { category, marginThreshold } = req.query;
        let query = `
            SELECT 
                p.id as productId,
                p.name as productName,
                p.category,
                p.price as sellingPrice,
                p.cost_price as costPrice,
                p.profit_margin as profitMargin,
                p.profit_amount as profitAmount,
                p.sales_count as salesCount,
                CASE 
                    WHEN p.cost_price IS NULL OR p.cost_price = 0 THEN 'No Cost Data'
                    WHEN (p.price - p.cost_price) / p.price >= 0.5 THEN 'High Margin'
                    WHEN (p.price - p.cost_price) / p.price >= 0.2 THEN 'Medium Margin'
                    ELSE 'Low Margin'
                END as status
            FROM products p
            WHERE 1=1
        `;
        const params = [];
        if (category && category !== 'all') {
            query += ' AND p.category = ?';
            params.push(category);
        }
        if (marginThreshold) {
            const threshold = parseFloat(marginThreshold);
            query += ' AND (p.price - COALESCE(p.cost_price, 0)) / p.price >= ?';
            params.push(threshold);
        }
        query += ' ORDER BY (p.price - COALESCE(p.cost_price, 0)) / p.price DESC';
        const products = await dbAll(query, params);
        res.json(products);
    }
    catch (err) {
        console.error('Error fetching product margin analysis:', err);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch product margin analysis',
        });
    }
});
// NEW: Get inventory valuation
router.get('/inventory/valuation', async (req, res) => {
    try {
        // Calculate total inventory value
        const inventoryValue = await dbGet(`
            SELECT SUM(COALESCE(cost_price, price * 0.6) * quantity) as totalValue
            FROM products 
            WHERE quantity > 0
        `);
        // Calculate average margin
        const averageMargin = await dbGet(`
            SELECT AVG(
                CASE 
                    WHEN cost_price IS NOT NULL AND cost_price > 0 AND price > 0 
                    THEN (price - cost_price) / price 
                    ELSE 0.4 
                END
            ) * 100 as averageMargin
            FROM products 
            WHERE quantity > 0
        `);
        // Count low stock and out of stock items
        const stockCounts = await dbGet(`
            SELECT 
                COUNT(*) as totalItems,
                SUM(CASE WHEN quantity <= reorder_level AND quantity > 0 THEN 1 ELSE 0 END) as lowStockItems,
                SUM(CASE WHEN quantity = 0 THEN 1 ELSE 0 END) as outOfStockItems
            FROM products
        `);
        // Get category breakdown
        const categoryBreakdown = await dbAll(`
            SELECT 
                COALESCE(category, 'Uncategorized') as category,
                SUM(COALESCE(cost_price, price * 0.6) * quantity) as value,
                COUNT(*) as itemCount
            FROM products 
            WHERE quantity > 0
            GROUP BY category
            ORDER BY value DESC
        `);
        const totalValue = inventoryValue.totalValue || 0;
        const breakdownWithPercentage = categoryBreakdown.map(cat => ({
            category: cat.category,
            value: cat.value,
            percentage: totalValue > 0 ? (cat.value / totalValue) * 100 : 0
        }));
        const valuation = {
            totalValue,
            averageMargin: averageMargin.averageMargin || 0,
            lowStockItems: stockCounts.lowStockItems || 0,
            outOfStockItems: stockCounts.outOfStockItems || 0,
            categoryBreakdown: breakdownWithPercentage
        };
        res.json(valuation);
    }
    catch (err) {
        console.error('Error fetching inventory valuation:', err);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch inventory valuation',
        });
    }
});
// NEW: Get product performance analytics
router.get('/analytics/product-performance', async (req, res) => {
    try {
        const { startDate, endDate, limit = '10' } = req.query;
        const periodStart = startDate ? new Date(startDate).toISOString() : new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
        const periodEnd = endDate ? new Date(endDate).toISOString() : new Date().toISOString();
        const productPerformance = await dbAll(`
            SELECT 
                p.id as productId,
                p.name as productName,
                SUM(ti.price * ti.quantity) as revenue,
                SUM(COALESCE(p.cost_price, ti.price * 0.4) * ti.quantity) as cogs,
                SUM(ti.quantity) as quantitySold,
                COUNT(DISTINCT t.id) as salesCount
            FROM products p
            INNER JOIN transaction_items ti ON p.id = ti.product_id
            INNER JOIN transactions t ON ti.transaction_id = t.id
            WHERE t.status = 1 
            AND t.created_at BETWEEN ? AND ?
            GROUP BY p.id, p.name
            ORDER BY revenue DESC
            LIMIT ?
        `, [periodStart, periodEnd, parseInt(limit)]);
        const performanceData = productPerformance.map(item => {
            const grossProfit = item.revenue - item.cogs;
            const profitMargin = item.revenue > 0 ? (grossProfit / item.revenue) * 100 : 0;
            return {
                productId: item.productId,
                productName: item.productName,
                revenue: item.revenue,
                cogs: item.cogs,
                grossProfit,
                profitMargin,
                salesCount: item.salesCount,
                quantitySold: item.quantitySold
            };
        });
        res.json(performanceData);
    }
    catch (err) {
        console.error('Error fetching product performance:', err);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch product performance',
        });
    }
});
// ENHANCED: Financial metrics with inventory data
router.get('/metrics', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        // Calculate date range
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
        const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();
        const periodStart = startDate ? new Date(startDate).toISOString() : todayStart;
        const periodEnd = endDate ? new Date(endDate).toISOString() : todayEnd;
        // Get transactions and products from SQLite
        const periodTransactions = await dbAll(`
            SELECT * FROM transactions 
            WHERE status = 1 AND created_at BETWEEN ? AND ?
        `, [periodStart, periodEnd]);
        const products = await dbAll('SELECT * FROM products');
        // Calculate revenue and actual COGS
        let totalRevenue = 0;
        let totalCOGS = 0;
        let transactionCount = periodTransactions.length;
        for (const transaction of periodTransactions) {
            totalRevenue += parseFloat(transaction.total || '0');
            // Get transaction items
            const items = await dbAll('SELECT * FROM transaction_items WHERE transaction_id = ?', [transaction.id]);
            for (const item of items) {
                const product = products.find(p => p.id === parseInt(item.productid));
                if (product && product.costPrice && parseFloat(product.costPrice) > 0) {
                    totalCOGS += parseFloat(product.costPrice) * parseInt(item.quantity);
                }
                else {
                    // Fallback: use 40% of selling price if cost price is missing
                    totalCOGS += parseFloat(item.price) * parseInt(item.quantity) * 0.4;
                }
            }
        }
        // Get expenses for the period
        const expenses = await dbAll(`
            SELECT * FROM accounting 
            WHERE date BETWEEN ? AND ?
        `, [periodStart, periodEnd]);
        const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
        // Calculate inventory value
        const inventoryValue = await dbGet(`
            SELECT SUM(COALESCE(cost_price, price * 0.6) * quantity) as totalValue
            FROM products 
            WHERE quantity > 0
        `);
        // Get top performing product with quantity sold
        const topProduct = await dbGet(`
            SELECT 
                p.id as productId,
                p.name as productName,
                SUM(ti.price * ti.quantity) as revenue,
                SUM(COALESCE(p.cost_price, ti.price * 0.4) * ti.quantity) as cogs,
                SUM(ti.quantity) as quantitySold,
                COUNT(DISTINCT t.id) as salesCount
            FROM products p
            INNER JOIN transaction_items ti ON p.id = ti.product_id
            INNER JOIN transactions t ON ti.transaction_id = t.id
            WHERE t.status = 1 AND t.created_at BETWEEN ? AND ?
            GROUP BY p.id, p.name
            ORDER BY revenue DESC
            LIMIT 1
        `, [periodStart, periodEnd]);
        // Get lowest margin product with quantity sold
        const lowestMarginProduct = await dbGet(`
            SELECT 
                p.id as productId,
                p.name as productName,
                SUM(ti.price * ti.quantity) as revenue,
                SUM(COALESCE(p.cost_price, ti.price * 0.4) * ti.quantity) as cogs,
                SUM(ti.quantity) as quantitySold,
                COUNT(DISTINCT t.id) as salesCount
            FROM products p
            INNER JOIN transaction_items ti ON p.id = ti.product_id
            INNER JOIN transactions t ON ti.transaction_id = t.id
            WHERE t.status = 1 AND t.created_at BETWEEN ? AND ?
            AND p.cost_price IS NOT NULL AND p.cost_price > 0
            GROUP BY p.id, p.name
            HAVING revenue > 0
            ORDER BY (revenue - cogs) / revenue ASC
            LIMIT 1
        `, [periodStart, periodEnd]);
        // Calculate profits with actual data
        const grossProfit = totalRevenue - totalCOGS;
        const netProfit = grossProfit - totalExpenses;
        const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
        const averageTransaction = transactionCount > 0 ? totalRevenue / transactionCount : 0;
        // Count products missing cost prices
        const productsMissingCost = products.filter(product => !product.costPrice || product.costPrice === '0' || product.costPrice === '').length;
        // Format product performance data
        const topPerformingProduct = topProduct ? {
            productId: topProduct.productId,
            productName: topProduct.productName,
            revenue: topProduct.revenue || 0,
            cogs: topProduct.cogs || 0,
            grossProfit: (topProduct.revenue || 0) - (topProduct.cogs || 0),
            profitMargin: topProduct.revenue ? ((topProduct.revenue - topProduct.cogs) / topProduct.revenue) * 100 : 0,
            salesCount: topProduct.salesCount || 0,
            quantitySold: topProduct.quantitySold || 0
        } : undefined;
        const lowestMarginProductData = lowestMarginProduct ? {
            productId: lowestMarginProduct.productId,
            productName: lowestMarginProduct.productName,
            revenue: lowestMarginProduct.revenue || 0,
            cogs: lowestMarginProduct.cogs || 0,
            grossProfit: (lowestMarginProduct.revenue || 0) - (lowestMarginProduct.cogs || 0),
            profitMargin: lowestMarginProduct.revenue ? ((lowestMarginProduct.revenue - lowestMarginProduct.cogs) / lowestMarginProduct.revenue) * 100 : 0,
            salesCount: lowestMarginProduct.salesCount || 0,
            quantitySold: lowestMarginProduct.quantitySold || 0
        } : undefined;
        const metrics = {
            todaysProfit: netProfit,
            totalExpenses,
            totalRevenue,
            grossProfit,
            netProfit,
            profitMargin,
            averageTransaction,
            transactionCount,
            productsMissingCost,
            inventoryValue: inventoryValue.totalValue || 0,
            inventoryTurnover: totalCOGS > 0 ? totalRevenue / totalCOGS : 0,
            topPerformingProduct,
            lowestMarginProduct: lowestMarginProductData,
            period: startDate && endDate ?
                `${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}` :
                'Today'
        };
        res.json(metrics);
    }
    catch (err) {
        console.error('Error fetching financial metrics:', err);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch financial metrics',
        });
    }
});
// NEW: Get profit trends for charts with enhanced product data
router.get('/profit-trends', async (req, res) => {
    try {
        const { startDate, endDate, period } = req.query;
        // Calculate date range
        const today = new Date();
        const periodStart = startDate ? new Date(startDate) : new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const periodEnd = endDate ? new Date(endDate) : new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
        // Get all transactions from SQLite
        const transactions = await dbAll('SELECT * FROM transactions WHERE status = 1');
        // Get all products from SQLite
        const products = await dbAll('SELECT * FROM products');
        // Get all expenses from SQLite
        const expenses = await dbAll('SELECT * FROM accounting');
        // Generate trend data based on period
        const trendData = generateProfitTrendData(transactions, expenses, products, periodStart, periodEnd, period);
        res.json(trendData);
    }
    catch (err) {
        console.error('Error fetching profit trends:', err);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch profit trends',
        });
    }
});
// NEW: Get low stock alerts for accounting perspective
router.get('/alerts/low-stock', async (req, res) => {
    try {
        const lowStockProducts = await dbAll(`
            SELECT 
                p.id,
                p.name,
                p.category,
                p.quantity,
                p.reorder_level,
                p.cost_price,
                p.price,
                COALESCE(p.cost_price, p.price * 0.6) * p.quantity as inventoryValue,
                (p.price - COALESCE(p.cost_price, p.price * 0.4)) / p.price as currentMargin
            FROM products p
            WHERE p.quantity <= p.reorder_level
            ORDER BY p.quantity ASC, inventoryValue DESC
        `);
        res.json(lowStockProducts);
    }
    catch (err) {
        console.error('Error fetching low stock alerts:', err);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch low stock alerts',
        });
    }
});
// NEW: Get products with missing cost data
router.get('/alerts/missing-costs', async (req, res) => {
    try {
        const missingCostProducts = await dbAll(`
            SELECT 
                p.id,
                p.name,
                p.category,
                p.price,
                p.quantity,
                p.sales_count,
                p.price * p.quantity as estimatedValue,
                p.price * 0.4 as estimatedCost
            FROM products p
            WHERE p.cost_price IS NULL OR p.cost_price = 0 OR p.cost_price = ''
            ORDER BY p.sales_count DESC, estimatedValue DESC
        `);
        res.json(missingCostProducts);
    }
    catch (err) {
        console.error('Error fetching products with missing costs:', err);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch products with missing costs',
        });
    }
});
// Keep all existing expense endpoints (they remain the same)
router.get('/expenses', async (req, res) => {
    try {
        const { category, startDate, endDate } = req.query;
        let query = 'SELECT * FROM accounting WHERE 1=1';
        const params = [];
        if (category && category !== 'all') {
            query += ' AND category = ?';
            params.push(category);
        }
        if (startDate && endDate) {
            query += ' AND date BETWEEN ? AND ?';
            params.push(new Date(startDate).toISOString(), new Date(endDate).toISOString());
        }
        query += ' ORDER BY date DESC';
        const expenses = await dbAll(query, params);
        res.json(expenses);
    }
    catch (err) {
        console.error('Error fetching expenses:', err);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch expenses',
        });
    }
});
// Add new expense
router.post('/expenses', async (req, res) => {
    try {
        const newExpense = {
            ...req.body,
            id: Math.floor(Date.now() / 1000).toString()
        };
        await dbRun(`
            INSERT INTO accounting (id, date, description, amount, category, payment_method, reference)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            newExpense.id,
            newExpense.date,
            newExpense.description,
            newExpense.amount,
            newExpense.category,
            newExpense.paymentMethod,
            newExpense.reference || ''
        ]);
        res.json(newExpense);
    }
    catch (err) {
        console.error('Error adding expense:', err);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to add expense',
        });
    }
});
// Update expense
router.put('/expenses/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await dbRun(`
            UPDATE accounting 
            SET date = ?, description = ?, amount = ?, category = ?, payment_method = ?, reference = ?
            WHERE id = ?
        `, [
            req.body.date,
            req.body.description,
            req.body.amount,
            req.body.category,
            req.body.paymentMethod,
            req.body.reference || '',
            id
        ]);
        if (result.changes === 0) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Expense not found',
            });
        }
        const updated = await dbGet('SELECT * FROM accounting WHERE id = ?', [id]);
        res.json(updated);
    }
    catch (err) {
        console.error('Error updating expense:', err);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to update expense',
        });
    }
});
// Delete expense
router.delete('/expenses/:id', async (req, res) => {
    try {
        const result = await dbRun('DELETE FROM accounting WHERE id = ?', [req.params.id]);
        if (result.changes === 0) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Expense not found',
            });
        }
        res.sendStatus(200);
    }
    catch (err) {
        console.error('Error deleting expense:', err);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to delete expense',
        });
    }
});
// Get expense categories
router.get('/expenses/categories', async (req, res) => {
    try {
        const categories = await dbAll('SELECT DISTINCT category FROM accounting');
        res.json(categories.map(c => c.category));
    }
    catch (err) {
        console.error('Error fetching categories:', err);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch categories',
        });
    }
});
// Helper function to generate profit trend data
function generateProfitTrendData(transactions, expenses, products, startDate, endDate, period) {
    const data = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        let dailyRevenue = 0;
        let dailyCOGS = 0;
        // Calculate daily revenue and COGS from transactions
        const dailyTransactions = transactions.filter(t => t.date.startsWith(dateStr));
        for (const transaction of dailyTransactions) {
            dailyRevenue += parseFloat(transaction.total || '0');
            // This is simplified - in a real implementation, you'd calculate actual COGS
            // based on transaction items and product costs
            dailyCOGS += parseFloat(transaction.total || '0') * 0.6; // Estimate
        }
        // Calculate daily expenses
        const dailyExpenses = expenses
            .filter(e => e.date.startsWith(dateStr))
            .reduce((sum, expense) => sum + expense.amount, 0);
        const dailyGrossProfit = dailyRevenue - dailyCOGS;
        const dailyNetProfit = dailyGrossProfit - dailyExpenses;
        data.push({
            date: dateStr,
            revenue: dailyRevenue,
            profit: dailyNetProfit,
            expenses: dailyExpenses,
            grossProfit: dailyGrossProfit
        });
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return data;
}
exports.default = router;
