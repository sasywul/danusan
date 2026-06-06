'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ActionResponse } from '@/types/database';

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') throw new Error('Forbidden: Admin only');

  return { supabase, user };
}

export async function getProducts() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function getActiveProducts() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('nama_produk', { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function createProduct(formData: FormData): Promise<ActionResponse> {
  try {
    const { supabase } = await requireAdmin();

    const nama_produk = formData.get('nama_produk') as string;
    const stok_gudang = parseInt(formData.get('stok_gudang') as string);
    const harga_modal = parseInt(formData.get('harga_modal') as string);
    const harga_jual = parseInt(formData.get('harga_jual') as string);

    if (!nama_produk || isNaN(stok_gudang) || isNaN(harga_modal) || isNaN(harga_jual)) {
      return { success: false, error: 'Semua field harus diisi dengan benar.' };
    }

    const { error } = await supabase.from('products').insert({
      nama_produk,
      stok_gudang,
      harga_modal,
      harga_jual,
      is_active: true,
    });

    if (error) return { success: false, error: error.message };

    revalidatePath('/admin/products');
    return { success: true, message: 'Produk berhasil ditambahkan.' };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function updateProduct(formData: FormData): Promise<ActionResponse> {
  try {
    const { supabase } = await requireAdmin();

    const id = formData.get('id') as string;
    const nama_produk = formData.get('nama_produk') as string;
    const stok_gudang = parseInt(formData.get('stok_gudang') as string);
    const harga_modal = parseInt(formData.get('harga_modal') as string);
    const harga_jual = parseInt(formData.get('harga_jual') as string);
    const is_active = formData.get('is_active') === 'true';

    if (!id || !nama_produk) {
      return { success: false, error: 'Data tidak valid.' };
    }

    const { error } = await supabase
      .from('products')
      .update({
        nama_produk,
        stok_gudang,
        harga_modal,
        harga_jual,
        is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) return { success: false, error: error.message };

    revalidatePath('/admin/products');
    return { success: true, message: 'Produk berhasil diperbarui.' };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function toggleProductActive(productId: string, isActive: boolean): Promise<ActionResponse> {
  try {
    const { supabase } = await requireAdmin();

    const { error } = await supabase
      .from('products')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', productId);

    if (error) return { success: false, error: error.message };

    revalidatePath('/admin/products');
    return { success: true, message: isActive ? 'Produk diaktifkan.' : 'Produk dinonaktifkan.' };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
