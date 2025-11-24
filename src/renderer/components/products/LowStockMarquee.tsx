import { useState, useEffect } from 'react';
import Marquee from 'react-fast-marquee';
import { AlertTriangle, CheckCircle, ThumbsUp, Flame, AlertCircle, Package, TrendingUp } from 'lucide-react';
import './LowStockMarquee.css';

interface ProductPerformance {
  id: number | string;
  name: string;
  available: number;
  category: string;
  sku?: string;
  sold?: number;
  sales?: number;
  cost_price?: number;
  expirationDate?: string;
}

interface LowStockMarqueeProps {
  products: ProductPerformance[];
}

type HeaderStatus = 'healthy' | 'low' | 'warning' | 'critical';

const LowStockMarquee: React.FC<LowStockMarqueeProps> = ({ products }) => {
  const [lowStockProducts, setLowStockProducts] = useState<ProductPerformance[]>([]);
  const [healthyProducts, setHealthyProducts] = useState<ProductPerformance[]>([]);
  const [displayMode, setDisplayMode] = useState<'all' | 'low-stock' | 'healthy'>('all');

  useEffect(() => {
    // Filter low stock products (quantity < 10)
    const lowStock = products
      .filter(product => product.available < 10)
      .sort((a, b) => a.available - b.available);

    // Filter healthy products (quantity >= 10)
    const healthy = products
      .filter(product => product.available >= 10)
      .sort((a, b) => b.available - a.available);

    setLowStockProducts(lowStock);
    setHealthyProducts(healthy);
  }, [products]);

  const getStockStatus = (product: ProductPerformance): string => {
    if (product.available === 0) return 'OUT OF STOCK';
    if (product.available <= 3) return 'CRITICAL';
    if (product.available <= 6) return 'LOW';
    if (product.available <= 9) return 'WARNING';
    return 'HEALTHY';
  };

  const getStockClass = (product: ProductPerformance): string => {
    if (product.available === 0) return 'stock-out';
    if (product.available <= 3) return 'stock-critical';
    if (product.available <= 6) return 'stock-low';
    if (product.available <= 9) return 'stock-warning';
    return 'stock-healthy';
  };

  const getHeaderStatus = (): HeaderStatus => {
    if (lowStockProducts.length === 0) return 'healthy';
    if (lowStockProducts.some(p => p.available === 0)) return 'critical';
    if (lowStockProducts.some(p => p.available <= 3)) return 'warning';
    return 'low';
  };

  const getDisplayProducts = (): ProductPerformance[] => {
    switch (displayMode) {
      case 'low-stock':
        return lowStockProducts;
      case 'healthy':
        return healthyProducts;
      default:
        return [...lowStockProducts, ...healthyProducts];
    }
  };

  const getStatusGradient = (): string => {
    const status = getHeaderStatus();
    const gradients: Record<HeaderStatus, string> = {
      healthy: 'linear-gradient(135deg, var(--success) 0%, #15803d 100%)',
      low: 'linear-gradient(135deg, var(--warning) 0%, #b45309 100%)',
      warning: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
      critical: 'linear-gradient(135deg, var(--danger) 0%, #991b1b 100%)'
    };
    return gradients[status];
  };

  const getStatusIcon = (): React.ReactElement => {
    const status = getHeaderStatus();
    const icons: Record<HeaderStatus, React.ReactElement> = {
      healthy: <ThumbsUp size={18} />,
      low: <AlertTriangle size={18} />,
      warning: <AlertCircle size={18} />,
      critical: <Flame size={18} />
    };
    return icons[status];
  };

  const getHeaderMessage = (): React.ReactElement => {
    const status = getHeaderStatus();
    const lowStockCount = lowStockProducts.length;
    const totalCount = products.length;

    const messages: Record<HeaderStatus, React.ReactElement> = {
      healthy: (
        <span className="header-message-content">
          <CheckCircle size={16} className="header-message-icon" />
          All Products Stocked - {totalCount} Items Healthy
        </span>
      ),
      low: (
        <span className="header-message-content">
          <AlertTriangle size={16} className="header-message-icon" />
          {lowStockCount} Low Stock Items - {totalCount} Total Products
        </span>
      ),
      warning: (
        <span className="header-message-content">
          <AlertCircle size={16} className="header-message-icon" />
          {lowStockCount} Low Stock Items - {totalCount} Total Products
        </span>
      ),
      critical: (
        <span className="header-message-content">
          <Flame size={16} className="header-message-icon" />
          {lowStockCount} Low Stock Items - {totalCount} Total Products
        </span>
      )
    };
    return messages[status];
  };

  const getStockIcon = (product: ProductPerformance): React.ReactElement => {
    const status = getStockStatus(product);
    const icons = {
      'OUT OF STOCK': <Flame size={14} />,
      'CRITICAL': <AlertCircle size={14} />,
      'LOW': <AlertTriangle size={14} />,
      'WARNING': <AlertTriangle size={14} />,
      'HEALTHY': <CheckCircle size={14} />
    };
    return icons[status as keyof typeof icons] || <Package size={14} />;
  };

  return (
    <div className="low-stock-marquee">
      {/* Status Header Bar */}
      <div 
        className="marquee-header"
        style={{ background: getStatusGradient() }}
      >
        <div className="header-content">
          <div className="header-icon">
            {getStatusIcon()}
          </div>
          <div className="header-info">
            <h3 className="header-title">Stock Overview</h3>
            <div className="header-message">
              {getHeaderMessage()}
            </div>
          </div>
        </div>
        
        <div className="display-controls">
          <button 
            className={`control-btn ${displayMode === 'all' ? 'active' : ''}`}
            onClick={() => setDisplayMode('all')}
          >
            All ({products.length})
          </button>
          <button 
            className={`control-btn ${displayMode === 'low-stock' ? 'active' : ''}`}
            onClick={() => setDisplayMode('low-stock')}
          >
            Low Stock ({lowStockProducts.length})
          </button>
          <button 
            className={`control-btn ${displayMode === 'healthy' ? 'active' : ''}`}
            onClick={() => setDisplayMode('healthy')}
          >
            Healthy ({healthyProducts.length})
          </button>
        </div>
      </div>

      {/* Marquee Content */}
      <div className="marquee-content">
        {getDisplayProducts().length > 0 ? (
          <Marquee speed={40} gradient={false} pauseOnHover>
            {getDisplayProducts().map((product, index) => (
              <div key={product.id} className="stock-item">
                <div className="stock-item-content">
                  <span className="product-name">{product.name}</span>
                  <span className={`stock-badge ${getStockClass(product)}`}>
                    <span className="stock-badge-icon">
                      {getStockIcon(product)}
                    </span>
                    {getStockStatus(product)}
                  </span>
                  <span className="stock-count">
                    {product.available} {product.available === 1 ? 'unit' : 'units'}
                  </span>
                  <span className="product-category">{product.category}</span>
                </div>
                {index < getDisplayProducts().length - 1 && (
                  <span className="separator">•</span>
                )}
              </div>
            ))}
          </Marquee>
        ) : (
          <div className="no-products-message">
            <div className="no-products-content">
              <ThumbsUp size={20} className="no-products-icon" />
              <span>No low stock products! All items are properly stocked.</span>
            </div>
          </div>
        )}
      </div>

      {/* Summary Bar */}
      <div className="summary-bar">
        <div className="summary-item">
          <Package size={14} className="summary-icon" />
          <span className="summary-label">Total:</span>
          <span className="summary-value">{products.length}</span>
        </div>
        <div className="summary-item">
          <CheckCircle size={14} className="summary-icon healthy" />
          <span className="summary-label healthy">Healthy:</span>
          <span className="summary-value">{healthyProducts.length}</span>
        </div>
        <div className="summary-item">
          <AlertTriangle size={14} className="summary-icon warning" />
          <span className="summary-label warning">Low Stock:</span>
          <span className="summary-value">{lowStockProducts.length}</span>
        </div>
        {lowStockProducts.some(p => p.available === 0) && (
          <div className="summary-item">
            <Flame size={14} className="summary-icon critical" />
            <span className="summary-label critical">Out of Stock:</span>
            <span className="summary-value">
              {lowStockProducts.filter(p => p.available === 0).length}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default LowStockMarquee;