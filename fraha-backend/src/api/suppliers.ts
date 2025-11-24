// src/main/api/suppliers.ts
import express, { Request, Response } from 'express';
import { database } from '../database/database';

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

const dbRun = (sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

// === GET RECENTLY RESTOCKED PRODUCTS (Dashboard Default) ===
router.get('/recent-restocks', async (req: Request, res: Response) => {
  try {
    const { limit = '5' } = req.query;
    const recentRestocks = await dbAll(
      `
      SELECT
        rh.product_id,
        rh.product_name,
        rh.supplier_id,
        rh.supplier_name,
        rh.cost_price,
        rh.quantity,
        rh.restock_date,
        p.current_cost_price,
        p.current_supplier_id,
        p.current_supplier_name,
        (rh.cost_price * rh.quantity) as total_cost,
        (p.current_cost_price - rh.cost_price) as price_difference
      FROM restock_history rh
      LEFT JOIN (
        SELECT
          id,
          cost_price as current_cost_price,
          supplier_id as current_supplier_id,
          supplier as current_supplier_name
        FROM products
      ) p ON rh.product_id = p.id
      ORDER BY rh.restock_date DESC
      LIMIT ?
    `,
      [parseInt(limit as string)]
    );
    res.json(recentRestocks);
  } catch (err: any) {
    console.error('GET /suppliers/recent-restocks error:', err.message);
    res.status(500).json({
      error: 'Failed to fetch recent restocks',
      message: err.message
    });
  }
});

// === SEARCH PRODUCTS WITH SUPPLIER HISTORY ===
router.get('/products/search', async (req: Request, res: Response) => {
  try {
    const { q, limit = '10' } = req.query;
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const products = await dbAll(
      `
      SELECT
        p.id,
        p.name,
        p.barcode,
        p.category,
        p.quantity as current_stock,
        p.cost_price as current_cost,
        p.supplier as current_supplier,
        p.supplier_id as current_supplier_id,
        s_current.name as current_supplier_name,
        (
          SELECT COUNT(DISTINCT supplier_id)
          FROM restock_history
          WHERE product_id = p.id
        ) as total_suppliers_used,
        (
          SELECT MIN(cost_price)
          FROM restock_history
          WHERE product_id = p.id
        ) as best_historical_price,
        (
          SELECT MAX(cost_price)
          FROM restock_history
          WHERE product_id = p.id
        ) as worst_historical_price,
        (
          SELECT supplier_name
          FROM restock_history
          WHERE product_id = p.id
          GROUP BY supplier_id
          ORDER BY COUNT(*) DESC
          LIMIT 1
        ) as most_used_supplier
      FROM products p
      LEFT JOIN suppliers s_current ON p.supplier_id = s_current.id
      WHERE p.name LIKE ? OR p.barcode LIKE ?
      ORDER BY p.name
      LIMIT ?
    `,
      [`%${q}%`, `%${q}%`, parseInt(limit as string)]
    );
    res.json(products);
  } catch (err: any) {
    console.error('GET /suppliers/products/search error:', err.message);
    res.status(500).json({
      error: 'Failed to search products',
      message: err.message
    });
  }
});

// === GET PRODUCT SUPPLIER COMPARISON ===
router.get('/products/:productId/suppliers', async (req: Request, res: Response) => {
  try {
    const productId = parseInt(req.params.productId);
    if (isNaN(productId)) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    const product = await dbGet(
      `
      SELECT
        p.*,
        s.name as current_supplier_name
      FROM products p
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.id = ?
    `,
      [productId]
    );

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const supplierHistory = await dbAll(
      `
      SELECT
        rh.supplier_id,
        rh.supplier_name,
        rh.cost_price,
        rh.quantity,
        rh.restock_date,
        rh.batch_number,
        (rh.cost_price * rh.quantity) as total_cost,
        COUNT(*) as total_restocks,
        AVG(rh.cost_price) as average_cost_price,
        SUM(rh.quantity) as total_quantity_supplied,
        MIN(rh.cost_price) as best_price,
        MAX(rh.cost_price) as worst_price,
        MAX(rh.restock_date) as last_supply_date
      FROM restock_history rh
      WHERE rh.product_id = ?
      GROUP BY rh.supplier_id
      ORDER BY total_restocks DESC, average_cost_price ASC
    `,
      [productId]
    );

    const currentSupplierStats = supplierHistory.find(
      (s: any) => s.supplier_id === product.supplier_id
    );

    res.json({
      product: {
        id: product.id,
        name: product.name,
        barcode: product.barcode,
        category: product.category,
        current_stock: product.quantity,
        current_cost_price: product.cost_price,
        current_supplier: product.current_supplier_name,
        current_supplier_id: product.supplier_id
      },
      supplier_comparison: supplierHistory,
      current_supplier_performance: currentSupplierStats,
      summary: {
        total_suppliers: supplierHistory.length,
        price_range: supplierHistory.length > 0
          ? Math.max(...supplierHistory.map((s: any) => s.worst_price)) -
            Math.min(...supplierHistory.map((s: any) => s.best_price))
          : 0,
        best_supplier: supplierHistory.length > 0
          ? supplierHistory.reduce((best: any, current: any) =>
              current.average_cost_price < best.average_cost_price ? current : best
            )
          : null,
        most_reliable_supplier: supplierHistory.length > 0
          ? supplierHistory.reduce((best: any, current: any) =>
              current.total_restocks > best.total_restocks ? current : best
            )
          : null
      }
    });
  } catch (err: any) {
    console.error('GET /suppliers/products/:productId/suppliers error:', err.message);
    res.status(500).json({
      error: 'Failed to fetch product supplier comparison',
      message: err.message
    });
  }
});

// === SEARCH SUPPLIERS AND THEIR PRODUCTS ===
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q, limit = '10' } = req.query;
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const suppliers = await dbAll(
      `
      SELECT
        s.id,
        s.name,
        s.created_at,
        COUNT(DISTINCT p.id) as total_products,
        COUNT(DISTINCT rh.product_id) as unique_products_restocked,
        SUM(CASE WHEN p.quantity > 0 THEN p.quantity * p.cost_price ELSE 0 END) as current_inventory_value,
        AVG(p.cost_price) as average_product_cost,
        MAX(rh.restock_date) as last_restock_date,
        COUNT(rh.id) as total_restocks,
        AVG(p.cost_price) as avg_current_cost,
        (
          SELECT AVG(rh2.cost_price)
          FROM restock_history rh2
          WHERE rh2.supplier_id = s.id
        ) as avg_historical_cost
      FROM suppliers s
      LEFT JOIN products p ON s.id = p.supplier_id
      LEFT JOIN restock_history rh ON s.id = rh.supplier_id
      WHERE s.name LIKE ?
      GROUP BY s.id
      ORDER BY total_products DESC, last_restock_date DESC
      LIMIT ?
    `,
      [`%${q}%`, parseInt(limit as string)]
    );

    res.json(suppliers);
  } catch (err: any) {
    console.error('GET /suppliers/search error:', err.message);
    res.status(500).json({
      error: 'Failed to search suppliers',
      message: err.message
    });
  }
});

