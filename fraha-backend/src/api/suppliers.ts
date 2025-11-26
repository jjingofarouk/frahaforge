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

// === NEW FEATURE: SUPPLIER DASHBOARD ===
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const topSuppliers = await dbAll(`
      SELECT 
        s.id,
        s.name,
        COUNT(DISTINCT rh.product_id) as unique_products_supplied,
        COUNT(rh.id) as total_restocks,
        SUM(rh.quantity) as total_units_supplied,
        SUM(rh.cost_price * rh.quantity) as total_value_supplied,
        AVG(rh.cost_price) as average_cost_price,
        MAX(rh.restock_date) as last_restock_date,
        COUNT(DISTINCT p.id) as current_products,
        SUM(p.quantity * p.cost_price) as current_inventory_value
      FROM suppliers s
      LEFT JOIN restock_history rh ON s.id = rh.supplier_id
      LEFT JOIN products p ON s.id = p.supplier_id
      GROUP BY s.id
      HAVING total_restocks > 0
      ORDER BY total_value_supplied DESC
      LIMIT 10
    `);

    const supplierActivity = await dbAll(`
      SELECT 
        strftime('%Y-%m', rh.restock_date) as month,
        COUNT(DISTINCT rh.supplier_id) as active_suppliers,
        COUNT(rh.id) as total_restocks,
        SUM(rh.quantity) as total_units,
        SUM(rh.cost_price * rh.quantity) as total_value
      FROM restock_history rh
      WHERE rh.restock_date >= date('now', '-6 months')
      GROUP BY strftime('%Y-%m', rh.restock_date)
      ORDER BY month DESC
    `);

    const recentRestocks = await dbAll(`
      SELECT 
        rh.supplier_name,
        rh.product_name,
        rh.quantity,
        rh.cost_price,
        rh.restock_date,
        (rh.cost_price * rh.quantity) as total_cost
      FROM restock_history rh
      ORDER BY rh.restock_date DESC
      LIMIT 10
    `);

    res.json({
      top_suppliers: topSuppliers,
      supplier_activity: supplierActivity,
      recent_restocks: recentRestocks
    });
  } catch (err: any) {
    console.error('GET /suppliers/dashboard error:', err.message);
    res.status(500).json({
      error: 'Failed to fetch supplier dashboard',
      message: err.message
    });
  }
});

// === NEW FEATURE: SUPPLIER CONTACT INTEGRATION ===
router.get('/:supplierId/contact-info', async (req: Request, res: Response) => {
  try {
    const supplierId = parseInt(req.params.supplierId);
    
    if (isNaN(supplierId)) {
      return res.status(400).json({ error: 'Invalid supplier ID' });
    }

    const supplier = await dbGet('SELECT * FROM suppliers WHERE id = ?', [supplierId]);
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    // Extract phone numbers from supplier name (common pattern in Ugandan business)
    const phoneRegex = /(\+?256|0)(7[0-9]|20)[0-9]{7}/g;
    const phoneMatches = supplier.name.match(phoneRegex);
    
    const contactInfo = {
      supplier_id: supplier.id,
      supplier_name: supplier.name,
      extracted_phones: phoneMatches || [],
      suggested_actions: {
        call: phoneMatches && phoneMatches.length > 0 ? `tel:${phoneMatches[0]}` : null,
        whatsapp: phoneMatches && phoneMatches.length > 0 ? `https://wa.me/${phoneMatches[0].replace('+', '').replace('0', '256')}` : null,
        email: null // Could be enhanced if email patterns are found in names
      },
      recent_products: await dbAll(`
        SELECT DISTINCT 
          rh.product_name,
          rh.restock_date,
          rh.cost_price as last_cost
        FROM restock_history rh
        WHERE rh.supplier_id = ?
        ORDER BY rh.restock_date DESC
        LIMIT 5
      `, [supplierId])
    };

    res.json(contactInfo);
  } catch (err: any) {
    console.error('GET /suppliers/:supplierId/contact-info error:', err.message);
    res.status(500).json({
      error: 'Failed to fetch supplier contact info',
      message: err.message
    });
  }
});

// === NEW FEATURE: SUPPLIER PRICE TREND ANALYSIS ===
router.get('/:supplierId/price-trends', async (req: Request, res: Response) => {
  try {
    const supplierId = parseInt(req.params.supplierId);
    
    if (isNaN(supplierId)) {
      return res.status(400).json({ error: 'Invalid supplier ID' });
    }

    const priceTrends = await dbAll(`
      SELECT 
        rh.product_id,
        rh.product_name,
        rh.cost_price,
        rh.restock_date,
        LAG(rh.cost_price) OVER (PARTITION BY rh.product_id ORDER BY rh.restock_date) as previous_cost,
        CASE 
          WHEN LAG(rh.cost_price) OVER (PARTITION BY rh.product_id ORDER BY rh.restock_date) IS NOT NULL 
          THEN ((rh.cost_price - LAG(rh.cost_price) OVER (PARTITION BY rh.product_id ORDER BY rh.restock_date)) / LAG(rh.cost_price) OVER (PARTITION BY rh.product_id ORDER BY rh.restock_date)) * 100
          ELSE NULL
        END as price_change_percent,
        p.current_price,
        (p.current_price - rh.cost_price) as current_profit_margin
      FROM restock_history rh
      LEFT JOIN (
        SELECT 
          id,
          price as current_price,
          cost_price as current_cost
        FROM products
      ) p ON rh.product_id = p.id
      WHERE rh.supplier_id = ?
        AND rh.restock_date >= date('now', '-6 months')
      ORDER BY rh.product_name, rh.restock_date DESC
    `, [supplierId]);

    // Group by product for analysis
    const productTrends = priceTrends.reduce((acc: any, row: any) => {
      if (!acc[row.product_id]) {
        acc[row.product_id] = {
          product_id: row.product_id,
          product_name: row.product_name,
          price_history: [],
          current_price: row.current_price,
          current_profit_margin: row.current_profit_margin,
          average_price: 0,
          price_volatility: 0
        };
      }
      acc[row.product_id].price_history.push({
        date: row.restock_date,
        cost_price: parseFloat(row.cost_price),
        price_change_percent: row.price_change_percent
      });
      return acc;
    }, {});

    // Calculate statistics for each product
    Object.values(productTrends).forEach((product: any) => {
      const prices = product.price_history.map((h: any) => h.cost_price);
      product.average_price = prices.reduce((a: number, b: number) => a + b, 0) / prices.length;
      product.price_volatility = Math.max(...prices) - Math.min(...prices);
      product.trend = prices[0] > prices[prices.length - 1] ? 'increasing' : prices[0] < prices[prices.length - 1] ? 'decreasing' : 'stable';
    });

    res.json(Object.values(productTrends));
  } catch (err: any) {
    console.error('GET /suppliers/:supplierId/price-trends error:', err.message);
    res.status(500).json({
      error: 'Failed to fetch supplier price trends',
      message: err.message
    });
  }
});

