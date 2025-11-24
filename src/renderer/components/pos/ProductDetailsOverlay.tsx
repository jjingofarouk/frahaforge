// src/renderer/src/components/pos/ProductDetailsOverlay.tsx
import React, { useMemo } from 'react';
import { motion, AnimatePresence, Variants, Transition } from 'framer-motion';
import { X, Package, Calendar, Tag, BarChart3, FileText, Truck, AlertTriangle, Shield, Thermometer, Pill, ShoppingCart } from 'lucide-react';
import { Product, Category } from '../../src/types/pos.types';
import './ProductDetailsOverlay.css';

interface ProductDetailsOverlayProps {
  product: Product | null;
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
}

// Helper function to get local image path - FIXED to use id
// Helper function to get local image path - FIXED to use id
const getLocalImagePath = (product: Product): string => {
  if (!product) {
    console.warn('Product is undefined in getLocalImagePath');
    const backendUrl = window.electron?.backend?.getBackendUrl?.() || 'http://192.168.1.3:3000';
    return `${backendUrl}/assets/product-images/default-product.jpg`;
  }
  
  // FIXED: Use product.id instead of product.id
  const productId = product.id?.toString();
  
  if (!productId) {
    console.warn('Product missing id:', product);
    const backendUrl = window.electron?.backend?.getBackendUrl?.() || 'http://192.168.1.3:3000';
    return `${backendUrl}/assets/product-images/default-product.jpg`;
  }
  
  const sanitizedName = product.name
    ?.replace(/[^a-zA-Z0-9\s\-_]/g, '')
    ?.replace(/\s+/g, '_')
    ?.substring(0, 50) || 'unknown_product';

  const backendUrl = window.electron?.backend?.getBackendUrl?.() || 'http://192.168.1.3:3000';
  return `${backendUrl}/assets/product-images/${productId}_${sanitizedName}.jpg`;
};

// Helper function to handle image errors
const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>, product: Product) => {
  const target = e.target as HTMLImageElement;
  
  if (product.img && product.img.startsWith('http')) {
    console.log(`Falling back to original URL for product ${product.id}`);
    target.src = product.img;
  } else {
    target.style.display = 'none';
    const placeholder = target.nextElementSibling as HTMLElement;
    if (placeholder && placeholder.classList.contains('pos-details-img-placeholder')) {
      placeholder.style.display = 'flex';
    }
  }
};

// Animation variants with proper typing
const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
};

const panelTransition: Transition = {
  type: "spring",
  damping: 25,
  stiffness: 400,
  duration: 0.4
};

const panelVariants: Variants = {
  hidden: { 
    x: '100%', 
    opacity: 0,
    scale: 0.95
  },
  visible: { 
    x: 0, 
    opacity: 1,
    scale: 1,
    transition: panelTransition
  },
  exit: { 
    x: '100%', 
    opacity: 0,
    scale: 0.95,
    transition: {
      type: "spring",
      damping: 25,
      stiffness: 300,
      duration: 0.3
    }
  }
};

const contentVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      delay: 0.1,
      duration: 0.3
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: 0.1 + i * 0.05,
      duration: 0.3
    }
  })
};

