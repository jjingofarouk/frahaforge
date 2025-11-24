// src/renderer/types/orders.types.ts
export interface Order {
  id: string;
  order_number: number;
  ref_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  items: OrderItem[];
  created_at: string;
  status: number;
  customer?: Customer | string; // Can be Customer object or string name
}

export interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  price: number;
  quantity: number;
  category: string;
  barcode?: string;
  quantityInStock?: number;
}

export interface HoldOrder extends Order {
  // Additional properties specific to hold orders if needed
}

export interface CartItem {
  id: number;
  product_name: string;
  price: number;
  quantity: number;
  barcode: string;
  quantityInStock: number;
  category: string;
  img: string;
  description: string;
}

export interface Customer {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  store?: string;
}