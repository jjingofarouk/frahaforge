// src/renderer/src/components/modals/ProductModal.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Package, DollarSign, Tag, BarChart3, Calendar, AlertTriangle, Truck, Pill, Shield, Thermometer, Users } from 'lucide-react';
import { Product } from '../../types/products.types';
import { suppliersService, Supplier } from '../../services/supplierService';
import { inventoryService } from '../../services/inventoryService';
import './ProductModal.css';

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => Promise<void>;
  onRestock: (restockData: {
    productId: number;
    quantity: number;
    costPrice: string;
    supplierId: number;
    batchNumber?: string;
  }) => Promise<void>;
  mode: 'view' | 'edit';
  loading: boolean;
}

const ProductModal: React.FC<ProductModalProps> = ({
  product,
  isOpen,
  onClose,
  onSave,
  onRestock,
  mode,
  loading
}) => {
  const [editedProduct, setEditedProduct] = useState<Product | null>(null);
  const [isRestockMode, setIsRestockMode] = useState(false);
  const [restockData, setRestockData] = useState({
    quantity: 0,
    costPrice: '',
    supplierId: 0,
    batchNumber: ''
  });
  const [saveLoading, setSaveLoading] = useState(false);
  const [restockLoading, setRestockLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [suppliersLoading, setSuppliersLoading] = useState(false);
  const [stockChangeInfo, setStockChangeInfo] = useState<{
    previous: number;
    new: number;
    difference: number;
  } | null>(null);

  // Load suppliers when modal opens
  useEffect(() => {
    const loadSuppliers = async () => {
      if (isOpen) {
        setSuppliersLoading(true);
        try {
          const suppliersData = await suppliersService.getSuppliers();
          setSuppliers(suppliersData);
        } catch (error) {
          console.error('Failed to load suppliers:', error);
        } finally {
          setSuppliersLoading(false);
        }
      }
    };

    loadSuppliers();
  }, [isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (isOpen && product) {
      setEditedProduct({ ...product });
      setRestockData({
        quantity: 0,
        costPrice: product.costPrice?.toString() || '',
        supplierId: product.primarySupplierId || 0,
        batchNumber: product.batchNumber || ''
      });
      setIsRestockMode(false);
      setStockChangeInfo(null);
    }
  }, [isOpen, product]);

  // Track stock changes
  useEffect(() => {
    if (editedProduct && product) {
      const previousQuantity = product.quantity || 0;
      const newQuantity = editedProduct.quantity || 0;
      const difference = newQuantity - previousQuantity;

      if (difference !== 0) {
        setStockChangeInfo({
          previous: previousQuantity,
          new: newQuantity,
          difference
        });
      } else {
        setStockChangeInfo(null);
      }
    }
  }, [editedProduct?.quantity, product]);

  // Get current supplier name for display and data
  const getCurrentSupplierName = () => {
    if (!editedProduct) return '';
    if (editedProduct.primarySupplierId) {
      const supplier = suppliers.find(s => s.id === editedProduct.primarySupplierId);
      return supplier?.name || editedProduct.supplier || '';
    }
    return editedProduct.supplier || '';
  };

  // Get current supplier object
  const getCurrentSupplier = (): Supplier | null => {
    if (!editedProduct) return null;
    if (editedProduct.primarySupplierId) {
      return suppliers.find(s => s.id === editedProduct.primarySupplierId) || null;
    }
    return null;
  };

const handleSave = async () => {
  if (!editedProduct) return;
  
  setSaveLoading(true);
  try {
    console.log('🔄 DEBUG - editedProduct before service:', JSON.stringify(editedProduct, null, 2));
    
    // Create the exact object structure the backend expects
    const backendProduct = {
      id: editedProduct.id,
      name: editedProduct.name,
      barcode: editedProduct.barcode,
      price: editedProduct.price,
      quantity: editedProduct.quantity,
      category: editedProduct.category,
      expiration_date: editedProduct.expirationDate, // snake_case for backend
      min_stock: editedProduct.minStock, // snake_case for backend
      description: editedProduct.description,
      img: editedProduct.img,
      cost_price: editedProduct.costPrice, // snake_case for backend
      supplier: editedProduct.supplier,
      supplier_id: editedProduct.primarySupplierId, // snake_case for backend
      primary_supplier_id: editedProduct.primarySupplierId, // snake_case for backend
      manufacturer: editedProduct.manufacturer,
      batch_number: editedProduct.batchNumber, // snake_case for backend
      drug_class: editedProduct.drugClass, // snake_case for backend
      dosage_form: editedProduct.dosageForm, // snake_case for backend
      strength: editedProduct.strength,
      active_ingredients: editedProduct.activeIngredients, // snake_case for backend
      side_effects: editedProduct.sideEffects, // snake_case for backend
      storage_conditions: editedProduct.storageConditions, // snake_case for backend
      reorder_level: editedProduct.reorderLevel, // snake_case for backend
      sales_count: editedProduct.salesCount, // snake_case for backend
      prescription_required: editedProduct.prescriptionRequired, // snake_case for backend
      is_controlled_substance: editedProduct.isControlledSubstance, // snake_case for backend
      requires_refrigeration: editedProduct.requiresRefrigeration, // snake_case for backend
      wholesale_price: editedProduct.wholesalePrice, // snake_case for backend
      last_price_update: editedProduct.lastPriceUpdate, // snake_case for backend
      profit_amount: editedProduct.profitAmount, // snake_case for backend
      profit_margin: editedProduct.profitMargin, // snake_case for backend
      last_restocked: editedProduct.lastRestocked // snake_case for backend
    };

    console.log('🔄 DEBUG - backendProduct being sent:', JSON.stringify(backendProduct, null, 2));
    
    // Use fetch directly to bypass the problematic service transformation
    const response = await fetch('http://192.168.1.3:3000/api/inventory/product', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(backendProduct),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Backend error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ DEBUG - Update successful:', result);
    
    // Call the original onSave to update local state
    await onSave(editedProduct);
    
    onClose();
  } catch (error) {
    console.error('❌ DEBUG - Failed to save product:', error);
    alert('Failed to save product. Please check the console for details.');
  } finally {
    setSaveLoading(false);
  }
};

  const handleRestock = async () => {
    if (!product) return;
    
    // Validate supplier selection
    if (!restockData.supplierId) {
      alert('Please select a supplier for restocking');
      return;
    }

    // Validate required fields
    if (restockData.quantity <= 0 || !restockData.costPrice) {
      alert('Please fill in all required restock fields');
      return;
    }

    setRestockLoading(true);
    try {
      await onRestock({
        productId: product.id,
        quantity: restockData.quantity,
        costPrice: restockData.costPrice,
        supplierId: restockData.supplierId,
        batchNumber: restockData.batchNumber || undefined
      });
      setIsRestockMode(false);
      setRestockData({
        quantity: 0,
        costPrice: restockData.costPrice,
        supplierId: 0,
        batchNumber: ''
      });
      onClose();
    } catch (error) {
      console.error('Failed to restock product:', error);
    } finally {
      setRestockLoading(false);
    }
  };

  const handleInputChange = (field: keyof Product, value: any) => {
    if (!editedProduct) return;
    
    // Handle number fields specifically
    if (field === 'barcode' || field === 'quantity' || field === 'primarySupplierId') {
      setEditedProduct({ ...editedProduct, [field]: value === '' ? null : Number(value) });
    } else if (field === 'price' || field === 'costPrice') {
      setEditedProduct({ ...editedProduct, [field]: value });
    } else if (field === 'minStock') {
      setEditedProduct({ ...editedProduct, [field]: value === '' ? null : value });
    } else {
      setEditedProduct({ ...editedProduct, [field]: value });
    }
  };

  const handleRestockChange = (field: keyof typeof restockData, value: any) => {
    setRestockData(prev => ({ ...prev, [field]: value }));
  };

  // Add this function to handle supplier selection in product editing
  const handleSupplierChange = (supplierId: number) => {
    if (!editedProduct) return;
    
    const selectedSupplier = suppliers.find(s => s.id === supplierId);
    setEditedProduct({
      ...editedProduct,
      primarySupplierId: supplierId,
      supplier: selectedSupplier?.name || ''
    });
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX'
    }).format(isNaN(num) ? 0 : num);
  };

  const calculateProfit = () => {
    if (!editedProduct) return { amount: 0, margin: 0 };
    
    const cost = parseFloat(editedProduct.costPrice?.toString() || '0');
    const price = parseFloat(editedProduct.price?.toString() || '0');
    const profitAmount = price - cost;
    const profitMargin = cost > 0 ? (profitAmount / cost) * 100 : 0;
    
    return { amount: profitAmount, margin: profitMargin };
  };

  const getStockStatus = () => {
    if (!product) return { status: 'good', label: 'In Stock' };
    if (product.quantity === 0) return { status: 'out', label: 'Out of Stock' };
    const minStock = parseInt(product.minStock || '0') || 5;
    if (product.quantity <= minStock) return { status: 'low', label: 'Low Stock' };
    return { status: 'good', label: 'In Stock' };
  };

  const getExpiryStatus = () => {
    if (!product?.expirationDate) return { status: 'good', label: 'No Date' };
    const daysUntilExpiry = Math.floor((new Date(product.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysUntilExpiry < 0) return { status: 'expired', label: 'Expired' };
    if (daysUntilExpiry <= 30) return { status: 'expiring', label: 'Expiring Soon' };
    return { status: 'good', label: 'Valid' };
  };

  const handleClose = () => {
    setIsRestockMode(false);
    onClose();
  };

  // Safe value getter for inputs
  const getInputValue = (value: any): string => {
    if (value === null || value === undefined) return '';
    return value.toString();
  };

  if (!product || !editedProduct) return null;

  const profit = calculateProfit();
  const minStock = parseInt(product.minStock || '0');
  const stockStatus = getStockStatus();
  const expiryStatus = getExpiryStatus();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="product-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="product-modal-content"
            initial={{ scale: 0.9, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 50 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="product-modal-header">
              <div className="product-modal-title">
                <Package size={24} />
                <div className="title-content">
                  <h3>{mode === 'edit' ? 'Edit Product' : 'Product Details'}</h3>
                  <div className="product-indicators">
                    {product.prescriptionRequired && (
                      <span className="indicator prescription" title="Prescription Required">
                        <Pill size={12} />
                      </span>
                    )}
                    {product.isControlledSubstance && (
                      <span className="indicator controlled" title="Controlled Substance">
                        <Shield size={12} />
                      </span>
                    )}
                    {product.requiresRefrigeration && (
                      <span className="indicator refrigeration" title="Requires Refrigeration">
                        <Thermometer size={12} />
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button className="product-modal-close" onClick={handleClose}>
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="product-modal-body">
              {/* Stock Change Notification */}
              {stockChangeInfo && stockChangeInfo.difference > 0 && mode === 'edit' && (
                <div className="stock-change-notification">
                  <Truck size={16} />
                  <span>
                    Stock will increase from {stockChangeInfo.previous} to {stockChangeInfo.new} 
                    (+{stockChangeInfo.difference}). This will be recorded in restock history.
                  </span>
                </div>
              )}

              {/* Product Image */}
              {product.img && (
                <div className="product-image-section">
                  <img src={product.img} alt={product.name} className="product-modal-image" />
                </div>
              )}

              {/* Basic Information */}
              <div className="product-section">
                <h4 className="section-title">Basic Information</h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Product ID</label>
                    <input
                      type="text"
                      value={editedProduct.id}
                      disabled
                      className="disabled-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Product Name *</label>
                    <input
                      type="text"
                      value={editedProduct.name || ''}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      disabled={mode === 'view' && !isRestockMode}
                      placeholder="Enter product name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Barcode</label>
                    <input
                      type="number"
                      value={editedProduct.barcode || ''}
                      onChange={(e) => handleInputChange('barcode', e.target.value)}
                      disabled={mode === 'view' && !isRestockMode}
                      placeholder="Enter barcode"
                    />
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <input
                      type="text"
                      value={editedProduct.category || ''}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      disabled={mode === 'view' && !isRestockMode}
                      placeholder="Enter category"
                    />
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="product-section">
                <h4 className="section-title">
                  <DollarSign size={16} />
                  Pricing & Inventory
                </h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Cost Price (UGX)</label>
                    <input
                      type="text"
                      value={getInputValue(editedProduct.costPrice)}
                      onChange={(e) => handleInputChange('costPrice', e.target.value)}
                      disabled={mode === 'view' && !isRestockMode}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="form-group">
                    <label>Selling Price (UGX) *</label>
                    <input
                      type="text"
                      value={getInputValue(editedProduct.price)}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                      disabled={mode === 'view' && !isRestockMode}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="form-group">
                    <label>Current Stock</label>
                    <div className="stock-display">
                      <input
                        type="number"
                        value={editedProduct.quantity || 0}
                        onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
                        disabled={mode === 'view' && !isRestockMode}
                      />
                      <span className={`stock-status ${stockStatus.status}`}>
                        {stockStatus.label}
                      </span>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Minimum Stock</label>
                    <input
                      type="text"
                      value={getInputValue(editedProduct.minStock)}
                      onChange={(e) => handleInputChange('minStock', e.target.value)}
                      disabled={mode === 'view' && !isRestockMode}
                      placeholder="5"
                    />
                  </div>
                </div>

                {/* Profit Calculation */}
                <div className="profit-display">
                  <div className="profit-item">
                    <span>Profit Amount:</span>
                    <span className={profit.amount >= 0 ? 'profit-positive' : 'profit-negative'}>
                      {formatCurrency(profit.amount)}
                    </span>
                  </div>
                  <div className="profit-item">
                    <span>Profit Margin:</span>
                    <span className={profit.margin >= 0 ? 'profit-positive' : 'profit-negative'}>
                      {profit.margin.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Supplier Information */}
              <div className="product-section">
                <h4 className="section-title">
                  <Users size={16} />
                  Supplier Information
                </h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Primary Supplier</label>
                    {suppliersLoading ? (
                      <select disabled>
                        <option>Loading suppliers...</option>
                      </select>
                    ) : (
                      <select
                        value={editedProduct.primarySupplierId || ''}
                        onChange={(e) => handleSupplierChange(Number(e.target.value))}
                        disabled={mode === 'view' && !isRestockMode}
                      >
                        <option value="">Select a supplier</option>
                        {suppliers.map(supplier => (
                          <option key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Supplier Display Name</label>
                    <input
                      type="text"
                      value={getCurrentSupplierName()}
                      disabled
                      className="disabled-input"
                      placeholder="Will be set automatically"
                    />
                  </div>
                </div>
              </div>

              {/* Restock Section */}
              {isRestockMode && (
                <div className="product-section restock-section">
                  <h4 className="section-title">
                    <Truck size={16} />
                    Restock Product
                  </h4>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Quantity to Add *</label>
                      <input
                        type="number"
                        value={restockData.quantity}
                        onChange={(e) => handleRestockChange('quantity', parseInt(e.target.value) || 0)}
                        min="1"
                        placeholder="0"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Cost Price (UGX) *</label>
                      <input
                        type="text"
                        value={restockData.costPrice}
                        onChange={(e) => handleRestockChange('costPrice', e.target.value)}
                        placeholder="Enter cost per unit"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Supplier *</label>
                      {suppliersLoading ? (
                        <select disabled>
                          <option>Loading suppliers...</option>
                        </select>
                      ) : (
                        <select
                          value={restockData.supplierId}
                          onChange={(e) => handleRestockChange('supplierId', parseInt(e.target.value))}
                          required
                        >
                          <option value="">Select a supplier *</option>
                          {suppliers.map(supplier => (
                            <option key={supplier.id} value={supplier.id}>
                              {supplier.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                    <div className="form-group">
                      <label>Batch Number (Optional)</label>
                      <input
                        type="text"
                        value={restockData.batchNumber}
                        onChange={(e) => handleRestockChange('batchNumber', e.target.value)}
                        placeholder="Enter batch number"
                      />
                    </div>
                  </div>
                  {!restockData.supplierId && (
                    <div className="form-error">
                      Please select a supplier for restocking
                    </div>
                  )}
                </div>
              )}

              {/* Additional Information */}
              <div className="product-section">
                <h4 className="section-title">
                  <BarChart3 size={16} />
                  Additional Information
                </h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Expiration Date</label>
                    <div className="expiry-display">
                      <input
                        type="date"
                        value={editedProduct.expirationDate || ''}
                        onChange={(e) => handleInputChange('expirationDate', e.target.value)}
                        disabled={mode === 'view' && !isRestockMode}
                      />
                      {product.expirationDate && (
                        <span className={`expiry-status ${expiryStatus.status}`}>
                          {expiryStatus.label}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="form-group full-width">
                    <label>Description</label>
                    <textarea
                      value={editedProduct.description || ''}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      disabled={mode === 'view' && !isRestockMode}
                      rows={3}
                      placeholder="Enter product description"
                    />
                  </div>
                </div>
              </div>

              {/* Product Flags */}
              <div className="product-section">
                <h4 className="section-title">Product Flags</h4>
                <div className="flags-grid">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={editedProduct.prescriptionRequired || false}
                      onChange={(e) => handleInputChange('prescriptionRequired', e.target.checked)}
                      disabled={mode === 'view' && !isRestockMode}
                    />
                    <span>Prescription Required</span>
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={editedProduct.isControlledSubstance || false}
                      onChange={(e) => handleInputChange('isControlledSubstance', e.target.checked)}
                      disabled={mode === 'view' && !isRestockMode}
                    />
                    <span>Controlled Substance</span>
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={editedProduct.requiresRefrigeration || false}
                      onChange={(e) => handleInputChange('requiresRefrigeration', e.target.checked)}
                      disabled={mode === 'view' && !isRestockMode}
                    />
                    <span>Requires Refrigeration</span>
                  </label>
                </div>
              </div>

              {/* Stock Alerts */}
              {product.quantity <= minStock && minStock > 0 && (
                <div className="stock-alert">
                  <AlertTriangle size={16} />
                  <span>Low Stock Alert! Current quantity ({product.quantity}) is below minimum stock level ({minStock}).</span>
                </div>
              )}

              {expiryStatus.status === 'expired' && (
                <div className="expiry-alert expired">
                  <AlertTriangle size={16} />
                  <span>This product has expired on {new Date(product.expirationDate!).toLocaleDateString()}.</span>
                </div>
              )}

              {expiryStatus.status === 'expiring' && (
                <div className="expiry-alert expiring">
                  <AlertTriangle size={16} />
                  <span>This product expires on {new Date(product.expirationDate!).toLocaleDateString()}.</span>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="product-modal-footer">
              <div className="footer-actions">
                {mode === 'view' ? (
                  <>
                    <button
                      className="btn-secondary"
                      onClick={() => setIsRestockMode(true)}
                    >
                      <Truck size={16} />
                      Restock
                    </button>
                    <button
                      className="btn-primary"
                      onClick={handleClose}
                    >
                      Close
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="btn-secondary"
                      onClick={handleClose}
                      disabled={saveLoading}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn-primary"
                      onClick={handleSave}
                      disabled={saveLoading || loading || !editedProduct.name || !editedProduct.price}
                    >
                      {saveLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </>
                )}

                {isRestockMode && (
                  <button
                    className="btn-warning"
                    onClick={handleRestock}
                    disabled={restockLoading || restockData.quantity <= 0 || !restockData.costPrice || !restockData.supplierId}
                  >
                    {restockLoading ? 'Restocking...' : 'Confirm Restock'}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export { ProductModal };