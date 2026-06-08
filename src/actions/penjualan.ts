'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ActionResponse } from '@/types/database';

/**
 * Record a sale: INSERT into penjualan + decrement products.stok_gudang.
 * Supports quantity > 1 for bulk sales (borongan).
 */
export async function recordSale(productId: string, quantity: number = 1): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'Unauthorized' };

    // Validate quantity (prevent negative/zero manipulation)
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 999) {
      return { success: false, error: 'Jumlah tidak valid.' };
    }

    // 1. Fetch product and verify stock
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, nama_produk, stok_gudang, harga_jual, is_active')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      return { success: false, error: 'Produk tidak ditemukan.' };
    }

    if (!product.is_active) {
      return { success: false, error: 'Produk tidak aktif.' };
    }

    if (product.stok_gudang < quantity) {
      return { success: false, error: `Stok tidak cukup. Tersedia: ${product.stok_gudang}` };
    }

    // 2. Decrement stok_gudang by quantity
    const { error: updateError } = await supabase
      .from('products')
      .update({
        stok_gudang: product.stok_gudang - quantity,
        updated_at: new Date().toISOString(),
      })
      .eq('id', productId)
      .gte('stok_gudang', quantity); // Safety: only update if stok >= quantity

    if (updateError) {
      return { success: false, error: 'Gagal mengurangi stok: ' + updateError.message };
    }

    // 3. INSERT into penjualan
    const totalHarga = product.harga_jual * quantity;
    const { error: insertError } = await supabase.from('penjualan').insert({
      user_id: user.id,
      product_id: productId,
      jumlah: quantity,
      harga_satuan: product.harga_jual,
      total_harga: totalHarga,
    });

    if (insertError) {
      // Rollback stok if insert fails
      await supabase
        .from('products')
        .update({
          stok_gudang: product.stok_gudang,
          updated_at: new Date().toISOString(),
        })
        .eq('id', productId);

      return { success: false, error: 'Gagal mencatat penjualan: ' + insertError.message };
    }

    revalidatePath('/member');
    revalidatePath('/member/history');
    revalidatePath('/admin');
    return {
      success: true,
      message: `${quantity}× ${product.nama_produk} terjual! Stok sisa: ${product.stok_gudang - quantity}`,
    };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

/**
 * Get all penjualan for the current member (IDOR-safe).
 */
export async function getPenjualanForMember() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const { data, error } = await supabase
    .from('penjualan')
    .select('*, products(nama_produk, harga_jual)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Get member's sales summary grouped by product (for settlement page).
 */
export async function getMemberSalesSummary() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const { data, error } = await supabase
    .from('penjualan')
    .select('product_id, jumlah, total_harga, products(nama_produk, harga_jual)')
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);

  // Aggregate by product
  const summary = new Map<string, { nama_produk: string; harga_jual: number; total_jumlah: number; total_harga: number }>();

  for (const row of data || []) {
    const pid = row.product_id;
    const existing = summary.get(pid);
    const produk = row.products as unknown as { nama_produk: string; harga_jual: number } | null;
    if (existing) {
      existing.total_jumlah += row.jumlah;
      existing.total_harga += row.total_harga;
    } else {
      summary.set(pid, {
        nama_produk: produk?.nama_produk || '-',
        harga_jual: produk?.harga_jual || 0,
        total_jumlah: row.jumlah,
        total_harga: row.total_harga,
      });
    }
  }

  return Array.from(summary.values());
}

/**
 * Get all penjualan for admin dashboard (with profiles join).
 */
export async function getPenjualanForAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') throw new Error('Forbidden');

  const { data, error } = await supabase
    .from('penjualan')
    .select('*, products(nama_produk, harga_jual, harga_modal), profiles(nama_lengkap)')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Void (cancel) a transaction. IDOR-safe: only the owner can void their own sale.
 * Restores stok_gudang and hard-deletes the penjualan record.
 */
export async function voidTransaction(transactionId: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'Unauthorized' };

    // Step 1: Find the penjualan record and verify ownership (IDOR prevention)
    const { data: sale, error: findError } = await supabase
      .from('penjualan')
      .select('id, user_id, product_id, jumlah, total_harga, products(nama_produk)')
      .eq('id', transactionId)
      .eq('user_id', user.id) // CRITICAL: only own records
      .single();

    if (findError || !sale) {
      return { success: false, error: 'Transaksi tidak ditemukan atau bukan milik Anda.' };
    }

    // Safety: jumlah must be positive (prevent negative stock manipulation)
    if (sale.jumlah <= 0) {
      return { success: false, error: 'Data transaksi tidak valid.' };
    }

    // Step 2: Restore stok_gudang
    const { error: restoreError } = await supabase.rpc('increment_stok', {
      p_product_id: sale.product_id,
      p_amount: sale.jumlah,
    });

    // If RPC doesn't exist, fallback to manual update
    if (restoreError) {
      // Fallback: fetch current stock and add back
      const { data: product } = await supabase
        .from('products')
        .select('stok_gudang')
        .eq('id', sale.product_id)
        .single();

      if (product) {
        const { error: updateError } = await supabase
          .from('products')
          .update({
            stok_gudang: product.stok_gudang + sale.jumlah,
            updated_at: new Date().toISOString(),
          })
          .eq('id', sale.product_id);

        if (updateError) {
          return { success: false, error: 'Gagal mengembalikan stok: ' + updateError.message };
        }
      }
    }

    // Step 3: Hard-delete the penjualan record
    const { error: deleteError } = await supabase
      .from('penjualan')
      .delete()
      .eq('id', transactionId)
      .eq('user_id', user.id); // Double-check ownership on delete

    if (deleteError) {
      return { success: false, error: 'Gagal menghapus transaksi: ' + deleteError.message };
    }

    const productName = (sale.products as unknown as { nama_produk: string } | null)?.nama_produk || 'Produk';
    
    revalidatePath('/member');
    revalidatePath('/member/history');
    revalidatePath('/admin');
    return { success: true, message: `Penjualan ${productName} dibatalkan. Stok dikembalikan.` };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