const ProductDetailsOverlay: React.FC<ProductDetailsOverlayProps> = React.memo(({
  product,
  categories,
  isOpen,
  onClose,
  onAddToCart,
}) => {
  if (!product) return null;

  const getCategoryName = useMemo(() => (categoryId: string) => {
    const category = categories.find(cat => {
      const catId = cat?.id?.toString();
      return catId === categoryId;
    });
    return category ? category.name : 'Unknown Category';
  }, [categories]);

  const expiryStatus = useMemo(() => {
    if (!product.expirationDate || product.expirationDate.trim() === '') return null;
    
    try {
      const expDate = new Date(product.expirationDate);
      const now = new Date();
      const isExpired = expDate < now;
      const isExpiringSoon = expDate < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      return { isExpired, isExpiringSoon };
    } catch (error) {
      console.warn('Invalid expiration date:', product.expirationDate);
      return null;
    }
  }, [product.expirationDate]);

  const handleAddClick = () => {
    onAddToCart(product);
    onClose();
  };

  const localImagePath = getLocalImagePath(product);

  // Safe number parsing helper
  const safeParseFloat = (value: string | number | undefined | null): number => {
    if (!value && value !== 0) return 0;
    const cleanValue = value.toString().replace(/,/g, '').trim();
    const parsed = parseFloat(cleanValue);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Calculate profit margin safely
  const calculateProfit = () => {
    const price = safeParseFloat(product.price);
    const cost = safeParseFloat(product.costPrice);
    
    if (price === 0 && cost === 0) return null;
    
    const profit = price - cost;
    const margin = cost > 0 ? (profit / cost) * 100 : 0;
    
    return {
      amount: profit,
      margin: margin
    };
  };

  const profitData = calculateProfit();

  // Calculate days until expiration
  const getDaysUntilExpiry = () => {
    if (!product.expirationDate || product.expirationDate.trim() === '') return null;
    
    try {
      const expDate = new Date(product.expirationDate);
      const now = new Date();
      const diffTime = expDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch (error) {
      return null;
    }
  };

  const daysUntilExpiry = getDaysUntilExpiry();

  // Calculate stock value
  const stockValue = (safeParseFloat(product.price) || 0) * (product.quantity || 0);
  
  // Calculate cost value
  const costValue = (safeParseFloat(product.costPrice) || 0) * (product.quantity || 0);

  // Define detail fields to render
  const detailFields = useMemo(() => {
    const fields = [
      product.supplier && { field: 'supplier', label: 'Supplier', icon: Truck },
      product.manufacturer && { field: 'manufacturer', label: 'Manufacturer', icon: Shield },
      product.batchNumber && { field: 'batchNumber', label: 'Batch Number', icon: FileText },
      product.drugClass && { field: 'drugClass', label: 'Drug Class', icon: Pill },
      product.dosageForm && { field: 'dosageForm', label: 'Dosage Form', icon: Pill },
      product.strength && { field: 'strength', label: 'Strength', icon: Pill },
      product.activeIngredients && { field: 'activeIngredients', label: 'Active Ingredients', icon: Pill },
      product.storageConditions && { field: 'storageConditions', label: 'Storage Conditions', icon: Thermometer },
      product.sideEffects && { field: 'sideEffects', label: 'Side Effects', icon: AlertTriangle },
      product.prescriptionRequired !== undefined && { 
        field: 'prescriptionRequired', 
        label: 'Prescription Required', 
        icon: AlertTriangle 
      },
      product.isControlledSubstance !== undefined && { 
        field: 'isControlledSubstance', 
        label: 'Controlled Substance', 
        icon: AlertTriangle 
      },
      product.requiresRefrigeration !== undefined && { 
        field: 'requiresRefrigeration', 
        label: 'Requires Refrigeration', 
        icon: Thermometer 
      },
      product.minStock && { field: 'minStock', label: 'Minimum Stock Level', icon: AlertTriangle },
      product.reorderLevel && { field: 'reorderLevel', label: 'Reorder Level', icon: AlertTriangle },
      product.lastRestocked && { field: 'lastRestocked', label: 'Last Restocked', icon: Calendar },
      product.taxRate && { field: 'taxRate', label: 'Tax Rate', icon: BarChart3 },
      product.salesCount !== undefined && { field: 'salesCount', label: 'Sales Count', icon: BarChart3 }
    ].filter(Boolean) as Array<{ field: string; label: string; icon: React.ComponentType<any> }>;

    return fields;
  }, [product]);

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="pos-details-backdrop"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />

          {/* Side Panel */}
          <motion.div
            className="pos-details-overlay"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Header */}
            <motion.div 
              className="pos-details-header"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h3>Product Details</h3>
              <div className="pos-details-header-actions">
                <motion.button 
                  className="pos-details-close-btn" 
                  onClick={onClose}
                  aria-label="Close"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X size={24} />
                </motion.button>
              </div>
            </motion.div>

            {/* Content - Scrollable */}
            <motion.div 
              className="pos-details-content"
              variants={contentVariants}
              initial="hidden"
              animate="visible"
            >
              {/* Product Image */}
              <motion.div 
                className="pos-details-image-section"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <div className="pos-details-image-large">
                  <img
                    src={localImagePath}
                    alt={product.name}
                    className="pos-details-img"
                    onError={(e) => handleImageError(e, product)}
                    loading="lazy"
                  />
                  {/* Fallback placeholder (hidden by default) */}
                  <div className="pos-details-img-placeholder" style={{ display: 'none' }}>
                    <Package size={48} />
                    <span>No Image</span>
                  </div>
                </div>
              </motion.div>

              {/* Product Name */}
              <motion.h2 
                className="pos-details-product-name"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                {product.name}
              </motion.h2>

              {/* Full Description */}
              {product.description && product.description.trim() !== '' && (
                <motion.div 
                  className="pos-details-description-section"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <h4 className="pos-details-section-title">Description</h4>
                  <p className="pos-details-description">
                    {product.description}
                  </p>
                </motion.div>
              )}

              {/* Details Grid */}
              <div className="pos-details-grid">
                {/* Category */}
                <motion.div 
                  className="pos-details-item"
                  custom={0}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <div className="pos-details-icon">
                    <Tag size={18} />
                  </div>
                  <div className="pos-details-content-wrapper">
                    <span className="pos-details-label">Category</span>
                    <span className="pos-details-value">{getCategoryName(product.category)}</span>
                  </div>
                </motion.div>

                {/* Stock Status */}
                <motion.div 
                  className="pos-details-item"
                  custom={1}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <div className="pos-details-icon">
                    <BarChart3 size={18} />
                  </div>
                  <div className="pos-details-content-wrapper">
                    <span className="pos-details-label">Stock Status</span>
                    <span className={`pos-details-value pos-stock-status ${
                      product.quantity > 10 ? 'in-stock' : 
                      product.quantity > 0 ? 'low-stock' : 'out-of-stock'
                    }`}>
                      {product.quantity > 10 ? 'In Stock' : 
                       product.quantity > 0 ? 'Low Stock' : 'Out of Stock'}
                      <span className="stock-quantity"> ({product.quantity} units)</span>
                    </span>
                  </div>
                </motion.div>

                {/* Quantity Available */}
                <motion.div 
                  className="pos-details-item"
                  custom={2}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <div className="pos-details-icon">
                    <Package size={18} />
                  </div>
                  <div className="pos-details-content-wrapper">
                    <span className="pos-details-label">Quantity Available</span>
                    <span className="pos-details-value">{product.quantity} units</span>
                  </div>
                </motion.div>

                {/* Expiration Date */}
                {product.expirationDate && product.expirationDate.trim() !== '' && (
                  <motion.div 
                    className="pos-details-item"
                    custom={3}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <div className="pos-details-icon">
                      <Calendar size={18} />
                    </div>
                    <div className="pos-details-content-wrapper">
                      <span className="pos-details-label">Expiration Date</span>
                      <span className={`pos-details-value ${
                        expiryStatus?.isExpired ? 'expired' : 
                        expiryStatus?.isExpiringSoon ? 'expiring-soon' : 'valid'
                      }`}>
                        {new Date(product.expirationDate).toLocaleDateString()}
                        {expiryStatus?.isExpired && (
                          <span className="expiry-badge expired"> (Expired)</span>
                        )}
                        {expiryStatus?.isExpiringSoon && !expiryStatus?.isExpired && (
                          <span className="expiry-badge expiring-soon">
                            {daysUntilExpiry && ` (${daysUntilExpiry} days)`}
                          </span>
                        )}
                        {!expiryStatus?.isExpired && !expiryStatus?.isExpiringSoon && daysUntilExpiry && (
                          <span className="expiry-badge valid"> ({daysUntilExpiry} days remaining)</span>
                        )}
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* Cost Price */}
                {product.costPrice && (
                  <motion.div 
                    className="pos-details-item"
                    custom={4}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <div className="pos-details-icon">
                      <FileText size={18} />
                    </div>
                    <div className="pos-details-content-wrapper">
                      <span className="pos-details-label">Cost Price</span>
                      <span className="pos-details-value">UGX {safeParseFloat(product.costPrice).toLocaleString()}</span>
                    </div>
                  </motion.div>
                )}

                {/* Profit Calculation */}
                {product.costPrice && product.price && profitData && (
                  <motion.div 
                    className="pos-details-item"
                    custom={5}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <div className="pos-details-icon">
                      <BarChart3 size={18} />
                    </div>
                    <div className="pos-details-content-wrapper">
                      <span className="pos-details-label">Profit Margin</span>
                      <span className="pos-details-value profit-margin">
                        UGX {profitData.amount.toLocaleString()}
                        {` (${profitData.margin.toFixed(1)}%)`}
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* Additional details with staggered animation */}
                {detailFields.map(({ field, label, icon: Icon }, index) => (
                  <motion.div 
                    key={field}
                    className="pos-details-item"
                    custom={6 + index}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <div className="pos-details-icon">
                      <Icon size={18} />
                    </div>
                    <div className="pos-details-content-wrapper">
                      <span className="pos-details-label">{label}</span>
                      <span className="pos-details-value">
                        {field === 'prescriptionRequired' && (product.prescriptionRequired ? 'Yes' : 'No')}
                        {field === 'isControlledSubstance' && (product.isControlledSubstance ? 'Yes' : 'No')}
                        {field === 'requiresRefrigeration' && (product.requiresRefrigeration ? 'Yes' : 'No')}
                        {field === 'minStock' && `${product.minStock} units`}
                        {field === 'reorderLevel' && `${product.reorderLevel} units`}
                        {field === 'lastRestocked' && new Date(product.lastRestocked!).toLocaleDateString()}
                        {field === 'taxRate' && `${product.taxRate}%`}
                        {field === 'salesCount' && `${product.salesCount} units sold`}
                        {![
                          'prescriptionRequired', 
                          'isControlledSubstance', 
                          'requiresRefrigeration',
                          'minStock',
                          'reorderLevel', 
                          'lastRestocked',
                          'taxRate',
                          'salesCount'
                        ].includes(field) && product[field as keyof Product] as string}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Footer - Action Section */}
            <motion.div 
              className="pos-details-footer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="pos-details-price-section">
                <span className="pos-details-price-label">Selling Price</span>
                <span className="pos-details-price-large">UGX {safeParseFloat(product.price).toLocaleString()}</span>
              </div>
              
              <div className="pos-details-footer-actions">
                <motion.button
                  className={`pos-details-add-btn ${product.quantity <= 0 ? 'disabled' : ''}`}
                  onClick={handleAddClick}
                  disabled={product.quantity <= 0}
                  whileHover={product.quantity > 0 ? { scale: 1.02, y: -1 } : {}}
                  whileTap={product.quantity > 0 ? { scale: 0.98 } : {}}
                >
                  <ShoppingCart size={20} />
                  <span>Add to Cart</span>
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

ProductDetailsOverlay.displayName = 'ProductDetailsOverlay';

export default ProductDetailsOverlay;