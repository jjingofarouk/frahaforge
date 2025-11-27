// src/main/api/transactions.ts
import express, { Request, Response } from 'express';
import { database } from '../database/database';

const router = express.Router();

// Use the shared database instance
const db = database.getDatabase();

// Database helper functions
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
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ changes: this.changes, lastID: this.lastID });
    });
  });
};

// Interfaces
interface Transaction {
  id: number;
  order_number: number;
  ref_number: string;
  discount: number;
  customer_id: number | string;
  customer_name: string;
  status: number;
  subtotal: number;
  tax: number;
  order_type: number;
  total: number;
  paid: number;
  change_amount: number;
  payment_type: string;
  payment_info: string;
  till: number;
  user_id: number;
  user_name: string;
  created_at: string;
}

interface TransactionItem {
  id: number;
  transaction_id: number;
  product_id: number;
  product_name: string;
  price: number;
  quantity: number;
  category: string;
}

interface CreateTransactionRequest {
  customer_id?: number | string;
  customer_name?: string;
  discount?: number;
  subtotal: number;
  tax: number;
  total: number;
  paid: number;
  change_amount: number;
  payment_type: string;
  payment_info?: string;
  till?: number;
  user_id: number;
  user_name: string;
  items: {
    product_id: number;
    product_name: string;
    price: number;
    quantity: number;
    category: string;
  }[];
  ref_number?: string;
}

interface SalesReportParams {
  startDate?: string;
  endDate?: string;
  period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

// === GET ALL TRANSACTIONS ===
router.get('/', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 50, customer_id, status, start_date, end_date } = req.query;
    
    console.log('📅 Received date range (UTC):', { start_date, end_date });
    
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    
    if (customer_id) {
      whereClause += ' AND customer_id = ?';
      params.push(String(customer_id));
    }
    
    if (status) {
      whereClause += ' AND status = ?';
      params.push(parseInt(String(status)));
    }
    
    // FIXED: Use UTC date filtering directly (no timezone conversion)
    if (start_date) {
      whereClause += ' AND created_at >= ?';
      params.push(String(start_date) + ' 00:00:00');
      console.log('🟢 Start date (UTC):', String(start_date) + ' 00:00:00');
    }
    
    if (end_date) {
      whereClause += ' AND created_at <= ?';
      params.push(String(end_date) + ' 23:59:59');
      console.log('🔴 End date (UTC):', String(end_date) + ' 23:59:59');
    }
    
    const offset = (parseInt(String(page)) - 1) * parseInt(String(limit));
    
    console.log('🔍 Final SQL query:', `
      SELECT * FROM transactions 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `);
    console.log('📋 Query params:', [...params, parseInt(String(limit)), offset]);
    
    const transactions = await dbAll(`
      SELECT * FROM transactions 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `, [...params, parseInt(String(limit)), offset]);
    
    console.log('✅ Found transactions:', transactions.length);
    
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
  } catch (err: any) {
    console.error('GET /transactions error:', err.message);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Failed to fetch transactions: ' + err.message 
    });
  }
});