// === GET SUPPLIER PRODUCT PORTFOLIO (FIXED) ===
router.get('/:supplierId/products', async (req: Request, res: Response) => {
  try {
    const supplierId = parseInt(req.params.supplierId);
    if (isNaN(supplierId)) {
      return res.status(400).json({ error: 'Invalid supplier ID' });
    }

    const supplier = await dbGet('SELECT * FROM suppliers WHERE id = ?', [supplierId]);
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    const products = await dbAll(
      `
      SELECT
        p.id,
        p.name,
        p.barcode,
        p.category,
        p.quantity,
        p.cost_price as current_cost,
        p.price as selling_price,
        (p.price - p.cost_price) as profit_margin,
        p.last_restocked,
        p.supplier_id as current_supplier_id,
        p.supplier as current_supplier_name,
        (
          SELECT COUNT(*)
          FROM restock_history
          WHERE product_id = p.id AND supplier_id = ?
        ) as times_supplied,
        (
          SELECT AVG(cost_price)
          FROM restock_history
          WHERE product_id = p.id AND supplier_id = ?
        ) as average_historical_cost,
        (
          SELECT MIN(cost_price)
          FROM restock_history
          WHERE product_id = p.id AND supplier_id = ?
        ) as best_price_from_supplier,
        (
          SELECT MAX(cost_price)
          FROM restock_history
          WHERE product_id = p.id AND supplier_id = ?
        ) as worst_price_from_supplier,
        CASE
          WHEN p.supplier_id = ? THEN 'current'
          ELSE 'historical'
        END as supplier_relationship
      FROM products p
      WHERE p.supplier_id = ?
         OR p.id IN (
           SELECT DISTINCT product_id
           FROM restock_history
           WHERE supplier_id = ?
         )
      ORDER BY
        CASE WHEN p.supplier_id = ? THEN 0 ELSE 1 END,
        p.name
    `,
      [
        supplierId, supplierId, supplierId, supplierId,
        supplierId,
        supplierId,
        supplierId,
        supplierId
      ]
    );

    const performance = await dbGet(
      `
      SELECT
        COUNT(DISTINCT product_id) as unique_products_supplied,
        SUM(quantity) as total_units_supplied,
        AVG(cost_price) as average_cost_across_products,
        MIN(cost_price) as lowest_cost_provided,
        MAX(cost_price) as highest_cost_provided,
        COUNT(*) as total_restock_events,
        MAX(restock_date) as last_restock_date
      FROM restock_history
      WHERE supplier_id = ?
    `,
      [supplierId]
    );

    res.json({
      supplier,
      products,
      performance: {
        ...performance,
        price_variability: performance.highest_cost_provided - performance.lowest_cost_provided
      }
    });
  } catch (err: any) {
    console.error('GET /suppliers/:supplierId/products error:', err.message);
    res.status(500).json({
      error: 'Failed to fetch supplier products',
      message: err.message
    });
  }
});

