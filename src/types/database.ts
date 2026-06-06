export type UserRole = 'admin' | 'member';

export interface Profile {
  id: string;
  nama_lengkap: string;
  role: UserRole;
  created_at: string;
}

export interface Product {
  id: string;
  nama_produk: string;
  stok_gudang: number;
  harga_modal: number;
  harga_jual: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserStock {
  id: string;
  user_id: string;
  product_id: string;
  jumlah_diambil: number;
  jumlah_laku: number;
  created_at: string;
  updated_at: string;
}

export interface Setoran {
  id: string;
  user_id: string;
  total_uang_disetor: number;
  status_setoran: 'pending' | 'approved';
  created_at: string;
  updated_at: string;
}

// Composite / join types
export interface UserStockWithProduct extends UserStock {
  products: Product;
}

export interface UserStockWithProductAndProfile extends UserStock {
  products: Product;
  profiles: Profile;
}

export interface SetoranWithProfile extends Setoran {
  profiles: Profile;
}

// Action response types
export interface ActionResponse {
  success: boolean;
  error?: string;
  message?: string;
}
