// src/renderer/src/types/user.types.ts
export interface User {
  id: number;
  username: string;
  fullname: string;
  perm_products: number;
  perm_categories: number;
  perm_transactions: number;
  perm_users: number;
  perm_settings: number;
  status: string;
  last_login?: string;
  session_token?: string;
  session_expiry?: string;
  is_logged_in: number;
  created_at: string;
}

export interface CreateUserRequest {
  username: string;
  full_name: string;
  password: string;
  perm_products: number;
  perm_categories: number;
  perm_transactions: number;
  perm_users: number;
  perm_settings: number;
}

export interface UpdateUserRequest {
  id: number;
  username: string;
  full_name: string;
  password?: string;
  perm_products: number;
  perm_categories: number;
  perm_transactions: number;
  perm_users: number;
  perm_settings: number;
}