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

router.get('/', (req: Request, res: Response) => {
  res.send('Inventory API');
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