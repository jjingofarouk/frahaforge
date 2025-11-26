// src/renderer/src/App.tsx
import React, { useState, useEffect } from 'react';
import { CheckCircle, User as UserIcon, Database, Clock, Shield } from 'lucide-react';
import SplashScreen from './renderer/components/SplashScreen';
import Login from './renderer/components/Login';
import Navigation from './renderer/components/Navigation';
import TransactionsView from './renderer/components/transactions/TransactionsView';
import PosView from './renderer/components/pos/PosView';
import ProductsPage from './renderer/components/products/ProductsPage';
import OrdersPage from './renderer/components/orders/OrdersPage';
import CustomersPage from './renderer/components/customers/CustomersPage';
import AccountingPage from './renderer/components/accounting/AccountingPage';
import UsersPage from './renderer/components/users/UsersPage';
import AboutPage from './renderer/components/about/AboutPage';
import PaymentModal from './renderer/components/modals/PaymentModal';
import NewCustomer from './renderer/components/modals/NewCustomer';
import CategoriesModal from './renderer/components/modals/CategoriesModal';
import UserModal from './renderer/components/modals/UserModal';
import SettingsModal from './renderer/components/modals/SettingsModal';
import HoldOrdersModal from './renderer/components/modals/HoldOrdersModal';
import { User } from './renderer/types/user.types';
import authService from './renderer/services/authService';
import { cacheManager } from './renderer/src/utils/cacheManager';
import { Product } from './renderer/types/products.types';
import { getInventoryProducts } from './renderer/services/api';
import { CartItem, PaymentData, Customer } from './renderer/src/types/pos.types';
import { GlobalPosDataManager } from './renderer/components/pos/GlobalPosDataManager';
import { RefreshIndicator } from './renderer/components/pos/RefreshIndicator';
import { canAccessModule } from './renderer/services/api';
import SuppliersDashboard from './renderer/components/suppliers/SuppliersDashboard';
import { usePosStore } from './renderer/src/stores/posStore';
import { Order } from './renderer/types/orders.types';

import './App.css';

// CartData interface
interface CartData {
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  discount: number;
  customer?: string;
  customerData?: Customer;
}

// UPDATED AppView type - added 'about'
type AppView =
  | 'pos'
  | 'transactions'
  | 'products'
  | 'orders'
  | 'customers'
  | 'accounting'
  | 'users'
  | 'suppliers'
  | 'about';

