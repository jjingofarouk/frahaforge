// src/renderer/src/types/customer.types.ts
export interface Customer {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  store?: string;
  loyalty_points?: number;
  total_spent?: number;
  total_orders?: number;
  average_order_value?: number;
  segment?: string;
  created_at?: string;
  updated_at?: string;
}