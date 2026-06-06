'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ActionResponse } from '@/types/database';

async function requireMember() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  return { supabase, user };
}

export async function getUserStocksForMember() {
  const { supabase, user } = await requireMember();

  const { data, error } = await supabase
    .from('user_stocks')
    .select('*, products(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function incrementSale(userStockId: string): Promise<ActionResponse> {
  try {
    const { supabase, user } = await requireMember();

    // IDOR Prevention: Verify the user_stock belongs to the current user
    const { data: stock, error: fetchError } = await supabase
      .from('user_stocks')
      .select('id, user_id, jumlah_diambil, jumlah_laku')
      .eq('id', userStockId)
      .eq('user_id', user.id) // Critical: only own records
      .single();

    if (fetchError || !stock) {
      return { success: false, error: 'Data stok tidak ditemukan atau bukan milik Anda.' };
    }

    // Check if there's remaining stock
    const sisa = stock.jumlah_diambil - stock.jumlah_laku;
    if (sisa <= 0) {
      return { success: false, error: 'Stok sudah habis terjual.' };
    }

    // Increment jumlah_laku
    const { error: updateError } = await supabase
      .from('user_stocks')
      .update({
        jumlah_laku: stock.jumlah_laku + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userStockId)
      .eq('user_id', user.id); // Double-check ownership

    if (updateError) return { success: false, error: updateError.message };

    revalidatePath('/member');
    revalidatePath('/admin');
    return { success: true, message: 'Penjualan dicatat!' };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function decrementSale(userStockId: string): Promise<ActionResponse> {
  try {
    const { supabase, user } = await requireMember();

    // IDOR Prevention: Verify the user_stock belongs to the current user
    const { data: stock, error: fetchError } = await supabase
      .from('user_stocks')
      .select('id, user_id, jumlah_diambil, jumlah_laku')
      .eq('id', userStockId)
      .eq('user_id', user.id) // Critical: only own records
      .single();

    if (fetchError || !stock) {
      return { success: false, error: 'Data stok tidak ditemukan atau bukan milik Anda.' };
    }

    // Check if jumlah_laku is already 0
    if (stock.jumlah_laku <= 0) {
      return { success: false, error: 'Penjualan sudah bernilai 0.' };
    }

    // Decrement jumlah_laku
    const { error: updateError } = await supabase
      .from('user_stocks')
      .update({
        jumlah_laku: stock.jumlah_laku - 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userStockId)
      .eq('user_id', user.id); // Double-check ownership

    if (updateError) return { success: false, error: updateError.message };

    revalidatePath('/member');
    revalidatePath('/admin');
    return { success: true, message: 'Penjualan dikurangi!' };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