// === GET SINGLE TRANSACTION WITH ITEMS ===
router.get('/:transactionId', async (req: Request, res: Response) => {
  try {
    const transactionId = parseInt(req.params.transactionId);
    if (isNaN(transactionId)) {
      return res.status(400).json({ error: 'Invalid transaction ID' });
    }
    
    const transaction = await dbGet('SELECT * FROM transactions WHERE id = ?', [transactionId]) as Transaction;
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    const items = await dbAll(
      'SELECT * FROM transaction_items WHERE transaction_id = ? ORDER BY id',
      [transactionId]
    ) as TransactionItem[];
    
    res.json({
      ...transaction,
      items
    });
  } catch (err: any) {
    console.error('GET /transactions/:id error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// === CREATE NEW TRANSACTION ===
router.post('/', async (req: Request, res: Response) => {
  try {
    const transactionData: CreateTransactionRequest = req.body;
    
    console.log('📥 Received transaction data:', JSON.stringify(transactionData, null, 2));
    
    // Validate required fields
    if (!transactionData.subtotal || !transactionData.total || !transactionData.paid || 
        !transactionData.user_id || !transactionData.user_name || !transactionData.items?.length) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'Missing required fields: subtotal, total, paid, user_id, user_name, and items are required' 
      });
    }
    
    // ✅ GENERATE TIMESTAMP-BASED ID AND ORDER NUMBER
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
      // ✅ USE UTC TIMESTAMP (datetime('now'))
      const insertSQL = `
        INSERT INTO transactions (
          id, order_number, ref_number, discount, customer_id, customer_name, status,
          subtotal, tax, order_type, total, paid, change_amount, payment_type,
          payment_info, till, user_id, user_name, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `;
      
      const insertParams = [
        transactionId,
        orderNumber,
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
          transactionId,
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
              updated_at = datetime('now')
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
                last_order_date = datetime('now'),
                average_order_value = ?,
                loyalty_points = COALESCE(loyalty_points, 0) + ?,
                updated_at = datetime('now')
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
              updated_at = datetime('now')
              WHERE id = ?
            `, [transactionData.customer_id]);
            
            console.log('✅ Customer segment updated automatically');
          } catch (segmentError: any) {
            console.log('⚠️ Segment update failed (non-critical):', segmentError.message);
            // Don't fail the transaction if segment update fails
          }
        }
      }
      
      // Insert into accounting table with UTC timestamp
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
        id: transactionId,
        transactionId: transactionId,
        order_number: orderNumber,
        ref_number: refNumber,
        message: 'Transaction completed successfully'
      });
      
    } catch (error: any) {
      // Rollback on error
      await dbRun('ROLLBACK');
      console.error('❌ Transaction creation failed during database operations:', error.message);
      throw new Error(`Database operation failed: ${error.message}`);
    }
    
  } catch (err: any) {
    console.error('❌ POST /transactions error:', err.message);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Failed to create transaction: ' + err.message 
    });
  }
});

// === CREATE HOLD ORDER ===
router.post('/hold', async (req: Request, res: Response) => {
  try {
    const holdOrderData: CreateTransactionRequest = req.body;
    
    console.log('📥 Received hold order data:', JSON.stringify(holdOrderData, null, 2));
    
    // Validate required fields
    if (!holdOrderData.subtotal || !holdOrderData.total || 
        !holdOrderData.user_id || !holdOrderData.user_name || !holdOrderData.items?.length) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'Missing required fields: subtotal, total, user_id, user_name, and items are required' 
      });
    }

    // ✅ VALIDATE: Hold orders require registered customers
    if (!holdOrderData.customer_id || holdOrderData.customer_id === 'walkin_customer' || holdOrderData.customer_id === 0) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'Hold orders require a registered customer. Please select a customer from the system.' 
      });
    }
    
    // ✅ GENERATE TIMESTAMP-BASED ID AND ORDER NUMBER
    const timestampId = Math.floor(Date.now() / 1000);
    const orderNumber = timestampId;
    const transactionId = timestampId;
    
    // Generate reference number if not provided
    const refNumber = holdOrderData.ref_number || `HOLD-${timestampId}`;
    
    console.log('🆔 Creating hold order with ID:', transactionId);
    console.log('🔖 Using ref_number:', refNumber);
    console.log('👤 Customer ID:', holdOrderData.customer_id);
    
    // Start transaction
    await dbRun('BEGIN TRANSACTION');
    
    try {
      // ✅ CREATE TRANSACTION WITH STATUS 0 (ON HOLD) - UTC timestamp
      const insertSQL = `
        INSERT INTO transactions (
          id, order_number, ref_number, discount, customer_id, customer_name, status,
          subtotal, tax, order_type, total, paid, change_amount, payment_type,
          payment_info, till, user_id, user_name, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `;
      
      const insertParams = [
        transactionId,
        orderNumber,
        refNumber,
        holdOrderData.discount || 0.00,
        holdOrderData.customer_id,
        holdOrderData.customer_name || 'Unknown Customer',
        0, // ✅ STATUS 0 FOR HOLD ORDERS
        holdOrderData.subtotal,
        holdOrderData.tax || 0.00,
        1, // order_type: sale
        holdOrderData.total,
        holdOrderData.paid || 0.00,
        holdOrderData.change_amount || 0.00,
        holdOrderData.payment_type || 'Due',
        holdOrderData.payment_info || '',
        holdOrderData.till || 1,
        holdOrderData.user_id,
        holdOrderData.user_name
      ];
      
      console.log('📝 Executing INSERT for hold order');
      
      await dbRun(insertSQL, insertParams);
      
      console.log('✅ Hold order created with ID:', transactionId);
      
      // Insert transaction items BUT DO NOT UPDATE INVENTORY
      for (const item of holdOrderData.items) {
        console.log('📦 Adding item to hold order:', item.product_name, 'x', item.quantity);
        
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
        
        console.log('⏸️  Inventory NOT updated for hold order');
      }
      
      // DO NOT update customer analytics for hold orders
      console.log('⏸️  Customer analytics NOT updated for hold order');
      
      // DO NOT add to accounting for hold orders
      console.log('⏸️  Accounting entry NOT created for hold order');
      
      await dbRun('COMMIT');
      console.log('✅ Hold order committed successfully');
      
      res.status(201).json({
        success: true,
        id: transactionId,
        transactionId: transactionId,
        order_number: orderNumber,
        ref_number: refNumber,
        status: 0,
        message: 'Order held successfully'
      });
      
    } catch (error: any) {
      await dbRun('ROLLBACK');
      console.error('❌ Hold order creation failed:', error.message);
      throw new Error(`Database operation failed: ${error.message}`);
    }
    
  } catch (err: any) {
    console.error('❌ POST /transactions/hold error:', err.message);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Failed to create hold order: ' + err.message 
    });
  }
});

// === PROCESS HELD ORDER ===
router.put('/:transactionId/process-hold', async (req: Request, res: Response) => {
  try {
    const transactionId = parseInt(req.params.transactionId);
    const paymentData = req.body;
    
    if (isNaN(transactionId)) {
      return res.status(400).json({ error: 'Invalid transaction ID' });
    }
    
    console.log(`🔄 Processing held order ${transactionId} with payment:`, paymentData);
    
    // Get the held order
    const heldOrder = await dbGet('SELECT * FROM transactions WHERE id = ? AND status = 0', [transactionId]) as Transaction;
    if (!heldOrder) {
      return res.status(404).json({ error: 'Held order not found or already processed' });
    }
    
    await dbRun('BEGIN TRANSACTION');
    
    try {
      // ✅ UPDATE TRANSACTION STATUS TO COMPLETED (1) AND ADD PAYMENT INFO - UTC timestamp
      await dbRun(`
        UPDATE transactions 
        SET status = 1,
            paid = ?,
            change_amount = ?,
            payment_type = ?,
            payment_info = ?,
            updated_at = datetime('now')
        WHERE id = ?
      `, [
        paymentData.paid,
        paymentData.change_amount,
        paymentData.payment_type,
        paymentData.payment_info || '',
        transactionId
      ]);
      
      console.log('✅ Updated transaction status to completed');
      
      // ✅ NOW UPDATE INVENTORY FOR THE HELD ITEMS
      const heldItems = await dbAll(
        'SELECT * FROM transaction_items WHERE transaction_id = ?',
        [transactionId]
      );
      
      for (const item of heldItems) {
        await dbRun(`
          UPDATE products 
          SET quantity = quantity - ?, 
              sales_count = COALESCE(sales_count, 0) + ?,
              updated_at = datetime('now')
          WHERE id = ?
        `, [item.quantity, item.quantity, item.product_id]);
        
        console.log('📉 Updated inventory for held item:', item.product_name);
      }
      
      // ✅ UPDATE CUSTOMER ANALYTICS
      if (heldOrder.customer_id && heldOrder.customer_id !== 'walkin_customer' && heldOrder.customer_id !== 0) {
        const customer = await dbGet('SELECT total_spent, total_orders FROM customers WHERE id = ?', [heldOrder.customer_id]);
        
        if (customer) {
          const newTotalSpent = parseFloat(customer.total_spent || '0') + heldOrder.total;
          const newTotalOrders = (customer.total_orders || 0) + 1;
          const newAverage = newTotalSpent / newTotalOrders;
          
          await dbRun(`
            UPDATE customers 
            SET total_spent = ?,
                total_orders = ?,
                last_order_date = datetime('now'),
                average_order_value = ?,
                loyalty_points = COALESCE(loyalty_points, 0) + ?,
                updated_at = datetime('now')
            WHERE id = ?
          `, [newTotalSpent, newTotalOrders, newAverage, Math.floor(heldOrder.total / 1000), heldOrder.customer_id]);
          
          console.log('👤 Updated customer analytics for held order');
          
          // Update customer segment
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
            `, [heldOrder.customer_id]);
          } catch (segmentError: any) {
            console.log('⚠️ Segment update failed (non-critical):', segmentError.message);
          }
        }
      }
      
      // ✅ ADD TO ACCOUNTING - UTC timestamp
      await dbRun(`
        INSERT INTO accounting (
          date, description, amount, category, payment_method, reference, created_at
        ) VALUES (datetime('now'), ?, ?, 'sales', ?, ?, datetime('now'))
      `, [
        `Sale - Order #${heldOrder.order_number} (from hold)`,
        heldOrder.total,
        paymentData.payment_type,
        heldOrder.ref_number
      ]);
      
      console.log('💰 Added held order to accounting');
      
      await dbRun('COMMIT');
      
      res.json({
        success: true,
        message: 'Held order processed successfully',
        transactionId: transactionId,
        order_number: heldOrder.order_number
      });
      
    } catch (error: any) {
      await dbRun('ROLLBACK');
      console.error('❌ Held order processing failed:', error.message);
      throw error;
    }
    
  } catch (err: any) {
    console.error('PUT /transactions/:id/process-hold error:', err.message);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Failed to process held order: ' + err.message 
    });
  }
});