// === NEW FEATURE: SUPPLIER RELIABILITY SCORE ===
router.get('/:supplierId/reliability', async (req: Request, res: Response) => {
  try {
    const supplierId = parseInt(req.params.supplierId);
    
    if (isNaN(supplierId)) {
      return res.status(400).json({ error: 'Invalid supplier ID' });
    }

    const reliabilityData = await dbAll(`
      WITH supplier_stats AS (
        SELECT 
          s.id,
          s.name,
          COUNT(DISTINCT rh.product_id) as unique_products_supplied,
          COUNT(rh.id) as total_restocks,
          SUM(rh.quantity) as total_units_supplied,
          AVG(rh.cost_price) as average_cost_price,
          MIN(rh.cost_price) as min_cost_price,
          MAX(rh.cost_price) as max_cost_price,
          COUNT(DISTINCT strftime('%Y-%m', rh.restock_date)) as active_months,
          JULIANDAY('now') - JULIANDAY(MAX(rh.restock_date)) as days_since_last_order,
          COUNT(DISTINCT p.id) as current_products
        FROM suppliers s
        LEFT JOIN restock_history rh ON s.id = rh.supplier_id
        LEFT JOIN products p ON s.id = p.supplier_id
        WHERE s.id = ?
        GROUP BY s.id
      ),
      price_consistency AS (
        SELECT 
          supplier_id,
          STDDEV(rh.cost_price) as price_stddev,
          AVG(rh.cost_price) as price_avg
        FROM restock_history rh
        WHERE rh.supplier_id = ?
        GROUP BY rh.supplier_id
      )
      SELECT 
        ss.*,
        pc.price_stddev,
        pc.price_avg,
        CASE 
          WHEN pc.price_stddev IS NULL THEN 0
          ELSE (pc.price_avg / NULLIF(pc.price_stddev, 0))
        END as price_consistency_score,
        CASE 
          WHEN ss.days_since_last_order <= 30 THEN 100
          WHEN ss.days_since_last_order <= 90 THEN 60
          WHEN ss.days_since_last_order <= 180 THEN 30
          ELSE 10
        END as recency_score,
        CASE 
          WHEN ss.total_restocks >= 50 THEN 100
          WHEN ss.total_restocks >= 20 THEN 80
          WHEN ss.total_restocks >= 10 THEN 60
          WHEN ss.total_restocks >= 5 THEN 40
          ELSE 20
        END as volume_score,
        CASE 
          WHEN ss.unique_products_supplied >= 10 THEN 100
          WHEN ss.unique_products_supplied >= 5 THEN 70
          WHEN ss.unique_products_supplied >= 2 THEN 40
          ELSE 10
        END as variety_score
      FROM supplier_stats ss
      LEFT JOIN price_consistency pc ON ss.id = pc.supplier_id
    `, [supplierId, supplierId]);

    if (reliabilityData.length === 0) {
      return res.status(404).json({ error: 'Supplier not found or no data available' });
    }

    const data = reliabilityData[0];
    const reliabilityScore = Math.round(
      (data.recency_score * 0.3) +
      (data.volume_score * 0.4) +
      (data.variety_score * 0.2) +
      (Math.min(data.price_consistency_score * 10, 100) * 0.1)
    );

    res.json({
      supplier_id: data.id,
      supplier_name: data.name,
      reliability_score: reliabilityScore,
      score_breakdown: {
        recency: data.recency_score,
        volume: data.volume_score,
        variety: data.variety_score,
        price_consistency: Math.min(data.price_consistency_score * 10, 100)
      },
      key_metrics: {
        total_restocks: data.total_restocks,
        unique_products: data.unique_products_supplied,
        total_units: data.total_units_supplied,
        days_since_last_order: data.days_since_last_order,
        current_products: data.current_products
      },
      recommendation: reliabilityScore >= 80 ? 'Highly Recommended' : 
                     reliabilityScore >= 60 ? 'Recommended' :
                     reliabilityScore >= 40 ? 'Moderate' : 'Consider Alternatives'
    });
  } catch (err: any) {
    console.error('GET /suppliers/:supplierId/reliability error:', err.message);
    res.status(500).json({
      error: 'Failed to calculate supplier reliability',
      message: err.message
    });
  }
});

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