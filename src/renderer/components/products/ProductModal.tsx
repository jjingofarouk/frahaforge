import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Package, DollarSign, Truck, Settings, 
  Edit3, Save, Plus, AlertTriangle, Calendar,
  BarChart3, Warehouse, Shield, Thermometer,
  Tag, Barcode, FileText, Building
} from 'lucide-react';
import { inventoryService, Product, CreateProductRequest, UpdateProductRequest } from '../../services/inventoryService';
import { supplierService, Supplier } from '../../services/supplierService';
import './ProductModal.css';

type ProductModalMode = 'view' | 'edit' | 'create';

interface ProductModalProps {
  product: Product | null;
  mode: ProductModalMode;
  onClose: () => void;
  onSave: () => void;
}

const ProductModal: React.FC<ProductModalProps> = ({ product, mode, onClose, onSave }) => {
  const [formData, setFormData] = useState<CreateProductRequest | UpdateProductRequest>({
    name: '',
    barcode: '',
    price: 0,
    cost_price: 0,
    category: '',
    quantity: 0,
    min_stock: 0,
    expiration_date: '',
    description: '',
    supplier: '',
    supplier_id: undefined,
    manufacturer: '',
    prescription_required: false,
    is_controlled_substance: false,
    storage_conditions: '',
    reorder_level: 0
  });
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'basic' | 'details' | 'pricing' | 'supplier'>('basic');

  const isViewMode = mode === 'view';
  const isEditMode = mode === 'edit';
  const isCreateMode = mode === 'create';
  const isEditing = isEditMode || isCreateMode;

  useEffect(() => {
    loadSuppliers();
    loadCategories();
    if (product) {
      setFormData({
        id: product.id,
        name: product.name || '',
        barcode: product.barcode?.toString() || '',
        price: parseFloat(product.price as any) || 0,
        cost_price: parseFloat(product.cost_price as any) || 0,
        category: product.category || '',
        quantity: product.quantity || 0,
        min_stock: product.min_stock ? parseInt(product.min_stock as any) : 0,
        expiration_date: product.expiration_date || '',
        description: product.description || '',
        supplier: product.supplier || '',
        supplier_id: product.supplier_id || undefined,
        manufacturer: product.manufacturer || '',
        prescription_required: !!product.prescription_required,
        is_controlled_substance: !!product.is_controlled_substance,
        storage_conditions: product.storage_conditions || '',
        reorder_level: product.reorder_level || 0
      });
    }
  }, [product]);

  const loadSuppliers = async (): Promise<void> => {
    try {
      const data = await supplierService.getSuppliers();
      setSuppliers(data);
    } catch (err) {
      console.error('Failed to load suppliers:', err);
    }
  };

// In the loadCategories function, update this line:
const loadCategories = async (): Promise<void> => {
  try {
    const products = await inventoryService.getProducts();
    const uniqueCategories = [...new Set(products.map((p: Product) => p.category).filter(Boolean))] as string[];
    setCategories(uniqueCategories);
  } catch (err) {
    console.error('Failed to load categories:', err);
  }
};

  const handleInputChange = (field: string, value: any): void => {
    if (isViewMode) return;
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }

    if (formData.price <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }

    if (formData.cost_price <= 0) {
      newErrors.cost_price = 'Cost price must be greater than 0';
    }

    if (formData.quantity < 0) {
      newErrors.quantity = 'Quantity cannot be negative';
    }

    if (formData.min_stock && formData.min_stock < 0) {
      newErrors.min_stock = 'Minimum stock cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      if (isEditMode) {
        await inventoryService.updateProduct(formData as UpdateProductRequest);
      } else if (isCreateMode) {
        await inventoryService.createProduct(formData as CreateProductRequest);
      }
      
      onSave();
      onClose();
    } catch (err: any) {
      alert(`Failed to ${isEditMode ? 'update' : 'create'} product: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const calculateProfitMargin = (): number => {
    const price = formData.price || 0;
    const cost = formData.cost_price || 0;
    if (price > 0 && cost > 0) {
      return ((price - cost) / price) * 100;
    }
    return 0;
  };

  const getStockStatus = (): { status: string; color: string; icon: React.ReactNode } => {
    const quantity = formData.quantity || 0;
    const minStock = formData.min_stock || 0;
    
    if (quantity <= 0) return { 
      status: 'Out of Stock', 
      color: '#dc2626', 
      icon: <AlertTriangle size={14} /> 
    };
    if (quantity <= minStock) return { 
      status: 'Low Stock', 
      color: '#f59e0b', 
      icon: <AlertTriangle size={14} /> 
    };
    return { 
      status: 'Adequate Stock', 
      color: '#10b981', 
      icon: <Package size={14} /> 
    };
  };

  const renderReadOnlyField = (label: string, value: any, format?: (val: any) => string): JSX.Element => (
    <div className="form-group">
      <label>{label}</label>
      <div className="read-only-value">
        {format ? format(value) : value || 'N/A'}
      </div>
    </div>
  );

  const renderInputField = (label: string, field: string, type: string = 'text', options?: any): JSX.Element => (
    <div className="form-group">
      <label htmlFor={field}>{label} {options?.required && '*'}</label>
      <input
        id={field}
        type={type}
        value={formData[field as keyof typeof formData] as any || ''}
        onChange={(e) => handleInputChange(field, type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
        className={errors[field] ? 'error' : ''}
        disabled={isViewMode}
        step={type === 'number' ? '0.01' : undefined}
        min={type === 'number' ? '0' : undefined}
        {...options}
      />
      {errors[field] && <span className="error-message">{errors[field]}</span>}
    </div>
  );

  const renderBasicInfoTab = (): JSX.Element => (
    <motion.div 
      className="form-section"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      {isViewMode ? (
        <>
          {renderReadOnlyField('Product Name', formData.name)}
          {renderReadOnlyField('Barcode', formData.barcode)}
          {renderReadOnlyField('Category', formData.category)}
          {renderReadOnlyField('Description', formData.description)}
        </>
      ) : (
        <>
          <div className="form-group with-icon">
            <Tag size={18} className="input-icon" />
            {renderInputField('Product Name', 'name', 'text', { required: true, placeholder: 'Enter product name' })}
          </div>

          <div className="form-group with-icon">
            <Barcode size={18} className="input-icon" />
            {renderInputField('Barcode', 'barcode', 'text', { placeholder: 'Scan or enter barcode' })}
          </div>

          <div className="form-group with-icon">
            <Warehouse size={18} className="input-icon" />
            <label htmlFor="category">Category *</label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className={errors.category ? 'error' : ''}
              disabled={isViewMode}
            >
              <option value="">Select a category</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            {errors.category && <span className="error-message">{errors.category}</span>}
          </div>

          <div className="form-group with-icon">
            <FileText size={18} className="input-icon" />
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              disabled={isViewMode}
              placeholder="Enter product description..."
            />
          </div>
        </>
      )}
    </motion.div>
  );

  const renderPricingTab = (): JSX.Element => {
    const stockStatus = getStockStatus();
    const profitMargin = calculateProfitMargin();
    
    return (
      <motion.div 
        className="form-section"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        {isViewMode ? (
          <>
            {renderReadOnlyField('Cost Price', formData.cost_price, (val) => `UGX ${val?.toLocaleString()}`)}
            {renderReadOnlyField('Selling Price', formData.price, (val) => `UGX ${val?.toLocaleString()}`)}
            <div className="profit-display">
              <BarChart3 size={16} />
              <strong>Profit Margin: </strong>
              <span className={`profit-margin ${profitMargin >= 0 ? 'positive' : 'negative'}`}>
                {profitMargin.toFixed(1)}%
              </span>
              <span className="profit-amount">
                (UGX {((formData.price || 0) - (formData.cost_price || 0)).toLocaleString()})
              </span>
            </div>
            {renderReadOnlyField('Current Quantity', formData.quantity)}
            {renderReadOnlyField('Minimum Stock Level', formData.min_stock)}
            {renderReadOnlyField('Reorder Level', formData.reorder_level)}
            <div className="form-group">
              <label>Stock Status</label>
              <div 
                className="stock-status-indicator"
                style={{ backgroundColor: stockStatus.color }}
              >
                {stockStatus.icon}
                {stockStatus.status}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="form-row">
              <div className="form-group with-icon">
                <DollarSign size={18} className="input-icon" />
                {renderInputField('Cost Price (UGX)', 'cost_price', 'number', { 
                  required: true,
                  placeholder: '0.00'
                })}
              </div>
              <div className="form-group with-icon">
                <DollarSign size={18} className="input-icon" />
                {renderInputField('Selling Price (UGX)', 'price', 'number', { 
                  required: true,
                  placeholder: '0.00'
                })}
              </div>
            </div>

            <motion.div 
              className="profit-display"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <BarChart3 size={18} />
              <div className="profit-info">
                <span className="profit-label">Profit Margin:</span>
                <span className={`profit-value ${profitMargin >= 0 ? 'positive' : 'negative'}`}>
                  {profitMargin.toFixed(1)}%
                </span>
                <span className="profit-amount">
                  UGX {((formData.price || 0) - (formData.cost_price || 0)).toLocaleString()}
                </span>
              </div>
            </motion.div>

            <div className="form-row">
              <div className="form-group with-icon">
                <Package size={18} className="input-icon" />
                {renderInputField('Current Quantity', 'quantity', 'number', { placeholder: '0' })}
              </div>
              <div className="form-group with-icon">
                <AlertTriangle size={18} className="input-icon" />
                {renderInputField('Min Stock Level', 'min_stock', 'number', { placeholder: '0' })}
              </div>
              <div className="form-group with-icon">
                <Settings size={18} className="input-icon" />
                {renderInputField('Reorder Level', 'reorder_level', 'number', { placeholder: '0' })}
              </div>
            </div>
          </>
        )}
      </motion.div>
    );
  };

  const renderSupplierTab = (): JSX.Element => (
    <motion.div 
      className="form-section"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      {isViewMode ? (
        <>
          {renderReadOnlyField('Supplier Name', formData.supplier)}
          {renderReadOnlyField('Manufacturer', formData.manufacturer)}
          {renderReadOnlyField('Supplier ID', formData.supplier_id)}
        </>
      ) : (
        <>
          <div className="form-group with-icon">
            <Truck size={18} className="input-icon" />
            <label htmlFor="supplier">Supplier Name</label>
            <input
              id="supplier"
              type="text"
              value={formData.supplier}
              onChange={(e) => handleInputChange('supplier', e.target.value)}
              list="supplier-list"
              disabled={isViewMode}
              placeholder="Enter supplier name"
            />
            <datalist id="supplier-list">
              {suppliers.map(supplier => (
                <option key={supplier.id} value={supplier.name} />
              ))}
            </datalist>
          </div>

          <div className="form-group with-icon">
            <Building size={18} className="input-icon" />
            <label htmlFor="supplier_id">Select from Existing Suppliers</label>
            <select
              id="supplier_id"
              value={formData.supplier_id || ''}
              onChange={(e) => {
                const supplierId = e.target.value ? parseInt(e.target.value) : undefined;
                const selectedSupplier = suppliers.find(s => s.id === supplierId);
                handleInputChange('supplier_id', supplierId);
                handleInputChange('supplier', selectedSupplier?.name || '');
              }}
              disabled={isViewMode}
            >
              <option value="">-- Select Supplier --</option>
              {suppliers.map(supplier => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group with-icon">
            <Building size={18} className="input-icon" />
            {renderInputField('Manufacturer', 'manufacturer', 'text', { placeholder: 'Enter manufacturer name' })}
          </div>
        </>
      )}
    </motion.div>
  );

  const renderDetailsTab = (): JSX.Element => (
    <motion.div 
      className="form-section"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      {isViewMode ? (
        <>
          {renderReadOnlyField('Expiration Date', formData.expiration_date, (val) => 
            val ? new Date(val).toLocaleDateString() : 'No expiry'
          )}
          {renderReadOnlyField('Prescription Required', formData.prescription_required ? 'Yes' : 'No')}
          {renderReadOnlyField('Controlled Substance', formData.is_controlled_substance ? 'Yes' : 'No')}
          {renderReadOnlyField('Storage Conditions', formData.storage_conditions)}
        </>
      ) : (
        <>
          <div className="form-group with-icon">
            <Calendar size={18} className="input-icon" />
            {renderInputField('Expiration Date', 'expiration_date', 'date')}
          </div>

          <div className="form-row">
            <div className="form-group checkbox-group with-icon">
              <Shield size={18} className="input-icon" />
              <label>
                <input
                  type="checkbox"
                  checked={!!formData.prescription_required}
                  onChange={(e) => handleInputChange('prescription_required', e.target.checked)}
                  disabled={isViewMode}
                />
                Prescription Required
              </label>
            </div>

            <div className="form-group checkbox-group with-icon">
              <Shield size={18} className="input-icon" />
              <label>
                <input
                  type="checkbox"
                  checked={!!formData.is_controlled_substance}
                  onChange={(e) => handleInputChange('is_controlled_substance', e.target.checked)}
                  disabled={isViewMode}
                />
                Controlled Substance
              </label>
            </div>
          </div>

          <div className="form-group with-icon">
            <Thermometer size={18} className="input-icon" />
            <label htmlFor="storage_conditions">Storage Conditions</label>
            <textarea
              id="storage_conditions"
              value={formData.storage_conditions}
              onChange={(e) => handleInputChange('storage_conditions', e.target.value)}
              rows={2}
              disabled={isViewMode}
              placeholder="e.g., Room temperature, Refrigerated, etc."
            />
          </div>
        </>
      )}
    </motion.div>
  );

  const getModalTitle = (): string => {
    switch (mode) {
      case 'view': return 'View Product';
      case 'edit': return 'Edit Product';
      case 'create': return 'Add New Product';
      default: return 'Product Details';
    }
  };

  const tabConfig = [
    { id: 'basic' as const, label: 'Basic Info', icon: Package },
    { id: 'pricing' as const, label: 'Pricing & Stock', icon: DollarSign },
    { id: 'supplier' as const, label: 'Supplier', icon: Truck },
    { id: 'details' as const, label: 'Details', icon: Settings }
  ];

  return (
    <AnimatePresence>
      <motion.div 
        className="modal-overlay"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <motion.div
          className="product-modal-content"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.3, type: "spring", damping: 25 }}
        >
          <div className="modal-header">
            <div className="header-content">
              <h2>{getModalTitle()}</h2>
              <p className="modal-subtitle">
                {mode === 'create' ? 'Add a new product to inventory' : 
                 mode === 'edit' ? 'Update product information' : 
                 'View product details'}
              </p>
            </div>
            <motion.button 
              className="close-button" 
              onClick={onClose}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X size={20} />
            </motion.button>
          </div>

          <div className="modal-tabs">
            {tabConfig.map((tab) => {
              const Icon = tab.icon;
              return (
                <motion.button
                  key={tab.id}
                  className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon size={16} />
                  {tab.label}
                </motion.button>
              );
            })}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <AnimatePresence mode="wait">
                {activeTab === 'basic' && renderBasicInfoTab()}
                {activeTab === 'pricing' && renderPricingTab()}
                {activeTab === 'supplier' && renderSupplierTab()}
                {activeTab === 'details' && renderDetailsTab()}
              </AnimatePresence>
            </div>

            <div className="modal-footer">
              {isViewMode ? (
                <>
                  <motion.button 
                    type="button" 
                    onClick={onClose} 
                    className="btn-secondary"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Close
                  </motion.button>
                  <motion.button 
                    type="button" 
                    onClick={() => {
                      const event = new CustomEvent('switchToEditMode', { detail: product });
                      window.dispatchEvent(event);
                    }} 
                    className="btn-primary"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Edit3 size={16} />
                    Edit Product
                  </motion.button>
                </>
              ) : (
                <>
                  <motion.button 
                    type="button" 
                    onClick={onClose} 
                    className="btn-secondary"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button 
                    type="submit" 
                    disabled={loading} 
                    className="btn-primary"
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                  >
                    {loading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Settings size={16} />
                      </motion.div>
                    ) : isEditMode ? (
                      <>
                        <Save size={16} />
                        Update Product
                      </>
                    ) : (
                      <>
                        <Plus size={16} />
                        Create Product
                      </>
                    )}
                  </motion.button>
                </>
              )}
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProductModal;