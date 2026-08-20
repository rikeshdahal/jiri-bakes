export type ContentStatus = 'draft' | 'published' | 'archived';

export interface NavItem {
  label: string;
  href: string;
  icon?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  category: 'bread' | 'cake' | 'pastry' | 'cookie' | 'seasonal';
  badge?: string;
  image?: string;
  rating: number;
  featured?: boolean;
  display_order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  img: string;
  unit?: string;
}

export interface Testimonial {
  id?: string;
  name: string;
  initials: string;
  role: string;
  text: string;
  rating: number;
  approved?: boolean;
  created_at?: string;
}

export interface OrderItem {
  product_id?: string;
  name: string;
  price: number;
  quantity: number;
  img?: string;
}

export interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  customer_address: string;
  items: OrderItem[];
  total: number;
  payment_method?: string;
  status:
    | 'pending'
    | 'confirmed'
    | 'baking'
    | 'preparing'
    | 'ready'
    | 'delivered'
    | 'completed'
    | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Setting {
  key: string;
  value: string;
  updated_at?: string;
}

export type ToastType = 'success' | 'error' | 'info';

export type ProductCategory = 'cake' | 'pastry' | 'bread' | 'cookie' | 'seasonal';