// === GET ALL SUPPLIERS (Simplified) ===
router.get('/', async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    let sql = `
      SELECT
        s.*,
        COUNT(DISTINCT p.id) as total_products,
        COUNT(DISTINCT rh.product_id) as unique_products_restocked,
        MAX(rh.restock_date) as last_restock_date
      FROM suppliers s
      LEFT JOIN products p ON s.id = p.supplier_id
      LEFT JOIN restock_history rh ON s.id = rh.supplier_id
    `;
    const params: any[] = [];

    if (search && typeof search === 'string') {
      sql += ` WHERE s.name LIKE ?`;
      params.push(`%${search}%`);
    }

    sql += ` GROUP BY s.id ORDER BY s.name`;
    const suppliers = await dbAll(sql, params);

    res.json(suppliers);
  } catch (err: any) {
    console.error('GET /suppliers error:', err.message);
    res.status(500).json({
      error: 'Failed to fetch suppliers',
      message: err.message
    });
  }
});

// === CREATE NEW SUPPLIER ===
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Supplier name is required' });
    }

    const result = await dbRun(
      'INSERT INTO suppliers (name, created_at) VALUES (?, datetime("now"))',
      [name.trim()]
    );

    res.json({
      success: true,
      supplierId: result.lastID,
      message: 'Supplier created successfully'
    });
  } catch (err: any) {
    console.error('POST /suppliers error:', err.message);
    res.status(500).json({
      error: 'Failed to create supplier',
      message: err.message
    });
  }
});

// === BULK RESTOCK FROM SUPPLIER ===
router.post('/:supplierId/bulk-restock', async (req: Request, res: Response) => {
  try {
    const supplierId = parseInt(req.params.supplierId);
    const { restockItems } = req.body;

    if (isNaN(supplierId)) {
      return res.status(400).json({ error: 'Invalid supplier ID' });
    }
    if (!Array.isArray(restockItems) || restockItems.length === 0) {
      return res.status(400).json({ error: 'Restock items are required' });
    }

    const supplier = await dbGet('SELECT * FROM suppliers WHERE id = ?', [supplierId]);
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    const results = [];
    for (const item of restockItems) {
      const { productId, quantity, costPrice, batchNumber } = item;

      const product = await dbGet('SELECT * FROM products WHERE id = ?', [productId]);
      if (!product) {
        results.push({ productId, success: false, error: 'Product not found' });
        continue;
      }

      try {
        await dbRun(
          'UPDATE products SET quantity = quantity + ?, cost_price = ?, last_restocked = datetime("now") WHERE id = ?',
          [quantity, costPrice, productId]
        );

        await dbRun(
          `INSERT INTO restock_history
           (product_id, product_name, supplier_id, supplier_name, cost_price, quantity, restock_date, batch_number, previous_quantity, new_quantity)
           VALUES (?, ?, ?, ?, ?, ?, datetime("now"), ?, ?, ?)`,
          [
            productId,
            product.name,
            supplierId,
            supplier.name,
            costPrice,
            quantity,
            batchNumber || `BATCH-${Date.now()}`,
            product.quantity,
            product.quantity + quantity
          ]
        );

        results.push({ productId, success: true });
      } catch (error: any) {
        results.push({ productId, success: false, error: error.message });
      }
    }

    res.json({
      success: true,
      results,
      message: `Processed ${results.filter(r => r.success).length} of ${results.length} restocks`
    });
  } catch (err: any) {
    console.error('POST /suppliers/:supplierId/bulk-restock error:', err.message);
    res.status(500).json({
      error: 'Failed to process bulk restock',
      message: err.message
    });
  }
});

export default router;