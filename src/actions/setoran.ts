'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ActionResponse } from '@/types/database';

export async function submitSetoran(formData: FormData): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'Unauthorized' };

    const total_uang_disetor = parseInt(formData.get('total_uang_disetor') as string);

    if (isNaN(total_uang_disetor) || total_uang_disetor <= 0) {
      return { success: false, error: 'Jumlah setoran harus lebih dari 0.' };
    }

    const { error } = await supabase.from('setoran').insert({
      user_id: user.id, // Always use authenticated user, never from form data
      total_uang_disetor,
      status_setoran: 'pending',
    });

    if (error) return { success: false, error: error.message };

    revalidatePath('/member/settlement');
    revalidatePath('/admin');
    revalidatePath('/admin/settlements');
    return { success: true, message: 'Setoran berhasil dikirim. Menunggu persetujuan admin.' };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function approveSetoran(setoranId: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'Unauthorized' };

    // Verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return { success: false, error: 'Forbidden: Admin only' };
    }

    const { error } = await supabase
      .from('setoran')
      .update({
        status_setoran: 'approved',
        updated_at: new Date().toISOString(),
      })
      .eq('id', setoranId);

    if (error) return { success: false, error: error.message };

    revalidatePath('/admin');
    revalidatePath('/member/settlement');
    revalidatePath('/admin/settlements');
    return { success: true, message: 'Setoran berhasil disetujui.' };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function getSetoranForMember() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  // IDOR: member can only see their own setoran
  const { data, error } = await supabase
    .from('setoran')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function getSetoranForAdmin() {
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
    .from('setoran')
    .select('*, profiles(nama_lengkap)')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function getPendingSetoranCount(): Promise<number> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return 0;

    // Verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') return 0;

    const { count, error } = await supabase
      .from('setoran')
      .select('*', { count: 'exact', head: true })
      .eq('status_setoran', 'pending');

    if (error) return 0;
    return count || 0;
  } catch (e) {
    return 0;
  }
}

