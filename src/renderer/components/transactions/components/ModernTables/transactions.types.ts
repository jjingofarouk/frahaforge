// src/renderer/src/types/transactions.ts
export interface TransactionItem {
  id: number;
  transaction_id: number;
  product_id: number;
  product_name: string;
  price: number;
  quantity: number;
  category: string;
}

export interface Transaction {
  id: number;
  order_number: number;
  ref_number: string;
  discount: number;
  customer_id?: number;
  customer_name: string;
  status: number;
  subtotal: number;
  tax: number;
  order_type: number;
  total: number;
  paid: number;
  change_amount: number;
  payment_type: string;
  payment_info?: string;
  till: number;
  user_id: number;
  user_name: string;
  created_at: string;
  items?: TransactionItem[];
}

export interface CreateTransactionRequest {
  customer_id?: number;
  customer_name?: string;
  discount?: number;
  subtotal: number;
  tax: number;
  total: number;
  paid: number;
  change_amount: number;
  payment_type: string;
  payment_info?: string;
  ref_number?: string;
  till?: number;
  user_id: number;
  user_name: string;
  order_number?: number;  
  status?: number;       
  order_type?: number;    
  items: {
    product_id: number;
    product_name: string;
    price: number;
    quantity: number;
    category: string;
  }[];
}