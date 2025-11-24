// src/renderer/src/components/modals/NewProduct.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Package, Loader, DollarSign, Truck, Percent, Calculator } from 'lucide-react';
import { inventoryService, Product } from '../../services/inventoryService';
import { suppliersService, Supplier } from '../../services/supplierService';
import { getCategories } from '../../services/api';
import '../../../styles/NewProduct.css';

interface NewProductProps {
  isOpen: boolean;
  onClose: () => void;
  onProductAdded?: () => void;
  editingProduct?: any;
}

interface ProductFormData {
  id: string;
  category: string;
  name: string;
  barcode: string;
  price: string;
  costPrice: string;
  taxRate: string;
  supplier: string;
  expirationDate: string;
  quantity: string;
  minStock: string;
  reorderLevel: string;
  stock: boolean;
  imagename: File | null;
  remove: boolean;
  img: string;
  description?: string;
  primarySupplierId?: number;
  batchNumber?: string;
  manufacturer?: string;
  drugClass?: string;
  prescriptionRequired?: boolean;
  sideEffects?: string;
  storageConditions?: string;
  activeIngredients?: string;
  dosageForm?: string;
  strength?: string;
  packageSize?: string;
  isControlledSubstance?: boolean;
  requiresRefrigeration?: boolean;
}

interface Category {
  id: number;
  name: string;
  created_at?: string;
}