const App: React.FC = () => {
  const [appState, setAppState] = useState<'splash' | 'login' | 'main'>('splash');
  const [user, setUser] = useState<User | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [activeView, setActiveView] = useState<AppView>('pos');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isUserOpen, setIsUserOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isHoldOrdersOpen, setIsHoldOrdersOpen] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [cartData, setCartData] = useState<CartData>({
    items: [], subtotal: 0, tax: 0, total: 0, discount: 0, customer: undefined, customerData: undefined
  });
  const [outOfStockCount, setOutOfStockCount] = useState(0);
  const [notificationCount] = useState(3);
  const [categories, setCategories] = useState<any[]>([]);
  const [authError, setAuthError] = useState<string>('');
  const [sessionRestored, setSessionRestored] = useState(false);
  const [sessionDebugInfo, setSessionDebugInfo] = useState<string>('Checking session...');
  const [showSessionToast, setShowSessionToast] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [showSystemStatus, setShowSystemStatus] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

  // POS Store for cart operations
  const { setCart, setSelectedCustomer } = usePosStore();

  // Cache management
  useEffect(() => {
    cacheManager.startCacheManagement();
    return () => cacheManager.stopCacheManagement();
  }, []);

  // Check auth
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setIsCheckingAuth(true);
        setAuthError('');
        const sessionCheck = await authService.checkExistingSession();
        if (sessionCheck.auth && sessionCheck.user) {
          setUser(sessionCheck.user);
          setSessionRestored(true);
          setShowSessionToast(true);
          setSessionDebugInfo(`Session restored: ${sessionCheck.user.fullname}`);
          await Promise.all([fetchProducts(), fetchCategories()]);
          setAppState('main');
        } else {
          setSessionDebugInfo('No session found');
          setAppState('login');
        }
      } catch (error) {
        console.error('App init failed:', error);
        setAuthError('Failed to initialize');
        setSessionDebugInfo(`Init error: ${error}`);
        setAppState('login');
      } finally {
        setIsCheckingAuth(false);
      }
    };
    initializeApp();
  }, []);

  useEffect(() => {
    if (showSessionToast) {
      const timer = setTimeout(() => setShowSessionToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showSessionToast]);

  useEffect(() => {
    if (user && appState === 'main') {
      setShowSystemStatus(true);
      const timer = setTimeout(() => setShowSystemStatus(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [user, appState]);

  useEffect(() => {
    if (appState === 'main' && user) {
      const intervalId = setInterval(fetchProducts, 30000);
      return () => clearInterval(intervalId);
    }
  }, [appState, user]);

  const fetchProducts = async () => {
    if (!user) return;
    setProductsLoading(true);
    try {
      const response = await getInventoryProducts();
      const productsData = response.data;
      const normalizedProducts: Product[] = productsData.map((p: any) => ({
        ...p,
        id: typeof p.id === 'string' ? parseInt(p.id) : p.id,
      }));
      setProducts(normalizedProducts);
      const outOfStock = normalizedProducts.filter((p: Product) => p.quantity === 0).length;
      setOutOfStockCount(outOfStock);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setProductsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      // Replace with real API
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleLoginSuccess = async (userData: User) => {
    setUser(userData);
    setAuthError('');
    setSessionRestored(false);
    setSessionDebugInfo(`New login: ${userData.fullname}`);
    await Promise.all([fetchProducts(), fetchCategories()]);
    setAppState('main');
  };

  const handleLoginError = (error: string) => {
    setAuthError(error);
    setSessionDebugInfo(`Login error: ${error}`);
  };

  const handleLogout = async () => {
    try {
      const result = await authService.logout();
      if (result.success) {
        setUser(null);
        setAuthError('');
        setSessionRestored(false);
        setSessionDebugInfo('User logged out');
        setCartData({ items: [], subtotal: 0, tax: 0, total: 0, discount: 0, customer: undefined, customerData: undefined });
        setProducts([]);
        setCategories([]);
        setAppState('login');
        setActiveView('pos');
      }
    } catch (error: any) {
      console.error('Logout error:', error);
      setUser(null);
      setAppState('login');
    }
  };

  const handleSwitchView = (view: AppView) => {
    if (user && !canAccessModule(user, view)) {
      alert('You do not have permission to access this module');
      return;
    }
    setActiveView(view);
  };

  const handlePaymentComplete = async (paymentData: PaymentData) => {
    setCartData({ items: [], subtotal: 0, tax: 0, total: 0, discount: 0, customer: undefined, customerData: undefined });
    await fetchProducts();
  };

  const handleNewCustomerCreated = () => {
    setIsNewCustomerOpen(false);
  };

  const handleOpenCategories = () => {
    if (user && !canAccessModule(user, 'categories')) {
      alert('You do not have permission to manage categories');
      return;
    }
    setIsCategoriesOpen(true);
  };

  const handleOpenUsers = () => {
    if (user && !canAccessModule(user, 'users')) {
      alert('You do not have permission to manage users');
      return;
    }
    setActiveView('users');
  };

  const handleOpenUser = () => setIsUserOpen(true);
  const handleOpenSettings = () => {
    if (user && !canAccessModule(user, 'settings')) {
      alert('You do not have permission to access settings');
      return;
    }
    setIsSettingsOpen(true);
  };
  const handleOpenNewCustomer = () => setIsNewCustomerOpen(true);
  const handleOpenNotifications = () => console.log('Open notifications');

  // Handle processing held orders - load into POS cart
  const handleProcessOrder = (order: Order) => {
    console.log('🔄 Processing held order:', order);
    
    // Convert order items to cart items
    const cartItems: CartItem[] = order.items.map(item => ({
      id: item.id,
      product_name: item.product_name,
      price: parseFloat(item.price || '0'),
      quantity: item.quantity,
      barcode: item.barcode || 0,
      quantityInStock: item.quantityInStock || 0,
      category: item.category || 'Uncategorized',
      img: '',
      description: ''
    }));

    // Set the cart with the order items
    setCart(cartItems);
    
    // Set the customer if available
    if (typeof order.customer === 'object' && order.customer !== null) {
      const customer = order.customer as Customer;
      setSelectedCustomer(customer.id.toString());
    }

    // Switch to POS view
    setActiveView('pos');
    
    console.log('✅ Order loaded into POS cart:', {
      items: cartItems.length,
      customer: order.customer
    });

    alert(`Order #${order.order} loaded into POS. You can now make changes and process payment.`);
  };

  const renderContent = () => {
    switch (appState) {
      case 'splash':
        return <SplashScreen onComplete={() => {}} authCheckComplete={!isCheckingAuth} authError={authError} />;
      case 'login':
        return (
          <div>
            <Login onLoginSuccess={handleLoginSuccess} onLoginError={handleLoginError} />
            {process.env.NODE_ENV === 'development' && (
              <div className="debug-panel">
                <div className="debug-header" onClick={() => setShowDebugPanel(!showDebugPanel)}>
                  <Database size={14} />
                  <span>Debug Info</span>
                </div>
                {showDebugPanel && (
                  <div className="debug-content">
                    <div className="debug-item"><Shield size={12} /><span>Session: {sessionDebugInfo}</span></div>
                    <div className="debug-item"><Database size={12} /><span>Electron Store: {typeof window.electron?.store !== 'undefined' ? 'Available' : 'Unavailable'}</span></div>
                    <div className="debug-item"><Clock size={12} /><span>{new Date().toLocaleString()}</span></div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      case 'main':
        return (
          <div className="main-layout">
            <GlobalPosDataManager />
            <RefreshIndicator />
            
            <Navigation
              user={user!}
              onLogout={handleLogout}
              activeView={activeView}
              onSwitchView={handleSwitchView}
              onOpenSettings={handleOpenSettings}
              onOpenUser={handleOpenUser}
              outOfStockCount={outOfStockCount}
              isOffline={false}
              isCollapsed={isSidebarCollapsed}
              onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            />
            <div
              className="content-container"
              style={{
                marginLeft: isSidebarCollapsed ? '72px' : '220px',
                transition: 'margin-left 0.28s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              {(() => {
                if (!user) return null;
                switch (activeView) {
                  case 'pos': 
                    return (
                      <PosView 
                        user={user} 
                        onOpenNewCustomer={handleOpenNewCustomer} 
                        onOpenPayment={() => setIsPaymentOpen(true)} 
                        onOpenHoldOrders={() => setIsHoldOrdersOpen(true)} 
                        onCartUpdate={setCartData} 
                      />
                    );
                  case 'transactions': 
                    return (
                      <TransactionsView 
                        user={user} 
                        onViewTransaction={setSelectedTransactionId} 
                      />
                    );
                  case 'products': 
                    return (
                      <ProductsPage 
                        // The ProductsPage now handles its own modals internally
                        // so we don't need to pass product handlers here
                      />
                    );
                  case 'orders': 
                    return (
                      <OrdersPage 
                        onViewTransaction={setSelectedTransactionId} 
                        currentCart={cartData} 
                        onProcessOrder={handleProcessOrder}
                      />
                    );
                  case 'customers': 
                    return <CustomersPage />;
                  case 'suppliers': 
                    return <SuppliersDashboard />;
                  case 'accounting': 
                    return <AccountingPage user={user} />;
                  case 'users': 
                    return <UsersPage />;
                  case 'about': 
                    return <AboutPage />;
                  default: 
                    return null;
                }
              })()}
            </div>
            {renderModals()}
            {showSessionToast && (
              <div className="session-toast">
                <CheckCircle size={18} />
                <span>Session Restored: {user?.fullname}</span>
              </div>
            )}
            {showSystemStatus && (
              <div className="system-status-toast">
                <div className="system-status-header">
                  <Database size={16} />
                  <span>SYSTEM READY</span>
                </div>
                <div className="system-status-grid">
                  <div className="status-line">
                    <div className="status-indicator active"></div>
                    <span>SESSION: ACTIVE</span>
                  </div>
                  <div className="status-line">
                    <UserIcon size={12} />
                    <span>USER: {user?.username?.toUpperCase()}</span>
                  </div>
                  <div className="status-line">
                    <Shield size={12} />
                    <span>STORE: ONLINE</span>
                  </div>
                  <div className="status-line">
                    <Clock size={12} />
                    <span>{new Date().toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const renderModals = () => {
    if (!user) return null;
    return (
      <>
        <PaymentModal 
          isOpen={isPaymentOpen} 
          onClose={() => setIsPaymentOpen(false)} 
          totalAmount={cartData.total} 
          cart={cartData.items} 
          customer={cartData.customerData}
          discount={cartData.discount} 
          tax={cartData.tax} 
          subtotal={cartData.subtotal} 
          onPaymentComplete={handlePaymentComplete} 
        />
        
        <NewCustomer 
          isOpen={isNewCustomerOpen} 
          onClose={() => setIsNewCustomerOpen(false)} 
          onCustomerAdded={handleNewCustomerCreated} 
        />
        
        <CategoriesModal 
          isOpen={isCategoriesOpen} 
          onClose={() => setIsCategoriesOpen(false)} 
        />
        
        <UserModal 
          isOpen={isUserOpen} 
          onClose={() => setIsUserOpen(false)} 
          user={user} 
        />
        
        <SettingsModal 
          isOpen={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)} 
        />
        
        <HoldOrdersModal 
          isOpen={isHoldOrdersOpen} 
          onClose={() => setIsHoldOrdersOpen(false)} 
          onRestoreOrder={() => { 
            setIsHoldOrdersOpen(false); 
            setActiveView('pos'); 
          }} 
          onDeleteOrder={(orderId) => console.log('Hold order deleted:', orderId)} 
        />
      </>
    );
  };

  return (
    <div className="app-container">
      {renderContent()}
    </div>
  );
};

export default App;