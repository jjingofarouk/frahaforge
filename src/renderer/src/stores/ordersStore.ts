// src/renderer/src/stores/ordersStore.ts
import { create } from 'zustand';
import { Order, OrderItem } from '../../types/orders.types';
import { Customer } from '../types/customer.types';
import { transactionsService } from '../../services/transactionsService';

interface OrdersState {
  pendingOrders: Order[];
  selectedOrder: Order | null;
  loading: boolean;
  error: string | null;
  searchQuery: string;
  holdRefNumber: string;
  isHoldFormOpen: boolean;

  setSelectedOrder: (order: Order | null) => void;
  setSearchQuery: (query: string) => void;
  setHoldRefNumber: (ref: string) => void;
  setIsHoldFormOpen: (isOpen: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  fetchPendingOrders: () => Promise<void>;
  fetchOrderDetails: (orderId: string) => Promise<void>;
  holdOrder: (refNumber: string, cartData: any) => Promise<boolean>;
  processOrder: (orderId: string) => Promise<boolean>;
  cancelOrder: (orderId: string) => Promise<boolean>;
  searchOrders: (query: string) => Order[];
}

export const useOrdersStore = create<OrdersState>((set, get) => ({
  pendingOrders: [],
  selectedOrder: null,
  loading: false,
  error: null,
  searchQuery: '',
  holdRefNumber: '',
  isHoldFormOpen: false,

  setSelectedOrder: (order) => set({ selectedOrder: order }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setHoldRefNumber: (ref) => set({ holdRefNumber: ref }),
  setIsHoldFormOpen: (isOpen) => set({ isHoldFormOpen: isOpen }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  fetchPendingOrders: async () => {
    set({ loading: true, error: null });
    try {
      const response = await transactionsService.getTransactions({ status: 0 });
      const transactions = response.transactions || response.data || [];
      
      console.log('📦 Raw pending orders:', transactions);

      const pendingOrders: Order[] = transactions.map((transaction: any) => {
        // Simple customer data extraction
        let customer: Customer | string | number = 'walkin_customer';
        let customerPhone = '';
        let customerName = 'Walk-in Customer';

        if (transaction.customer_id && transaction.customer_id !== '0') {
          customer = {
            id: parseInt(transaction.customer_id),
            name: transaction.customer_name || 'Unknown Customer',
            phone: transaction.customer_phone || '',
            email: transaction.customer_email || ''
          };
          customerPhone = transaction.customer_phone || '';
          customerName = transaction.customer_name || 'Unknown Customer';
        } else if (transaction.customer_name) {
          customerName = transaction.customer_name;
          customerPhone = transaction.customer_phone || '';
          customer = {
            id: 0,
            name: customerName,
            phone: customerPhone,
            email: transaction.customer_email || ''
          };
        }

        // Simple items data
        const items: OrderItem[] = (transaction.items || []).map((item: any, index: number) => ({
          id: item.product_id || item.id || index,
          product_id: (item.product_id || item.id || '').toString(),
          product_name: item.product_name || 'Unknown Product',
          price: item.price?.toString() || "0.00",
          quantity: Number(item.quantity) || 0,
          barcode: item.barcode || '',
          category: item.category || 'Uncategorized',
          quantityInStock: item.quantityInStock || 0
        }));

        // Calculate totals
        const subtotalValue = parseFloat(transaction.subtotal || '0') || 0;
        const discountValue = parseFloat(transaction.discount || '0') || 0;
        const taxValue = parseFloat(transaction.tax?.toString() || '0') || 0;
        const totalValue = parseFloat(transaction.total || '0') || 0;
        const paidValue = parseFloat(transaction.paid || '0') || 0;
        const changeValue = parseFloat(transaction.change_amount?.toString() || transaction.change?.toString() || '0') || 0;

        return {
          id: transaction.id?.toString() || `temp-${Date.now()}`,
          order: transaction.order_number || transaction.id || 0,
          order_number: transaction.order_number,
          ref_number: transaction.ref_number || '',
          discount: discountValue.toString(),
          customer: customer,
          customer_id: transaction.customer_id?.toString(),
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_email: transaction.customer_email || '',
          status: transaction.status || 0,
          subtotal: subtotalValue.toString(),
          tax: taxValue,
          order_type: transaction.order_type || 1,
          items: items,
          date: transaction.created_at || transaction.date || new Date().toISOString(),
          created_at: transaction.created_at,
          payment_type: transaction.payment_type || 'Due',
          payment_info: transaction.payment_info || '',
          total: totalValue.toString(),
          paid: paidValue.toString(),
          change: changeValue.toString(),
          change_amount: changeValue.toString(),
          till: transaction.till || 1,
          user: transaction.user_name || transaction.user || 'System',
          user_id: transaction.user_id || 1,
          user_name: transaction.user_name
        };
      });

      console.log('✅ Transformed pending orders:', pendingOrders);
      set({ pendingOrders });
    } catch (error: any) {
      console.error('❌ Error fetching pending orders:', error);
      set({ error: error.message || 'Failed to fetch pending orders' });
    } finally {
      set({ loading: false });
    }
  },

  fetchOrderDetails: async (orderId: string) => {
    set({ loading: true, error: null });
    try {
      const response = await transactionsService.getTransaction(parseInt(orderId));
      const transaction = response.transaction || response.data;
      
      if (!transaction) {
        throw new Error('Order not found');
      }

      let customer: Customer | string | number = 'walkin_customer';
      if (transaction.customer_id && transaction.customer_id !== '0') {
        customer = {
          id: parseInt(transaction.customer_id),
          name: transaction.customer_name || 'Unknown Customer',
          phone: transaction.customer_phone || '',
          email: transaction.customer_email || ''
        };
      } else if (transaction.customer_name) {
        customer = {
          id: 0,
          name: transaction.customer_name,
          phone: transaction.customer_phone || '',
          email: transaction.customer_email || ''
        };
      }

      const orderDetails: Order = {
        id: transaction.id?.toString() || '',
        order: transaction.order_number || transaction.id || 0,
        order_number: transaction.order_number,
        ref_number: transaction.ref_number || '',
        discount: transaction.discount?.toString() || '0.00',
        customer: customer,
        customer_id: transaction.customer_id?.toString(),
        customer_name: typeof customer === 'object' ? customer.name : transaction.customer_name,
        customer_phone: typeof customer === 'object' ? customer.phone : transaction.customer_phone,
        customer_email: typeof customer === 'object' ? customer.email : transaction.customer_email,
        status: transaction.status || 0,
        subtotal: transaction.subtotal?.toString() || '0.00',
        tax: transaction.tax || 0,
        order_type: transaction.order_type || 1,
        items: (transaction.items || []).map((item: any, index: number) => ({
          id: item.product_id || item.id || index,
          product_id: (item.product_id || item.id || '').toString(),
          product_name: item.product_name || 'Unknown Product',
          price: item.price?.toString() || "0.00",
          quantity: Number(item.quantity) || 0,
          barcode: item.barcode || '',
          category: item.category || 'Uncategorized',
          quantityInStock: item.quantityInStock || 0
        })),
        date: transaction.created_at || transaction.date || new Date().toISOString(),
        created_at: transaction.created_at,
        payment_type: transaction.payment_type || 'Due',
        payment_info: transaction.payment_info || '',
        total: transaction.total?.toString() || '0.00',
        paid: transaction.paid?.toString() || '0.00',
        change: transaction.change_amount?.toString() || transaction.change?.toString() || '0.00',
        change_amount: transaction.change_amount?.toString() || transaction.change?.toString(),
        till: transaction.till || 1,
        user: transaction.user_name || transaction.user || 'System',
        user_id: transaction.user_id || 1,
        user_name: transaction.user_name
      };

      set({ selectedOrder: orderDetails });
    } catch (error: any) {
      console.error('❌ Error fetching order details:', error);
      set({ error: error.message || 'Failed to fetch order details' });
    } finally {
      set({ loading: false });
    }
  },

  holdOrder: async (refNumber: string, cartData: any): Promise<boolean> => {
    set({ loading: true, error: null });
    try {
      if (!cartData || !cartData.items || cartData.items.length === 0) {
        throw new Error('Cart is empty');
      }

      if (!cartData.customer) {
        throw new Error('Customer information is required for hold orders');
      }

      const customer = cartData.customer;
      const customerId = customer.id || 0;
      const customerName = customer.name || 'Unknown Customer';
      const customerPhone = customer.phone || '';
      const customerEmail = customer.email || '';

      const subtotal = parseFloat(cartData.subtotal?.toFixed(2)) || 0;
      const tax = parseFloat(cartData.tax?.toFixed(2)) || 0;
      const discount = parseFloat(cartData.discount?.toFixed(2)) || 0;
      const total = parseFloat(cartData.total?.toFixed(2)) || 0;

      const holdOrderData = {
        customer_id: customerId,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail,
        subtotal: subtotal,
        tax: tax,
        discount: discount,
        total: total,
        paid: 0.00,
        change_amount: 0.00,
        payment_type: 'Due',
        ref_number: refNumber,
        till: 1,
        user_id: 1,
        user_name: "System",
        items: cartData.items.map((item: any) => ({
          product_id: parseInt(item.id?.toString() || item.product_id?.toString() || '0'),
          product_name: item.product_name || item.name || 'Unknown Product',
          price: parseFloat(item.price?.toString() || "0.00"),
          quantity: item.quantity || 1,
          category: item.category || 'General'
        }))
      };

      const response = await transactionsService.createHoldOrder(holdOrderData);
      
      set({ 
        holdRefNumber: '',
        isHoldFormOpen: false 
      });
      
      get().fetchPendingOrders();
      
      return true;
    } catch (error: any) {
      console.error('❌ Error holding order:', error);
      set({ error: error.message || 'Failed to hold order' });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  processOrder: async (orderId: string): Promise<boolean> => {
    set({ loading: true, error: null });
    try {
      const state = get();
      const order = state.pendingOrders.find(o => o.id === orderId);
      
      if (!order) {
        throw new Error('Order not found');
      }

      return true;
    } catch (error: any) {
      console.error('❌ Error preparing to process order:', error);
      set({ error: error.message || 'Failed to process order' });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  cancelOrder: async (orderId: string): Promise<boolean> => {
    set({ loading: true, error: null });
    try {
      const response = await transactionsService.deleteTransaction(parseInt(orderId));

      if (!response) {
        throw new Error('Failed to delete transaction');
      }

      get().fetchPendingOrders();
      
      return true;
    } catch (error: any) {
      console.error('❌ Error canceling order:', error);
      set({ error: error.message || 'Failed to cancel order' });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  searchOrders: (query: string): Order[] => {
    const state = get();
    const searchLower = query.toLowerCase();
    
    return state.pendingOrders.filter(order => 
      order.ref_number?.toLowerCase().includes(searchLower) ||
      order.id.toLowerCase().includes(searchLower) ||
      order.order.toString().includes(searchLower) ||
      (typeof order.customer === 'object' && order.customer?.name?.toLowerCase().includes(searchLower)) ||
      (typeof order.customer === 'object' && order.customer?.phone?.includes(searchLower)) ||
      order.customer_name?.toLowerCase().includes(searchLower) ||
      order.customer_phone?.includes(searchLower)
    );
  }
}));