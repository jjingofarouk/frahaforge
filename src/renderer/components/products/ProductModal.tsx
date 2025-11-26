// src/renderer/src/components/products/ProductModal.tsx
import React, { useState, useEffect } from 'react';
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
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'basic' | 'details' | 'pricing' | 'supplier'>('basic');

  const isViewMode = mode === 'view';
  const isEditMode = mode === 'edit';
  const isCreateMode = mode === 'create';
  const isEditing = isEditMode || isCreateMode;

  useEffect(() => {
    loadSuppliers();
    if (product) {
      // Convert product to form data
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

  const handleInputChange = (field: string, value: any): void => {
    if (isViewMode) return; // Prevent changes in view mode
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
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

  const getStockStatus = (): { status: string; color: string } => {
    const quantity = formData.quantity || 0;
    const minStock = formData.min_stock || 0;
    
    if (quantity <= 0) return { status: 'Out of Stock', color: '#ff4444' };
    if (quantity <= minStock) return { status: 'Low Stock', color: '#ffaa00' };
    return { status: 'Adequate Stock', color: '#00c851' };
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
    <div className="form-section">
      {isViewMode ? (
        <>
          {renderReadOnlyField('Product Name', formData.name)}
          {renderReadOnlyField('Barcode', formData.barcode)}
          {renderReadOnlyField('Category', formData.category)}
          {renderReadOnlyField('Description', formData.description)}
        </>
      ) : (
        <>
          {renderInputField('Product Name', 'name', 'text', { required: true })}
          {renderInputField('Barcode', 'barcode')}
          {renderInputField('Category', 'category', 'text', { required: true, list: 'categories' })}
          <datalist id="categories">
            {[...new Set(suppliers.flatMap(s => s.name))].map(cat => (
              <option key={cat} value={cat} />
            ))}
          </datalist>
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              disabled={isViewMode}
            />
          </div>
        </>
      )}
    </div>
  );

  const renderPricingTab = (): JSX.Element => {
    const stockStatus = getStockStatus();
    
    return (
      <div className="form-section">
        {isViewMode ? (
          <>
            {renderReadOnlyField('Cost Price', formData.cost_price, (val) => `UGX ${val?.toLocaleString()}`)}
            {renderReadOnlyField('Selling Price', formData.price, (val) => `UGX ${val?.toLocaleString()}`)}
            <div className="profit-display">
              <strong>Profit Margin: </strong>
              <span className={`profit-margin ${calculateProfitMargin() >= 0 ? 'positive' : 'negative'}`}>
                {calculateProfitMargin().toFixed(1)}%
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
                {stockStatus.status}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="form-row">
              {renderInputField('Cost Price (UGX)', 'cost_price', 'number', { required: true })}
              {renderInputField('Selling Price (UGX)', 'price', 'number', { required: true })}
            </div>

            <div className="profit-display">
              <strong>Profit Margin: </strong>
              <span className={`profit-margin ${calculateProfitMargin() >= 0 ? 'positive' : 'negative'}`}>
                {calculateProfitMargin().toFixed(1)}%
              </span>
              <span className="profit-amount">
                (UGX {((formData.price || 0) - (formData.cost_price || 0)).toLocaleString()})
              </span>
            </div>

            <div className="form-row">
              {renderInputField('Current Quantity', 'quantity', 'number')}
              {renderInputField('Minimum Stock Level', 'min_stock', 'number')}
              {renderInputField('Reorder Level', 'reorder_level', 'number')}
            </div>
          </>
        )}
      </div>
    );
  };

  const renderSupplierTab = (): JSX.Element => (
    <div className="form-section">
      {isViewMode ? (
        <>
          {renderReadOnlyField('Supplier Name', formData.supplier)}
          {renderReadOnlyField('Manufacturer', formData.manufacturer)}
          {renderReadOnlyField('Supplier ID', formData.supplier_id)}
        </>
      ) : (
        <>
          <div className="form-group">
            <label htmlFor="supplier">Supplier Name</label>
            <input
              id="supplier"
              type="text"
              value={formData.supplier}
              onChange={(e) => handleInputChange('supplier', e.target.value)}
              list="supplier-list"
              disabled={isViewMode}
            />
            <datalist id="supplier-list">
              {suppliers.map(supplier => (
                <option key={supplier.id} value={supplier.name} />
              ))}
            </datalist>
          </div>

          <div className="form-group">
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

          {renderInputField('Manufacturer', 'manufacturer')}
        </>
      )}
    </div>
  );

  const renderDetailsTab = (): JSX.Element => (
    <div className="form-section">
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
          {renderInputField('Expiration Date', 'expiration_date', 'date')}

          <div className="form-row">
            <div className="form-group checkbox-group">
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

            <div className="form-group checkbox-group">
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

          {renderInputField('Storage Conditions', 'storage_conditions')}
        </>
      )}
    </div>
  );

  const getModalTitle = (): string => {
    switch (mode) {
      case 'view': return 'View Product';
      case 'edit': return 'Edit Product';
      case 'create': return 'Add New Product';
      default: return 'Product Details';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="product-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{getModalTitle()}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-tabs">
          <button 
            className={`tab-button ${activeTab === 'basic' ? 'active' : ''}`}
            onClick={() => setActiveTab('basic')}
          >
            Basic Info
          </button>
          <button 
            className={`tab-button ${activeTab === 'pricing' ? 'active' : ''}`}
            onClick={() => setActiveTab('pricing')}
          >
            Pricing & Stock
          </button>
          <button 
            className={`tab-button ${activeTab === 'supplier' ? 'active' : ''}`}
            onClick={() => setActiveTab('supplier')}
          >
            Supplier
          </button>
          <button 
            className={`tab-button ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            Details
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {activeTab === 'basic' && renderBasicInfoTab()}
            {activeTab === 'pricing' && renderPricingTab()}
            {activeTab === 'supplier' && renderSupplierTab()}
            {activeTab === 'details' && renderDetailsTab()}
          </div>

          <div className="modal-footer">
            {isViewMode ? (
              <>
                <button type="button" onClick={onClose} className="btn-secondary">
                  Close
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    // Switch to edit mode
                    const event = new CustomEvent('switchToEditMode', { detail: product });
                    window.dispatchEvent(event);
                  }} 
                  className="btn-primary"
                >
                  Edit Product
                </button>
              </>
            ) : (
              <>
                <button type="button" onClick={onClose} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? 'Saving...' : (isEditMode ? 'Update Product' : 'Create Product')}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;