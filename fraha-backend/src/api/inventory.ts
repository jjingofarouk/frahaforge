import express, { Request, Response } from 'express';
import { database } from '../database/database';
import multer from 'multer';
import fs from 'fs';
import sanitizeFilename from 'sanitize-filename';
import validator from 'validator';
import dotenv from 'dotenv';
dotenv.config();

interface ExtendedRouter extends express.Router {
  decrementInventory?: (products: TransactionProduct[]) => Promise<void>;
}

const router = express.Router() as ExtendedRouter;

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
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ changes: this.changes, lastID: this.lastID });
    });
  });
};

// Interfaces
interface Product {
  id: number;
  barcode: number | null;
  expiration_date: string | null;
  price: string | null;
  category: string;
  category_id: number;
  quantity: number;
  name: string;
  stock: number;
  min_stock: string | null;
  img: string | null;
  description?: string;
  cost_price?: string;
  supplier?: string;
  last_restocked?: string;
  reorder_level?: number;
  profit_margin?: string;
  batch_number?: string;
  manufacturer?: string;
  drug_class?: string;
  prescription_required?: boolean;
  side_effects?: string;
  storage_conditions?: string;
  active_ingredients?: string;
  dosage_form?: string;
  strength?: string;
  package_size?: string;
  is_controlled_substance?: boolean;
  requires_refrigeration?: boolean;
  wholesale_price?: string;
  last_price_update?: string;
  sales_count?: number;
  profit_amount?: string;
  supplier_id?: number;
  primary_supplier_id?: number;
}

interface TransactionProduct {
  id: string;
  quantity: string;
}

interface Supplier {
  id: number;
  name: string;
  created_at: string;
}

interface RestockHistory {
  id: number;
  product_id: number;
  product_name: string;
  supplier_id: number;
  supplier_name: string;
  cost_price: string;
  quantity: number;
  restock_date: string;
  batch_number?: string;
  previous_quantity: number;
  new_quantity: number;
}

interface LowStockAlert {
  product_id: number;
  product_name: string;
  current_quantity: number;
  min_stock: number;
  reorder_level: number;
  last_sold_date: string | null;
  days_since_last_sale: number | null;
  category: string;
  supplier_name: string;
  supplier_id: number;
  urgency: 'critical' | 'high' | 'medium';
}

interface ExpiringProduct {
  product_id: number;
  product_name: string;
  expiration_date: string;
  days_until_expiry: number;
  current_quantity: number;
  category: string;
  cost_price: string;
  price: string;
  urgency: 'critical' | 'high' | 'medium';
}

interface StockMovement {
  product_id: number;
  product_name: string;
  category: string;
  sales_count: number;
  total_quantity_sold: number;
  total_revenue: number;
  total_cost: number;
  total_profit: number;
  profit_margin_percent: number;
  last_sold_date: string | null;
  movement_type: 'fast' | 'medium' | 'slow' | 'dead';
}

router.get('/', (req: Request, res: Response) => {
  res.send('Inventory API');
});

// === NEW FEATURE: LOW STOCK ALERTS ===
router.get('/alerts/low-stock', async (req: Request, res: Response) => {
  try {
    const { threshold_days = '30' } = req.query;
    
    const lowStockProducts = await dbAll(`
      SELECT 
        p.id as product_id,
        p.name as product_name,
        p.quantity as current_quantity,
        COALESCE(p.min_stock, 0) as min_stock,
        COALESCE(p.reorder_level, 0) as reorder_level,
        p.category,
        p.supplier as supplier_name,
        p.supplier_id,
        MAX(t.created_at) as last_sold_date,
        CASE 
          WHEN MAX(t.created_at) IS NULL THEN 999
          ELSE JULIANDAY('now') - JULIANDAY(MAX(t.created_at))
        END as days_since_last_sale,
        CASE 
          WHEN p.quantity <= COALESCE(p.min_stock, 0) THEN 'critical'
          WHEN p.quantity <= COALESCE(p.reorder_level, COALESCE(p.min_stock, 0) * 2) THEN 'high'
          ELSE 'medium'
        END as urgency
      FROM products p
      LEFT JOIN transaction_items ti ON p.id = ti.product_id
      LEFT JOIN transactions t ON ti.transaction_id = t.id
      WHERE p.quantity <= COALESCE(p.reorder_level, COALESCE(p.min_stock, 0) * 2)
        AND (p.quantity > 0 OR MAX(t.created_at) >= date('now', ? || ' days'))
      GROUP BY p.id
      HAVING last_sold_date IS NULL OR days_since_last_sale <= ?
      ORDER BY 
        urgency DESC,
        p.quantity / NULLIF(COALESCE(p.min_stock, 1), 0) ASC,
        days_since_last_sale ASC
    `, [`-${threshold_days}`, threshold_days]);

    res.json(lowStockProducts);
  } catch (err: any) {
    console.error('Low stock alerts error:', err.message);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

// === NEW FEATURE: EXPIRY ALERTS ===
router.get('/alerts/expiring', async (req: Request, res: Response) => {
  try {
    const { days = '90' } = req.query;
    const daysNum = parseInt(days as string);
    
    const expiringProducts = await dbAll(`
      SELECT 
        p.id as product_id,
        p.name as product_name,
        p.expiration_date,
        p.quantity as current_quantity,
        p.category,
        p.cost_price,
        p.price,
        JULIANDAY(p.expiration_date) - JULIANDAY('now') as days_until_expiry,
        CASE 
          WHEN JULIANDAY(p.expiration_date) - JULIANDAY('now') <= 30 THEN 'critical'
          WHEN JULIANDAY(p.expiration_date) - JULIANDAY('now') <= 60 THEN 'high'
          ELSE 'medium'
        END as urgency
      FROM products p
      WHERE p.expiration_date IS NOT NULL 
        AND p.expiration_date != ''
        AND JULIANDAY(p.expiration_date) - JULIANDAY('now') BETWEEN 0 AND ?
        AND p.quantity > 0
      ORDER BY days_until_expiry ASC, p.quantity DESC
    `, [daysNum]);

    res.json(expiringProducts);
  } catch (err: any) {
    console.error('Expiry alerts error:', err.message);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

// === NEW FEATURE: STOCK MOVEMENT ANALYSIS ===
router.get('/analytics/movement', async (req: Request, res: Response) => {
  try {
    const { period_days = '30' } = req.query;
    
    const stockMovement = await dbAll(`
      SELECT 
        p.id as product_id,
        p.name as product_name,
        p.category,
        p.quantity as current_stock,
        COALESCE(SUM(ti.quantity), 0) as total_quantity_sold,
        COUNT(DISTINCT t.id) as sales_count,
        COALESCE(SUM(ti.price * ti.quantity), 0) as total_revenue,
        COALESCE(SUM(p.cost_price * ti.quantity), 0) as total_cost,
        COALESCE(SUM((ti.price - p.cost_price) * ti.quantity), 0) as total_profit,
        CASE 
          WHEN COALESCE(SUM(ti.price * ti.quantity), 0) > 0 
          THEN (COALESCE(SUM((ti.price - p.cost_price) * ti.quantity), 0) / COALESCE(SUM(ti.price * ti.quantity), 0)) * 100
          ELSE 0
        END as profit_margin_percent,
        MAX(t.created_at) as last_sold_date,
        CASE 
          WHEN COALESCE(SUM(ti.quantity), 0) >= 20 THEN 'fast'
          WHEN COALESCE(SUM(ti.quantity), 0) >= 10 THEN 'medium'
          WHEN COALESCE(SUM(ti.quantity), 0) >= 1 THEN 'slow'
          ELSE 'dead'
        END as movement_type
      FROM products p
      LEFT JOIN transaction_items ti ON p.id = ti.product_id
      LEFT JOIN transactions t ON ti.transaction_id = t.id AND t.created_at >= date('now', ? || ' days')
      GROUP BY p.id
      ORDER BY total_quantity_sold DESC, total_profit DESC
    `, [`-${period_days}`]);

    res.json(stockMovement);
  } catch (err: any) {
    console.error('Stock movement analysis error:', err.message);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

// === NEW FEATURE: PROFITABLE CATEGORIES ===
router.get('/analytics/profitable-categories', async (req: Request, res: Response) => {
  try {
    const { period_days = '30' } = req.query;
    
    const profitableCategories = await dbAll(`
      SELECT 
        p.category,
        COUNT(DISTINCT p.id) as product_count,
        COALESCE(SUM(ti.quantity), 0) as total_quantity_sold,
        COALESCE(SUM(ti.price * ti.quantity), 0) as total_revenue,
        COALESCE(SUM(p.cost_price * ti.quantity), 0) as total_cost,
        COALESCE(SUM((ti.price - p.cost_price) * ti.quantity), 0) as total_profit,
        CASE 
          WHEN COALESCE(SUM(ti.price * ti.quantity), 0) > 0 
          THEN (COALESCE(SUM((ti.price - p.cost_price) * ti.quantity), 0) / COALESCE(SUM(ti.price * ti.quantity), 0)) * 100
          ELSE 0
        END as profit_margin_percent,
        COUNT(DISTINCT t.id) as transaction_count
      FROM products p
      LEFT JOIN transaction_items ti ON p.id = ti.product_id
      LEFT JOIN transactions t ON ti.transaction_id = t.id AND t.created_at >= date('now', ? || ' days')
      WHERE p.category IS NOT NULL AND p.category != ''
      GROUP BY p.category
      HAVING total_quantity_sold > 0
      ORDER BY total_profit DESC, profit_margin_percent DESC
    `, [`-${period_days}`]);

    res.json(profitableCategories);
  } catch (err: any) {
    console.error('Profitable categories error:', err.message);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

// === NEW FEATURE: RESTOCK SUGGESTIONS ===
router.get('/restock-suggestions', async (req: Request, res: Response) => {
  try {
    const { include_dead_stock = 'false' } = req.query;
    
    const restockSuggestions = await dbAll(`
      WITH product_sales AS (
        SELECT 
          p.id as product_id,
          p.name as product_name,
          p.quantity as current_quantity,
          COALESCE(p.min_stock, 0) as min_stock,
          COALESCE(p.reorder_level, 0) as reorder_level,
          p.category,
          p.supplier_id,
          p.supplier as current_supplier_name,
          COALESCE(SUM(ti.quantity), 0) as sold_last_30_days,
          MAX(t.created_at) as last_sold_date,
          JULIANDAY('now') - JULIANDAY(MAX(t.created_at)) as days_since_last_sale,
          rh.supplier_name as last_supplier_name,
          rh.supplier_id as last_supplier_id,
          rh.cost_price as last_cost_price,
          rh.restock_date as last_restock_date
        FROM products p
        LEFT JOIN transaction_items ti ON p.id = ti.product_id
        LEFT JOIN transactions t ON ti.transaction_id = t.id AND t.created_at >= date('now', '-30 days')
        LEFT JOIN (
          SELECT 
            product_id,
            supplier_name,
            supplier_id,
            cost_price,
            restock_date,
            ROW_NUMBER() OVER (PARTITION BY product_id ORDER BY restock_date DESC) as rn
          FROM restock_history
        ) rh ON p.id = rh.product_id AND rh.rn = 1
        GROUP BY p.id
      )
      SELECT 
        ps.*,
        CASE 
          WHEN ps.current_quantity <= ps.min_stock THEN ps.min_stock * 3 - ps.current_quantity
          WHEN ps.current_quantity <= ps.reorder_level THEN ps.reorder_level * 2 - ps.current_quantity
          ELSE 0
        END as suggested_quantity,
        CASE 
          WHEN ps.current_quantity <= ps.min_stock THEN 'critical'
          WHEN ps.current_quantity <= ps.reorder_level THEN 'high'
          WHEN ps.sold_last_30_days > 0 THEN 'medium'
          ELSE 'low'
        END as priority,
        CASE 
          WHEN ps.last_supplier_name IS NOT NULL THEN ps.last_supplier_name
          ELSE ps.current_supplier_name
        END as suggested_supplier,
        CASE 
          WHEN ps.last_supplier_id IS NOT NULL THEN ps.last_supplier_id
          ELSE ps.supplier_id
        END as suggested_supplier_id,
        ps.last_cost_price as suggested_cost_price
      FROM product_sales ps
      WHERE (ps.current_quantity <= ps.reorder_level OR (ps.sold_last_30_days > 0 AND ps.current_quantity <= ps.min_stock * 2))
        AND (? = 'true' OR ps.days_since_last_sale <= 90 OR ps.sold_last_30_days > 0)
      ORDER BY 
        priority DESC,
        ps.sold_last_30_days DESC,
        ps.current_quantity / NULLIF(ps.min_stock, 1) ASC
    `, [include_dead_stock]);

    res.json(restockSuggestions);
  } catch (err: any) {
    console.error('Restock suggestions error:', err.message);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

// === NEW FEATURE: SUPPLIER PERFORMANCE ===
router.get('/analytics/supplier-performance', async (req: Request, res: Response) => {
  try {
    const supplierPerformance = await dbAll(`
      SELECT 
        s.id as supplier_id,
        s.name as supplier_name,
        COUNT(DISTINCT rh.product_id) as unique_products_supplied,
        COUNT(rh.id) as total_restocks,
        SUM(rh.quantity) as total_units_supplied,
        AVG(rh.cost_price) as average_cost_price,
        MIN(rh.cost_price) as min_cost_price,
        MAX(rh.cost_price) as max_cost_price,
        MAX(rh.restock_date) as last_restock_date,
        COUNT(DISTINCT p.id) as current_products,
        SUM(p.quantity * p.cost_price) as current_inventory_value,
        AVG(p.cost_price) as current_avg_cost
      FROM suppliers s
      LEFT JOIN restock_history rh ON s.id = rh.supplier_id
      LEFT JOIN products p ON s.id = p.supplier_id
      GROUP BY s.id
      HAVING total_restocks > 0 OR current_products > 0
      ORDER BY total_units_supplied DESC, current_inventory_value DESC
    `);

    res.json(supplierPerformance);
  } catch (err: any) {
    console.error('Supplier performance error:', err.message);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

// === NEW FEATURE: PRODUCT SEARCH WITH SUPPLIER HISTORY ===
router.get('/products/search-enhanced', async (req: Request, res: Response) => {
  try {
    const { query, include_suppliers = 'true' } = req.query;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Search query required' });
    }

    const searchQuery = `%${query.toLowerCase().trim()}%`;
    
    let productsQuery = `
      SELECT
        p.*,
        p.cost_price AS costPrice,
        p.category AS category,
        COUNT(DISTINCT t.id) as transaction_count,
        SUM(ti.quantity) as total_sold,
        MAX(t.created_at) as last_sold_date
      FROM products p
      LEFT JOIN transaction_items ti ON p.id = ti.product_id
      LEFT JOIN transactions t ON ti.transaction_id = t.id
      WHERE p.name LIKE ? OR p.barcode LIKE ? OR p.category LIKE ?
      GROUP BY p.id
      ORDER BY p.name
    `;

    const products = await dbAll(productsQuery, [searchQuery, searchQuery, searchQuery]);

    // If include_suppliers is true, get supplier history for each product
    if (include_suppliers === 'true') {
      const productsWithSuppliers = await Promise.all(
        products.map(async (product: any) => {
          const supplierHistory = await dbAll(`
            SELECT 
              supplier_name,
              supplier_id,
              cost_price,
              quantity,
              restock_date,
              batch_number
            FROM restock_history 
            WHERE product_id = ? 
            ORDER BY restock_date DESC 
            LIMIT 5
          `, [product.id]);

          return {
            ...product,
            supplier_history: supplierHistory,
            recent_suppliers: supplierHistory.map((sh: any) => sh.supplier_name).filter((v: string, i: number, a: string[]) => a.indexOf(v) === i)
          };
        })
      );

      return res.json(productsWithSuppliers);
    }

    res.json(products);
  } catch (err: any) {
    console.error('Enhanced search error:', err.message);
    res.status(500).json({ error: 'Search failed', message: err.message });
  }
});

// === NEW FEATURE: PRICE CHANGE HISTORY ===
router.get('/products/:productId/price-history', async (req: Request, res: Response) => {
  try {
    const productId = parseInt(req.params.productId);
    
    if (isNaN(productId)) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    const priceHistory = await dbAll(`
      SELECT 
        rh.restock_date as date,
        rh.cost_price as cost_price,
        rh.supplier_name,
        rh.quantity,
        p.price as selling_price_at_time,
        (p.price - rh.cost_price) as profit_margin_at_time,
        LAG(rh.cost_price) OVER (ORDER BY rh.restock_date) as previous_cost_price,
        CASE 
          WHEN LAG(rh.cost_price) OVER (ORDER BY rh.restock_date) IS NOT NULL 
          THEN ((rh.cost_price - LAG(rh.cost_price) OVER (ORDER BY rh.restock_date)) / LAG(rh.cost_price) OVER (ORDER BY rh.restock_date)) * 100
          ELSE NULL
        END as cost_change_percent
      FROM restock_history rh
      LEFT JOIN products p ON rh.product_id = p.id
      WHERE rh.product_id = ?
      ORDER BY rh.restock_date DESC
    `, [productId]);

    res.json(priceHistory);
  } catch (err: any) {
    console.error('Price history error:', err.message);
    res.status(500).json({ error: 'Failed to fetch price history', message: err.message });
  }
});

// === RESTOCK ===
router.post('/product/restock', async (req: Request, res: Response) => {
  try {
    const { productId, quantity, costPrice, supplierId, batchNumber } = req.body;

    if (!productId || !quantity || !costPrice || !supplierId) {
      return res.status(400).json({ error: 'Bad Request', message: 'Missing required fields' });
    }

    const productIdNum = parseInt(String(productId));
    const quantityNum = parseInt(String(quantity));
    const supplierIdNum = parseInt(String(supplierId));

    if (isNaN(productIdNum) || isNaN(quantityNum) || isNaN(supplierIdNum) || quantityNum <= 0) {
      return res.status(400).json({ error: 'Bad Request', message: 'Invalid parameters' });
    }

    const product = await dbGet('SELECT * FROM products WHERE id = ?', [productIdNum]) as Product;
    if (!product) return res.status(404).json({ error: 'Not Found', message: 'Product not found' });

    const supplier = await dbGet('SELECT * FROM suppliers WHERE id = ?', [supplierIdNum]) as Supplier;
    if (!supplier) return res.status(404).json({ error: 'Not Found', message: 'Supplier not found' });

    const previousQuantity = product.quantity || 0;
    const newQuantity = previousQuantity + quantityNum;

    await dbRun(
      `UPDATE products SET quantity = ?, cost_price = ?, supplier = ?, supplier_id = ?, last_restocked = ? WHERE id = ?`,
      [newQuantity, String(costPrice), supplier.name, supplierIdNum, new Date().toISOString(), productIdNum]
    );

    await dbRun(
      `INSERT INTO restock_history (
        product_id, product_name, supplier_id, supplier_name, cost_price, quantity,
        restock_date, batch_number, previous_quantity, new_quantity
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        productIdNum,
        product.name,
        supplierIdNum,
        supplier.name,
        String(costPrice),
        quantityNum,
        new Date().toISOString(),
        batchNumber || `RESTOCK-${Date.now()}`,
        previousQuantity,
        newQuantity,
      ]
    );

    res.json({
      success: true,
      product: { id: productIdNum, name: product.name, previousQuantity, newQuantity, addedQuantity: quantityNum },
      supplier: { id: supplierIdNum, name: supplier.name },
      costPrice,
    });
  } catch (err: any) {
    console.error('Restock error:', err.message);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

// === SEARCH ===
router.get('/products/search', async (req: Request, res: Response) => {
  try {
    const { query } = req.query;
    if (!query || typeof query !== 'string') return res.status(400).json({ error: 'Search query required' });

    const searchQuery = `%${query.toLowerCase().trim()}%`;
    const docs = await dbAll(
      `SELECT
         p.*,
         p.cost_price AS costPrice,
         p.category AS category
       FROM products p
       WHERE p.name LIKE ? OR p.barcode LIKE ? OR p.category LIKE ?`,
      [searchQuery, searchQuery, searchQuery]
    );
    res.json(docs);
  } catch (err: any) {
    console.error('Search error:', err.message);
    res.status(500).json({ error: 'Search failed' });
  }
});

// === UPDATE (PUT) ===
router.put('/product', async (req: Request, res: Response) => {
  try {
    const productId = req.body.id || req.body.id;
    if (!productId) return res.status(400).json({ error: 'Bad Request', message: 'Product ID required' });

    const existing = await dbGet('SELECT * FROM products WHERE id = ?', [parseInt(String(productId))]) as Product;
    if (!existing) return res.status(404).json({ error: 'Not Found', message: 'Product not found' });

    const updateFields: any = {};
    // COMPLETE FIELD MAPPINGS - handles both camelCase and snake_case
    const fieldMappings: { [key: string]: string } = {
      // Basic product info
      name: 'name',
      barcode: 'barcode',
      price: 'price',
      quantity: 'quantity',
      category: 'category',
      // Dates - handle both formats
      expirationDate: 'expiration_date',
      expiration_date: 'expiration_date', // Direct snake_case mapping
      // Stock and inventory
      minStock: 'min_stock',
      min_stock: 'min_stock', // Direct snake_case mapping
      stock: 'stock',
      reorderLevel: 'reorder_level',
      reorder_level: 'reorder_level', // Direct snake_case mapping
      // Descriptions and media
      description: 'description',
      img: 'img',
      // Pricing - handle both formats
      costPrice: 'cost_price',
      cost_price: 'cost_price', // Direct snake_case mapping
      wholesalePrice: 'wholesale_price',
      wholesale_price: 'wholesale_price', // Direct snake_case mapping
      // Supplier info - handle both formats
      supplier: 'supplier',
      supplierId: 'supplier_id',
      supplier_id: 'supplier_id', // Direct snake_case mapping
      primarySupplierId: 'primary_supplier_id',
      // Product details
      manufacturer: 'manufacturer',
      batchNumber: 'batch_number',
      batch_number: 'batch_number', // Direct snake_case mapping
      drugClass: 'drug_class',
      drug_class: 'drug_class', // Direct snake_case mapping
      dosageForm: 'dosage_form',
      dosage_form: 'dosage_form', // Direct snake_case mapping
      strength: 'strength',
      activeIngredients: 'active_ingredients',
      active_ingredients: 'active_ingredients', // Direct snake_case mapping
      sideEffects: 'side_effects',
      side_effects: 'side_effects', // Direct snake_case mapping
      storageConditions: 'storage_conditions',
      storage_conditions: 'storage_conditions', // Direct snake_case mapping
      // Sales and analytics
      salesCount: 'sales_count',
      sales_count: 'sales_count', // Direct snake_case mapping
      profitAmount: 'profit_amount',
      profit_amount: 'profit_amount', // Direct snake_case mapping
      profitMargin: 'profit_margin',
      profit_margin: 'profit_margin', // Direct snake_case mapping
      // Timestamps
      lastPriceUpdate: 'last_price_update',
      last_price_update: 'last_price_update', // Direct snake_case mapping
      lastRestocked: 'last_restocked',
      last_restocked: 'last_restocked', // Direct snake_case mapping
    };

    // Process ALL field mappings (both camelCase and snake_case)
    Object.keys(fieldMappings).forEach(key => {
      if (req.body[key] !== undefined && req.body[key] !== null) {
        updateFields[fieldMappings[key]] = req.body[key];
      }
    });

    // Handle boolean flags separately (they need conversion to 1/0)
    if (req.body.prescriptionRequired !== undefined) updateFields.prescription_required = req.body.prescriptionRequired ? 1 : 0;
    if (req.body.isControlledSubstance !== undefined) updateFields.is_controlled_substance = req.body.isControlledSubstance ? 1 : 0;
    if (req.body.requiresRefrigeration !== undefined) updateFields.requires_refrigeration = req.body.requiresRefrigeration ? 1 : 0;
    // Also handle snake_case boolean fields if they come directly
    if (req.body.prescription_required !== undefined) updateFields.prescription_required = req.body.prescription_required ? 1 : 0;
    if (req.body.is_controlled_substance !== undefined) updateFields.is_controlled_substance = req.body.is_controlled_substance ? 1 : 0;
    if (req.body.requires_refrigeration !== undefined) updateFields.requires_refrigeration = req.body.requires_refrigeration ? 1 : 0;

    // DEBUG: Log what's being updated
    console.log('🔄 BACKEND - Fields to update:', updateFields);

    // Check if stock quantity increased for restock history
    const previousQuantity = existing.quantity || 0;
    const newQuantity = updateFields.quantity !== undefined ? updateFields.quantity : existing.quantity;
    const quantityIncreased = newQuantity > previousQuantity;

    // Build and execute the SQL update
    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ error: 'Bad Request', message: 'No fields to update' });
    }

    const setClause = Object.keys(updateFields).map(k => `${k} = ?`).join(', ');
    const values = [...Object.values(updateFields), parseInt(String(productId))];

    // Add updated_at timestamp
    const finalSetClause = `${setClause}, updated_at = CURRENT_TIMESTAMP`;
    const result = await dbRun(`UPDATE products SET ${finalSetClause} WHERE id = ?`, values);

    if (result.changes === 0) return res.status(404).json({ error: 'No changes made' });

    // Record restock history if quantity increased
    if (quantityIncreased) {
      const quantityAdded = newQuantity - previousQuantity;
      const supplierId = updateFields.supplier_id || existing.supplier_id || updateFields.primary_supplier_id || existing.primary_supplier_id;
      const supplierName = updateFields.supplier || existing.supplier;
      const costPrice = updateFields.cost_price || existing.cost_price;

      try {
        // Get supplier name if we have supplier ID
        let finalSupplierName = supplierName || 'Stock Adjustment';
        if (supplierId) {
          const supplier = await dbGet('SELECT name FROM suppliers WHERE id = ?', [supplierId]) as Supplier;
          if (supplier) {
            finalSupplierName = supplier.name;
          }
        }

        await dbRun(
          `INSERT INTO restock_history (
            product_id, product_name, supplier_id, supplier_name, cost_price, quantity,
            restock_date, batch_number, previous_quantity, new_quantity
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            parseInt(String(productId)),
            existing.name,
            supplierId || 0,
            finalSupplierName,
            costPrice || '0',
            quantityAdded,
            new Date().toISOString(),
            updateFields.batch_number || `STOCK-ADJUST-${Date.now()}`,
            previousQuantity,
            newQuantity,
          ]
        );
        console.log(`📦 Auto-recorded stock increase: +${quantityAdded} units for product ${existing.name}`);
      } catch (historyError) {
        console.error('Failed to record restock history:', historyError);
        // Don't fail the main update if history recording fails
      }
    }

    res.json({ success: true, message: 'Product updated', productId });
  } catch (err: any) {
    console.error('PUT error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// === CREATE/UPDATE (POST) ===
router.post('/product', async (req: Request, res: Response) => {
  try {
    const productId = req.body.id || req.body.id;
    if (!productId) {
      const newProduct: any = {
        id: Math.floor(Date.now() / 1000),
        name: String(req.body.name || ''),
        barcode: parseInt(String(req.body.barcode || '0')) || null,
        price: String(req.body.price || '0'),
        cost_price: String(req.body.costPrice || ''),
        category: String(req.body.category || ''),
        quantity: parseInt(String(req.body.quantity || '0')) || 0,
        min_stock: String(req.body.minStock || ''),
        stock: req.body.stock === 'on' ? 0 : 1,
        expiration_date: String(req.body.expirationDate || ''),
        img: String(req.body.img || ''),
        description: String(req.body.description || ''),
      };
      await dbRun(
        `INSERT INTO products (id, name, barcode, price, cost_price, category, quantity, min_stock, stock, expiration_date, img, description)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        Object.values(newProduct)
      );
      return res.json({ success: true, message: 'Product created', productId: newProduct.id });
    }

    // Update existing
    const existing = await dbGet('SELECT * FROM products WHERE id = ?', [parseInt(String(productId))]) as Product;
    if (!existing) return res.status(404).json({ error: 'Product not found' });

    const updateFields: any = {};
    const fieldMappings: { [key: string]: string } = {
      name: 'name',
      barcode: 'barcode',
      price: 'price',
      quantity: 'quantity',
      category: 'category',
      expirationDate: 'expiration_date',
      minStock: 'min_stock',
      description: 'description',
      img: 'img',
      costPrice: 'cost_price',
      supplier: 'supplier',
      supplierId: 'supplier_id',
      primarySupplierId: 'primary_supplier_id',
      manufacturer: 'manufacturer',
      batchNumber: 'batch_number',
      drugClass: 'drug_class',
      dosageForm: 'dosage_form',
      strength: 'strength',
      activeIngredients: 'active_ingredients',
      sideEffects: 'side_effects',
      storageConditions: 'storage_conditions',
      reorderLevel: 'reorder_level',
      salesCount: 'sales_count',
    };

    Object.keys(fieldMappings).forEach(key => {
      if (req.body[key] !== undefined) updateFields[fieldMappings[key]] = req.body[key];
    });

    if (req.body.prescriptionRequired !== undefined) updateFields.prescription_required = req.body.prescriptionRequired ? 1 : 0;
    if (req.body.isControlledSubstance !== undefined) updateFields.is_controlled_substance = req.body.isControlledSubstance ? 1 : 0;
    if (req.body.requiresRefrigeration !== undefined) updateFields.requires_refrigeration = req.body.requiresRefrigeration ? 1 : 0;

    // Check if stock quantity increased
    const previousQuantity = existing.quantity || 0;
    const newQuantity = updateFields.quantity !== undefined ? updateFields.quantity : existing.quantity;
    const quantityIncreased = newQuantity > previousQuantity;

    const setClause = Object.keys(updateFields).map(k => `${k} = ?`).join(', ');
    const values = [...Object.values(updateFields), parseInt(String(productId))];
    const result = await dbRun(`UPDATE products SET ${setClause} WHERE id = ?`, values);

    if (result.changes === 0) return res.status(404).json({ error: 'No changes' });

    // Record restock history if quantity increased
    if (quantityIncreased) {
      const quantityAdded = newQuantity - previousQuantity;
      const supplierId = updateFields.supplier_id || existing.supplier_id || updateFields.primary_supplier_id || existing.primary_supplier_id;
      const supplierName = updateFields.supplier || existing.supplier;
      const costPrice = updateFields.cost_price || existing.cost_price;

      try {
        // Get supplier name if we have supplier ID
        let finalSupplierName = supplierName || 'Stock Adjustment';
        if (supplierId) {
          const supplier = await dbGet('SELECT name FROM suppliers WHERE id = ?', [supplierId]) as Supplier;
          if (supplier) {
            finalSupplierName = supplier.name;
          }
        }

        await dbRun(
          `INSERT INTO restock_history (
            product_id, product_name, supplier_id, supplier_name, cost_price, quantity,
            restock_date, batch_number, previous_quantity, new_quantity
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            parseInt(String(productId)),
            existing.name,
            supplierId || 0,
            finalSupplierName,
            costPrice || '0',
            quantityAdded,
            new Date().toISOString(),
            updateFields.batch_number || `STOCK-ADJUST-${Date.now()}`,
            previousQuantity,
            newQuantity,
          ]
        );
        console.log(`📦 Auto-recorded stock increase: +${quantityAdded} units for product ${existing.name}`);
      } catch (historyError) {
        console.error('Failed to record restock history:', historyError);
        // Don't fail the main update if history recording fails
      }
    }

    res.json({ success: true, message: 'Product updated', productId });
  } catch (err: any) {
    console.error('POST error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// === GET SINGLE PRODUCT ===
router.get('/product/:productId', async (req: Request, res: Response) => {
  const id = parseInt(req.params.productId);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

  try {
    const product = await dbGet(
      `SELECT
         p.*,
         p.cost_price AS costPrice,
         p.category AS category
       FROM products p
       WHERE p.id = ?`,
      [id]
    );
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err: any) {
    console.error('GET /product/:id error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// === GET ALL PRODUCTS ===
router.get('/products', async (req: Request, res: Response) => {
  try {
    const docs = await dbAll(`
      SELECT
        p.*,
        p.cost_price AS costPrice,
        p.category AS category
      FROM products p
      ORDER BY p.name
    `) as Product[];
    const clean = docs.map(p => {
      const { category_id, ...rest } = p as any;
      return rest;
    });
    res.json(clean);
  } catch (err: any) {
    console.error('GET /products error:', err.message);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch products: ' + err.message,
    });
  }
});

// === DELETE ===
router.delete('/product/:productId', async (req: Request, res: Response) => {
  try {
    const result = await dbRun('DELETE FROM products WHERE id = ?', [parseInt(req.params.productId)]);
    if (result.changes === 0) return res.status(404).json({ error: 'Product not found' });
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// === SKU LOOKUP ===
router.post('/product/sku', async (req: Request, res: Response) => {
  try {
    const sku = validator.escape(req.body.skuCode);
    const doc = await dbGet(
      `SELECT *, cost_price AS costPrice FROM products WHERE barcode = ?`,
      [parseInt(sku)]
    );
    res.send(doc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// === DECREMENT INVENTORY ===
router.decrementInventory = async (products: TransactionProduct[]) => {
  for (const p of products) {
    try {
      const product = await dbGet('SELECT * FROM products WHERE id = ?', [parseInt(p.id)]);
      if (!product || !product.quantity) continue;
      const newQty = parseInt(String(product.quantity)) - parseInt(p.quantity);
      await dbRun('UPDATE products SET quantity = ? WHERE id = ?', [newQty, parseInt(p.id)]);
    } catch (err) {
      console.error('Decrement error:', err);
    }
  }
};

export default router;