// === CREATE TRANSACTION (with /create endpoint for compatibility) ===
router.post('/create', async (req: Request, res: Response) => {
  try {
    const transactionData: CreateTransactionRequest = req.body;
    
    console.log('📥 Received transaction data at /create:', JSON.stringify(transactionData, null, 2));
    
    // Validate required fields
    if (!transactionData.subtotal || !transactionData.total || !transactionData.paid || 
        !transactionData.user_id || !transactionData.user_name || !transactionData.items?.length) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'Missing required fields: subtotal, total, paid, user_id, user_name, and items are required' 
      });
    }
    
    // ✅ GENERATE TIMESTAMP-BASED ID AND ORDER NUMBER
    const timestampId = Math.floor(Date.now() / 1000);
    const orderNumber = timestampId;
    const transactionId = timestampId;
    const refNumber = transactionData.ref_number || `REF-${timestampId}`;
    
    // Start transaction
    await dbRun('BEGIN TRANSACTION');
    
    try {
      // ✅ EXPLICITLY SET BOTH ID AND ORDER_NUMBER TO SAME TIMESTAMP VALUE - UTC timestamp
      await dbRun(`
        INSERT INTO transactions (
          id, order_number, ref_number, discount, customer_id, customer_name, status,
          subtotal, tax, order_type, total, paid, change_amount, payment_type,
          payment_info, till, user_id, user_name, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `, [
        transactionId,
        orderNumber,
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
              updated_at = datetime('now')
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
                last_order_date = datetime('now'),
                average_order_value = ?,
                loyalty_points = COALESCE(loyalty_points, 0) + ?,
                updated_at = datetime('now')
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
          } catch (segmentError: any) {
            console.log('Segment update failed (non-critical):', segmentError.message);
          }
        }
      }
      
      // Insert into accounting - UTC timestamp
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
        id: transactionId,
        transactionId: transactionId,
        order_number: orderNumber,
        ref_number: refNumber,
        message: 'Transaction completed successfully'
      });
      
    } catch (error: any) {
      await dbRun('ROLLBACK');
      console.error('Transaction creation failed:', error.message);
      throw new Error(`Database operation failed: ${error.message}`);
    }
    
  } catch (err: any) {
    console.error('POST /transactions/create error:', err.message);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Failed to create transaction: ' + err.message 
    });
  }
});