const NewProduct: React.FC<NewProductProps> = ({ isOpen, onClose, onProductAdded, editingProduct }) => {
  const [formData, setFormData] = useState<ProductFormData>({
    id: '',
    category: '',
    name: '',
    barcode: '',
    price: '',
    costPrice: '',
    taxRate: '',
    supplier: '',
    expirationDate: '',
    quantity: '',
    minStock: '1',
    reorderLevel: '5',
    stock: true,
    imagename: null,
    remove: false,
    img: '',
    description: '',
    primarySupplierId: undefined,
    batchNumber: '',
    manufacturer: '',
    drugClass: '',
    prescriptionRequired: false,
    sideEffects: '',
    storageConditions: '',
    activeIngredients: '',
    dosageForm: '',
    strength: '',
    packageSize: '',
    isControlledSubstance: false,
    requiresRefrigeration: false,
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [suppliersLoading, setSuppliersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profitInfo, setProfitInfo] = useState<{ profit: number; margin: number } | null>(null);

  // Fetch categories and suppliers on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setCategoriesLoading(true);
        setSuppliersLoading(true);
        
        const [categoriesResponse, suppliersData] = await Promise.all([
          getCategories(),
          suppliersService.getSuppliers()
        ]);
        
        setCategories(categoriesResponse.data);
        setSuppliers(suppliersData);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load required data');
      } finally {
        setCategoriesLoading(false);
        setSuppliersLoading(false);
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  // Set form data when editing product
  useEffect(() => {
    if (editingProduct && isOpen) {
      setFormData({
        id: editingProduct.id?.toString() || '',
        category: editingProduct.category || '',
        name: editingProduct.name || '',
        barcode: editingProduct.barcode?.toString() || '',
        price: editingProduct.price || '',
        costPrice: editingProduct.costPrice || '',
        taxRate: editingProduct.taxRate || '',
        supplier: editingProduct.supplier || '',
        expirationDate: editingProduct.expirationDate || '',
        quantity: editingProduct.quantity?.toString() || '0',
        minStock: editingProduct.minStock || '1',
        reorderLevel: editingProduct.reorderLevel?.toString() || '5',
        stock: editingProduct.stock !== 0,
        imagename: null,
        remove: false,
        img: editingProduct.img || '',
        description: editingProduct.description || '',
        primarySupplierId: editingProduct.primarySupplierId,
        batchNumber: editingProduct.batchNumber || '',
        manufacturer: editingProduct.manufacturer || '',
        drugClass: editingProduct.drugClass || '',
        prescriptionRequired: editingProduct.prescriptionRequired || false,
        sideEffects: editingProduct.sideEffects || '',
        storageConditions: editingProduct.storageConditions || '',
        activeIngredients: editingProduct.activeIngredients || '',
        dosageForm: editingProduct.dosageForm || '',
        strength: editingProduct.strength || '',
        packageSize: editingProduct.packageSize || '',
        isControlledSubstance: editingProduct.isControlledSubstance || false,
        requiresRefrigeration: editingProduct.requiresRefrigeration || false,
      });
    }
  }, [editingProduct, isOpen]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen && !editingProduct) {
      setFormData({
        id: '',
        category: '',
        name: '',
        barcode: '',
        price: '',
        costPrice: '',
        taxRate: '',
        supplier: '',
        expirationDate: '',
        quantity: '',
        minStock: '1',
        reorderLevel: '5',
        stock: true,
        imagename: null,
        remove: false,
        img: '',
        description: '',
        primarySupplierId: undefined,
        batchNumber: '',
        manufacturer: '',
        drugClass: '',
        prescriptionRequired: false,
        sideEffects: '',
        storageConditions: '',
        activeIngredients: '',
        dosageForm: '',
        strength: '',
        packageSize: '',
        isControlledSubstance: false,
        requiresRefrigeration: false,
      });
      setError(null);
      setProfitInfo(null);
    }
  }, [isOpen, editingProduct]);

  // Calculate profit when price or cost price changes
  useEffect(() => {
    if (formData.price && formData.costPrice) {
      const sellingPrice = parseFloat(formData.price);
      const costPrice = parseFloat(formData.costPrice);
      
      if (!isNaN(sellingPrice) && !isNaN(costPrice) && costPrice > 0) {
        const profit = sellingPrice - costPrice;
        const margin = (profit / costPrice) * 100;
        setProfitInfo({ profit, margin });
      } else {
        setProfitInfo(null);
      }
    } else {
      setProfitInfo(null);
    }
  }, [formData.price, formData.costPrice]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      setFormData((prev) => ({ 
        ...prev, 
        [name]: (e.target as HTMLInputElement).checked 
      }));
    } else if (type === 'file') {
      const file = (e.target as HTMLInputElement).files?.[0] || null;
      setFormData((prev) => ({ 
        ...prev, 
        imagename: file,
        remove: false // Reset remove when new file is selected
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSupplierChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const supplierId = parseInt(e.target.value);
    const selectedSupplier = suppliers.find(s => s.id === supplierId);
    
    setFormData(prev => ({
      ...prev,
      primarySupplierId: supplierId || undefined,
      supplier: selectedSupplier?.name || ''
    }));
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({ 
      ...prev, 
      imagename: null, 
      remove: true,
      img: '' 
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError('Product name is required');
      return false;
    }
    if (!formData.barcode.trim()) {
      setError('Barcode is required');
      return false;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      setError('Valid selling price is required');
      return false;
    }
    if (!formData.category) {
      setError('Category is required');
      return false;
    }
    if (formData.costPrice && parseFloat(formData.costPrice) < 0) {
      setError('Cost price cannot be negative');
      return false;
    }
    if (formData.taxRate && (parseFloat(formData.taxRate) < 0 || parseFloat(formData.taxRate) > 100)) {
      setError('Tax rate must be between 0 and 100');
      return false;
    }
    return true;
  };

  const transformFormDataToProduct = (): Partial<Product> => {
    return {
      id: formData.id ? parseInt(formData.id) : undefined,
      name: formData.name,
      barcode: formData.barcode ? parseInt(formData.barcode) : null,
      price: formData.price,
      costPrice: formData.costPrice || undefined,
      category: formData.category,
      quantity: parseInt(formData.quantity) || 0,
      minStock: formData.minStock,
      reorderLevel: parseInt(formData.reorderLevel) || 5,
      stock: formData.stock ? 1 : 0,
      expirationDate: formData.expirationDate || null,
      supplier: formData.supplier,
      description: formData.description,
      primarySupplierId: formData.primarySupplierId,
      batchNumber: formData.batchNumber,
      manufacturer: formData.manufacturer,
      drugClass: formData.drugClass,
      prescriptionRequired: formData.prescriptionRequired,
      sideEffects: formData.sideEffects,
      storageConditions: formData.storageConditions,
      activeIngredients: formData.activeIngredients,
      dosageForm: formData.dosageForm,
      strength: formData.strength, 
      packageSize: formData.packageSize,
      isControlledSubstance: formData.isControlledSubstance,
      requiresRefrigeration: formData.requiresRefrigeration,
      // Note: Image handling would need separate implementation
      // as the current service doesn't support file uploads
    };
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      const productData = transformFormDataToProduct();
      
      if (editingProduct) {
        // Update existing product
        await inventoryService.updateProduct(productData);
        alert('Product updated successfully!');
      } else {
        // Create new product
        await inventoryService.createProduct(productData);
        alert('Product created successfully!');
      }

      onClose();
      
      // Notify parent component to refresh products list
      if (onProductAdded) {
        onProductAdded();
      }
      
    } catch (err: any) {
      console.error('Error saving product:', err);
      setError(err.message || 'Failed to save product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateBarcode = () => {
    // Generate a simple timestamp-based barcode
    const newBarcode = Date.now().toString().slice(-8);
    setFormData(prev => ({ ...prev, barcode: newBarcode }));
  };

  const calculateTaxAmount = () => {
    if (formData.price && formData.taxRate) {
      const price = parseFloat(formData.price);
      const taxRate = parseFloat(formData.taxRate);
      return (price * taxRate) / 100;
    }
    return 0;
  };

  const handleClose = () => {
    setFormData({
      id: '',
      category: '',
      name: '',
      barcode: '',
      price: '',
      costPrice: '',
      taxRate: '',
      supplier: '',
      expirationDate: '',
      quantity: '',
      minStock: '1',
      reorderLevel: '5',
      stock: true,
      imagename: null,
      remove: false,
      img: '',
      description: '',
      primarySupplierId: undefined,
      batchNumber: '',
      manufacturer: '',
      drugClass: '',
      prescriptionRequired: false,
      sideEffects: '',
      storageConditions: '',
      activeIngredients: '',
      dosageForm: '',
      strength: '',
      packageSize: '',
      isControlledSubstance: false,
      requiresRefrigeration: false,
    });
    setError(null);
    setProfitInfo(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="new-product-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={handleClose}
        >
          <motion.div
            className="new-product-content"
            initial={{ scale: 0.95, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 50 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="new-product-header">
              <h4 className="new-product-title">
                <Package className="new-product-icon" size={24} />
                {editingProduct ? 'Edit Product' : 'Add to Stock'}
              </h4>
              <motion.button 
                className="new-product-close-btn" 
                onClick={handleClose}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                disabled={loading}
              >
                <X className="new-product-icon" size={24} />
              </motion.button>
            </div>
            
            <div className="new-product-body">
              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}

              {/* Profit Preview */}
              {profitInfo && (
                <div className="profit-preview">
                  <div className="profit-header">
                    <Calculator size={18} />
                    <span>Profit Preview</span>
                  </div>
                  <div className="profit-details">
                    <div className="profit-item">
                      <span>Profit:</span>
                      <span className={`profit-amount ${profitInfo.profit >= 0 ? 'positive' : 'negative'}`}>
                        ${profitInfo.profit.toFixed(2)}
                      </span>
                    </div>
                    <div className="profit-item">
                      <span>Margin:</span>
                      <span className={`profit-margin ${profitInfo.margin >= 0 ? 'positive' : 'negative'}`}>
                        {profitInfo.margin.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <input type="hidden" name="id" value={formData.id} />
                
                <div className="form-section">
                  <h5 className="section-title">Basic Information</h5>
                  
                  <div className="form-group">
                    <label htmlFor="category" className="form-label">Category*</label>
                    <select
                      name="category"
                      id="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="form-control"
                      required
                      disabled={categoriesLoading || loading}
                    >
                      <option value="">Select Category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.name}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    {categoriesLoading && (
                      <div className="loading-text">Loading categories...</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="productName" className="form-label">Product Name*</label>
                    <input
                      type="text"
                      id="productName"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="Enter product name"
                      className="form-control"
                      disabled={loading}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="barcode" className="form-label">
                      Barcode*
                      <button 
                        type="button" 
                        className="generate-barcode-btn"
                        onClick={generateBarcode}
                        disabled={loading}
                      >
                        Generate
                      </button>
                    </label>
                    <input
                      type="text"
                      id="barcode"
                      name="barcode"
                      value={formData.barcode}
                      onChange={handleChange}
                      required
                      placeholder="Enter product barcode"
                      className="form-control"
                      disabled={loading}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="description" className="form-label">Description</label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Enter product description"
                      className="form-control"
                      rows={3}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="form-section">
                  <h5 className="section-title">Pricing & Profit</h5>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="costPrice" className="form-label">
                        <DollarSign size={16} />
                        Cost Price
                      </label>
                      <input
                        type="number"
                        id="costPrice"
                        name="costPrice"
                        value={formData.costPrice}
                        onChange={handleChange}
                        placeholder="0.00"
                        className="form-control"
                        step="0.01"
                        min="0"
                        disabled={loading}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="product_price" className="form-label">Selling Price*</label>
                      <input
                        type="number"
                        id="product_price"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        required
                        placeholder="0.00"
                        className="form-control"
                        step="0.01"
                        min="0"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="taxRate" className="form-label">
                        <Percent size={16} />
                        Tax Rate (%)
                      </label>
                      <input
                        type="number"
                        id="taxRate"
                        name="taxRate"
                        value={formData.taxRate}
                        onChange={handleChange}
                        placeholder="0"
                        className="form-control"
                        step="0.01"
                        min="0"
                        max="100"
                        disabled={loading}
                      />
                      {formData.taxRate && (
                        <div className="tax-amount">
                          Tax: ${calculateTaxAmount().toFixed(2)}
                        </div>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="primarySupplierId" className="form-label">
                        <Truck size={16} />
                        Primary Supplier
                      </label>
                      <select
                        id="primarySupplierId"
                        name="primarySupplierId"
                        value={formData.primarySupplierId || ''}
                        onChange={handleSupplierChange}
                        className="form-control"
                        disabled={suppliersLoading || loading}
                      >
                        <option value="">Select Supplier</option>
                        {suppliers.map((supplier) => (
                          <option key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </option>
                        ))}
                      </select>
                      {suppliersLoading && (
                        <div className="loading-text">Loading suppliers...</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h5 className="section-title">Inventory & Expiry</h5>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="quantity" className="form-label">Initial Stock</label>
                      <input
                        type="number"
                        id="quantity"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleChange}
                        placeholder="0"
                        className="form-control"
                        min="0"
                        disabled={loading}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="minStock" className="form-label">Min Stock Alert</label>
                      <input
                        type="number"
                        id="minStock"
                        name="minStock"
                        value={formData.minStock}
                        onChange={handleChange}
                        placeholder="1"
                        className="form-control"
                        min="1"
                        disabled={loading}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="reorderLevel" className="form-label">Reorder Level</label>
                      <input
                        type="number"
                        id="reorderLevel"
                        name="reorderLevel"
                        value={formData.reorderLevel}
                        onChange={handleChange}
                        placeholder="5"
                        className="form-control"
                        min="1"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="expirationDate" className="form-label">Expiry Date</label>
                    <input
                      type="date"
                      id="expirationDate"
                      name="expirationDate"
                      value={formData.expirationDate}
                      onChange={handleChange}
                      className="form-control"
                      disabled={loading}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-checkbox">
                      <input
                        type="checkbox"
                        name="stock"
                        id="stock"
                        checked={!formData.stock}
                        onChange={(e) => setFormData(prev => ({ ...prev, stock: !e.target.checked }))}
                        className="checkbox-input"
                        disabled={loading}
                      />
                      Disable stock tracking
                    </label>
                  </div>
                </div>

                <div className="form-section">
                  <h5 className="section-title">Product Specifications</h5>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="manufacturer" className="form-label">Manufacturer</label>
                      <input
                        type="text"
                        id="manufacturer"
                        name="manufacturer"
                        value={formData.manufacturer}
                        onChange={handleChange}
                        placeholder="Manufacturer name"
                        className="form-control"
                        disabled={loading}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="batchNumber" className="form-label">Batch Number</label>
                      <input
                        type="text"
                        id="batchNumber"
                        name="batchNumber"
                        value={formData.batchNumber}
                        onChange={handleChange}
                        placeholder="Batch number"
                        className="form-control"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="drugClass" className="form-label">Drug Class</label>
                      <input
                        type="text"
                        id="drugClass"
                        name="drugClass"
                        value={formData.drugClass}
                        onChange={handleChange}
                        placeholder="Drug class"
                        className="form-control"
                        disabled={loading}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="dosageForm" className="form-label">Dosage Form</label>
                      <input
                        type="text"
                        id="dosageForm"
                        name="dosageForm"
                        value={formData.dosageForm}
                        onChange={handleChange}
                        placeholder="Dosage form"
                        className="form-control"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="strength" className="form-label">Strength</label>
                      <input
                        type="text"
                        id="strength"
                        name="strength"
                        value={formData.strength}
                        onChange={handleChange}
                        placeholder="Strength"
                        className="form-control"
                        disabled={loading}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="packageSize" className="form-label">Package Size</label>
                      <input
                        type="text"
                        id="packageSize"
                        name="packageSize"
                        value={formData.packageSize}
                        onChange={handleChange}
                        placeholder="Package size"
                        className="form-control"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="form-group full-width">
                    <label htmlFor="activeIngredients" className="form-label">Active Ingredients</label>
                    <textarea
                      id="activeIngredients"
                      name="activeIngredients"
                      value={formData.activeIngredients}
                      onChange={handleChange}
                      placeholder="Active ingredients"
                      className="form-control"
                      rows={2}
                      disabled={loading}
                    />
                  </div>

                  <div className="form-group full-width">
                    <label htmlFor="storageConditions" className="form-label">Storage Conditions</label>
                    <textarea
                      id="storageConditions"
                      name="storageConditions"
                      value={formData.storageConditions}
                      onChange={handleChange}
                      placeholder="Storage conditions"
                      className="form-control"
                      rows={2}
                      disabled={loading}
                    />
                  </div>

                  <div className="form-group full-width">
                    <label htmlFor="sideEffects" className="form-label">Side Effects</label>
                    <textarea
                      id="sideEffects"
                      name="sideEffects"
                      value={formData.sideEffects}
                      onChange={handleChange}
                      placeholder="Side effects"
                      className="form-control"
                      rows={2}
                      disabled={loading}
                    />
                  </div>

                  <div className="flags-grid">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="prescriptionRequired"
                        checked={formData.prescriptionRequired || false}
                        onChange={handleChange}
                        disabled={loading}
                      />
                      <span>Prescription Required</span>
                    </label>

                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="isControlledSubstance"
                        checked={formData.isControlledSubstance || false}
                        onChange={handleChange}
                        disabled={loading}
                      />
                      <span>Controlled Substance</span>
                    </label>

                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="requiresRefrigeration"
                        checked={formData.requiresRefrigeration || false}
                        onChange={handleChange}
                        disabled={loading}
                      />
                      <span>Requires Refrigeration</span>
                    </label>
                  </div>
                </div>

                {/* Note: Image upload functionality would need additional service implementation */}
                {/* The current inventoryService doesn't support file uploads */}

                <motion.button
                  type="submit"
                  className="submit-btn"
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader size={18} className="spinner" />
                      {editingProduct ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    editingProduct ? 'Update Product' : 'Create Product'
                  )}
                </motion.button>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NewProduct;