export interface Client {
  id: string;
  name: string;
  email: string;
  country?: string;
  phone: string;
  company: string;
  role?: string;
  avatar?: string;
  status?: 'Active' | 'Pending' | 'VIP' | 'Inactive';
  accountValue?: number;
  city?: string;
  address?: string;
  postalCode?: string;
  joinedDate?: string;
  ordersCount?: number;
}

export interface ClientCartItem {
  id: number;
  title: string;
  price: number;
  quantity: number;
  total: number;
  discountPercentage: number;
  discountedTotal: number;
  thumbnail: string;
}

export interface ClientCart {
  id: number;
  products: ClientCartItem[];
  total: number;
  discountedTotal: number;
  totalProducts: number;
  totalQuantity: number;
}