// === GET TRANSACTION ITEMS ===
router.get('/:transactionId/items', async (req: Request, res: Response) => {
  try {
    const transactionId = parseInt(req.params.transactionId);
    if (isNaN(transactionId)) {
      return res.status(400).json({ error: 'Invalid transaction ID' });
    }
    
    const items = await dbAll(
      'SELECT * FROM transaction_items WHERE transaction_id = ? ORDER BY id',
      [transactionId]
    );
    
    res.json(items);
  } catch (err: any) {
    console.error('GET /transactions/:id/items error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// === SALES REPORTS ===
router.get('/reports/sales', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, period = 'daily' } = req.query as SalesReportParams;
    
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
    const params: any[] = [];
    
    // FIXED: UTC date filtering for reports
    if (startDate) {
      whereClause += ' AND created_at >= ?';
      params.push(String(startDate) + ' 00:00:00');
    }
    
    if (endDate) {
      whereClause += ' AND created_at <= ?';
      params.push(String(endDate) + ' 23:59:59');
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
  } catch (err: any) {
    console.error('GET /transactions/reports/sales error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// === TOP SELLING PRODUCTS ===
router.get('/reports/top-products', async (req: Request, res: Response) => {
  try {
    const { limit = 10, startDate, endDate } = req.query;
    
    let whereClause = 'WHERE t.status = 1';
    const params: any[] = [];
    
    // FIXED: UTC date filtering
    if (startDate) {
      whereClause += ' AND t.created_at >= ?';
      params.push(String(startDate) + ' 00:00:00');
    }
    
    if (endDate) {
      whereClause += ' AND t.created_at <= ?';
      params.push(String(endDate) + ' 23:59:59');
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
  } catch (err: any) {
    console.error('GET /transactions/reports/top-products error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// === REFUND/UPDATE TRANSACTION ===
router.put('/:transactionId/refund', async (req: Request, res: Response) => {
  try {
    const transactionId = parseInt(req.params.transactionId);
    const { reason, items, user_id, user_name } = req.body;
    
    if (isNaN(transactionId)) {
      return res.status(400).json({ error: 'Invalid transaction ID' });
    }
    
    if (!user_id || !user_name) {
      return res.status(400).json({ error: 'User information required for refund' });
    }
    
    const transaction = await dbGet('SELECT * FROM transactions WHERE id = ?', [transactionId]) as Transaction;
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
                updated_at = datetime('now')
            WHERE id = ?
          `, [item.quantity, item.product_id]);
        }
      } else {
        const transactionItems = await dbAll(
          'SELECT * FROM transaction_items WHERE transaction_id = ?',
          [transactionId]
        );
        
        for (const item of transactionItems) {
          await dbRun(`
            UPDATE products 
            SET quantity = quantity + ?, 
                updated_at = datetime('now')
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
      
    } catch (error: any) {
      await dbRun('ROLLBACK');
      console.error('Refund operation failed:', error.message);
      throw error;
    }
    
  } catch (err: any) {
    console.error('PUT /transactions/:id/refund error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// === GET DAILY SUMMARY ===
router.get('/reports/daily-summary', async (req: Request, res: Response) => {
  try {
    const { date } = req.query;
    const targetDate = date ? String(date) : new Date().toISOString().split('T')[0];
    
    // FIXED: UTC daily summary
    const utcStart = targetDate + ' 00:00:00';
    const utcEnd = targetDate + ' 23:59:59';
    
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
      WHERE created_at >= ? AND created_at <= ? AND status = 1
    `, [utcStart, utcEnd]);
    
    const paymentMethods = await dbAll(`
      SELECT 
        payment_type,
        COUNT(*) as transaction_count,
        SUM(total) as total_amount
      FROM transactions 
      WHERE created_at >= ? AND created_at <= ? AND status = 1
      GROUP BY payment_type
    `, [utcStart, utcEnd]);
    
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
  } catch (err: any) {
    console.error('GET /transactions/reports/daily-summary error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// === PRODUCT SALES PERFORMANCE ===
router.get('/reports/product-sales', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, limit = 50 } = req.query;
    
    console.log('📊 Product sales report requested (UTC):', { startDate, endDate, limit });
    
    let whereClause = 'WHERE t.status = 1';
    let params: any[] = [];
    
    // FIXED: UTC date filtering
    if (startDate && endDate) {
      whereClause += ' AND t.created_at >= ? AND t.created_at <= ?';
      params.push(String(startDate) + ' 00:00:00', String(endDate) + ' 23:59:59');
      
      console.log('🕒 UTC time range:', { 
        start: String(startDate) + ' 00:00:00', 
        end: String(endDate) + ' 23:59:59' 
      });
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
  } catch (err: any) {
    console.error('❌ Product sales report error:', err.message);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Failed to generate product sales report: ' + err.message 
    });
  }
});

export default router;