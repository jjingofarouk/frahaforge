export interface User {
  id: number;
  username: string;
  fullname: string;
  password: string;
  perm_products: number;
  perm_categories: number;
  perm_transactions: number;
  perm_users: number;
  perm_settings: number;
  status: string;
  last_login?: string;
  is_logged_in: number;
  created_at: string;
  session_token?: string;
  session_expiry?: string;
}