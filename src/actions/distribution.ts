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

export async function getMembers() {
  const { supabase } = await requireAdmin();

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'member')
    .order('nama_lengkap', { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function getUserStocksForAdmin(userId?: string) {
  const { supabase } = await requireAdmin();

  let query = supabase
    .from('user_stocks')
    .select('*, products(*), profiles(*)')
    .order('created_at', { ascending: false });

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);
  return data;
}

export async function allocateStock(formData: FormData): Promise<ActionResponse> {
  try {
    const { supabase } = await requireAdmin();

    const user_id = formData.get('user_id') as string;
    const product_id = formData.get('product_id') as string;
    const jumlah = parseInt(formData.get('jumlah') as string);

    if (!user_id || !product_id || isNaN(jumlah) || jumlah <= 0) {
      return { success: false, error: 'Data tidak valid.' };
    }

    // Check product stock availability
    const { data: product } = await supabase
      .from('products')
      .select('stok_gudang, nama_produk')
      .eq('id', product_id)
      .single();

    if (!product) {
      return { success: false, error: 'Produk tidak ditemukan.' };
    }

    if (product.stok_gudang < jumlah) {
      return {
        success: false,
        error: `Stok gudang ${product.nama_produk} tidak cukup. Tersedia: ${product.stok_gudang}`,
      };
    }

    // Check if user already has this product allocated
    const { data: existingStock } = await supabase
      .from('user_stocks')
      .select('id, jumlah_diambil')
      .eq('user_id', user_id)
      .eq('product_id', product_id)
      .single();

    if (existingStock) {
      // Update existing allocation
      const { error: updateError } = await supabase
        .from('user_stocks')
        .update({
          jumlah_diambil: existingStock.jumlah_diambil + jumlah,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingStock.id);

      if (updateError) return { success: false, error: updateError.message };
    } else {
      // Create new allocation
      const { error: insertError } = await supabase.from('user_stocks').insert({
        user_id,
        product_id,
        jumlah_diambil: jumlah,
        jumlah_laku: 0,
      });

      if (insertError) return { success: false, error: insertError.message };
    }

    // Decrease warehouse stock
    const { error: stockError } = await supabase
      .from('products')
      .update({
        stok_gudang: product.stok_gudang - jumlah,
        updated_at: new Date().toISOString(),
      })
      .eq('id', product_id);

    if (stockError) return { success: false, error: stockError.message };

    revalidatePath('/admin/distribution');
    revalidatePath('/admin');
    revalidatePath('/member');
    return { success: true, message: `${jumlah} unit ${product.nama_produk} berhasil dialokasikan.` };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function updateStockAllocation(stockId: string, newJumlahDiambil: number): Promise<ActionResponse> {
  try {
    const { supabase } = await requireAdmin();

    if (!stockId || isNaN(newJumlahDiambil) || newJumlahDiambil < 0) {
      return { success: false, error: 'Data tidak valid.' };
    }

    // Get the existing user stock record
    const { data: existingStock, error: fetchStockError } = await supabase
      .from('user_stocks')
      .select('*')
      .eq('id', stockId)
      .single();

    if (fetchStockError || !existingStock) {
      return { success: false, error: 'Alokasi stok tidak ditemukan.' };
    }

    if (newJumlahDiambil < existingStock.jumlah_laku) {
      return {
        success: false,
        error: `Stok awal baru (${newJumlahDiambil}) tidak boleh lebih kecil dari jumlah laku (${existingStock.jumlah_laku}).`,
      };
    }

    // Fetch the product to check and update its stock
    const { data: product, error: fetchProductError } = await supabase
      .from('products')
      .select('stok_gudang, nama_produk')
      .eq('id', existingStock.product_id)
      .single();

    if (fetchProductError || !product) {
      return { success: false, error: 'Produk tidak ditemukan.' };
    }

    const diff = newJumlahDiambil - existingStock.jumlah_diambil;

    if (diff > 0) {
      // Increasing allocation: check warehouse stock
      if (product.stok_gudang < diff) {
        return {
          success: false,
          error: `Stok gudang ${product.nama_produk} tidak cukup. Tersedia: ${product.stok_gudang}`,
        };
      }
    }

    // Update warehouse stock
    const { error: stockError } = await supabase
      .from('products')
      .update({
        stok_gudang: product.stok_gudang - diff,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingStock.product_id);

    if (stockError) return { success: false, error: stockError.message };

    // Update user stock allocation
    const { error: updateError } = await supabase
      .from('user_stocks')
      .update({
        jumlah_diambil: newJumlahDiambil,
        updated_at: new Date().toISOString(),
      })
      .eq('id', stockId);

    if (updateError) return { success: false, error: updateError.message };

    revalidatePath('/admin');
    revalidatePath('/admin/monitoring');
    revalidatePath('/admin/distribution');
    revalidatePath('/member');

    return { success: true, message: 'Alokasi stok berhasil diperbarui.' };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function deleteStockAllocation(stockId: string): Promise<ActionResponse> {
  try {
    const { supabase } = await requireAdmin();

    if (!stockId) {
      return { success: false, error: 'ID tidak valid.' };
    }

    // Get the existing user stock record
    const { data: existingStock, error: fetchStockError } = await supabase
      .from('user_stocks')
      .select('*')
      .eq('id', stockId)
      .single();

    if (fetchStockError || !existingStock) {
      return { success: false, error: 'Alokasi stok tidak ditemukan.' };
    }

    // Fetch the product
    const { data: product, error: fetchProductError } = await supabase
      .from('products')
      .select('stok_gudang')
      .eq('id', existingStock.product_id)
      .single();

    if (fetchProductError || !product) {
      return { success: false, error: 'Produk tidak ditemukan.' };
    }

    const sisa = existingStock.jumlah_diambil - existingStock.jumlah_laku;

    // Return remaining unsold stock to warehouse
    if (sisa > 0) {
      const { error: stockError } = await supabase
        .from('products')
        .update({
          stok_gudang: product.stok_gudang + sisa,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingStock.product_id);

      if (stockError) return { success: false, error: stockError.message };
    }

    // Delete allocation record
    const { error: deleteError } = await supabase
      .from('user_stocks')
      .delete()
      .eq('id', stockId);

    if (deleteError) return { success: false, error: deleteError.message };

    revalidatePath('/admin');
    revalidatePath('/admin/monitoring');
    revalidatePath('/admin/distribution');
    revalidatePath('/member');

    return { success: true, message: 'Alokasi stok berhasil ditarik/dihapus.' };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function batchUpdateStockAllocations(
  allocations: { stockId: string; newJumlahDiambil: number }[]
): Promise<ActionResponse> {
  try {
    const { supabase } = await requireAdmin();

    if (!Array.isArray(allocations) || allocations.length === 0) {
      return { success: false, error: 'Daftar alokasi tidak valid.' };
    }

    // Verify all allocations before saving to avoid partial updates
    for (const item of allocations) {
      if (!item.stockId || isNaN(item.newJumlahDiambil) || item.newJumlahDiambil < 0) {
        return { success: false, error: 'Data alokasi tidak valid.' };
      }

      const { data: stock, error: stockErr } = await supabase
        .from('user_stocks')
        .select('*, products(*)')
        .eq('id', item.stockId)
        .single();

      if (stockErr || !stock) {
        return { success: false, error: `Alokasi dengan ID ${item.stockId} tidak ditemukan.` };
      }

      if (item.newJumlahDiambil < stock.jumlah_laku) {
        return {
          success: false,
          error: `Stok awal baru untuk produk ${stock.products?.nama_produk || ''} tidak boleh kurang dari jumlah laku (${stock.jumlah_laku}).`,
        };
      }

      const diff = item.newJumlahDiambil - stock.jumlah_diambil;
      if (diff > 0) {
        // Check warehouse stock
        const { data: product } = await supabase
          .from('products')
          .select('stok_gudang')
          .eq('id', stock.product_id)
          .single();

        if (!product || product.stok_gudang < diff) {
          return {
            success: false,
            error: `Stok gudang untuk produk ${stock.products?.nama_produk || ''} tidak cukup. Tersedia: ${product?.stok_gudang || 0}`,
          };
        }
      }
    }

    // Perform updates sequentially
    for (const item of allocations) {
      const { data: stock } = await supabase
        .from('user_stocks')
        .select('*')
        .eq('id', item.stockId)
        .single();

      if (!stock) continue;

      const { data: product } = await supabase
        .from('products')
        .select('stok_gudang')
        .eq('id', stock.product_id)
        .single();

      if (!product) continue;

      const diff = item.newJumlahDiambil - stock.jumlah_diambil;

      // Update product warehouse stock
      const { error: prodErr } = await supabase
        .from('products')
        .update({
          stok_gudang: product.stok_gudang - diff,
          updated_at: new Date().toISOString(),
        })
        .eq('id', stock.product_id);

      if (prodErr) throw new Error(prodErr.message);

      // Update user stock
      const { error: stockUpdateErr } = await supabase
        .from('user_stocks')
        .update({
          jumlah_diambil: item.newJumlahDiambil,
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.stockId);

      if (stockUpdateErr) throw new Error(stockUpdateErr.message);
    }

    revalidatePath('/admin');
    revalidatePath('/admin/monitoring');
    revalidatePath('/admin/distribution');
    revalidatePath('/member');

    return { success: true, message: 'Batch alokasi stok berhasil diperbarui.' };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
