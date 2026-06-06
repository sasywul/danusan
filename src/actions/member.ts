'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { revalidatePath } from 'next/cache';
import type { ActionResponse } from '@/types/database';

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    throw new Error('Forbidden: Admin only');
  }

  return { supabase, user };
}

export async function createMember(formData: FormData): Promise<ActionResponse> {
  try {
    // 1. Guard check: Only admin can register new members
    await requireAdmin();

    const nama_lengkap = formData.get('nama_lengkap') as string;
    const kode_member = formData.get('kode_member') as string;

    if (!nama_lengkap || !kode_member) {
      return { success: false, error: 'Semua field (Nama Lengkap, Kode Member) harus diisi.' };
    }

    const cleanKode = kode_member.trim();
    if (cleanKode.includes(' ')) {
      return { success: false, error: 'Kode member tidak boleh mengandung spasi.' };
    }

    // 2. Generate dummy credentials
    const email = `${cleanKode.toLowerCase()}@danusan.local`;
    const password = `${cleanKode}-pass123`;

    const adminClient = createAdminClient();

    // 3. Create Auth user using Service Role
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      return {
        success: false,
        error: `Gagal membuat user auth: ${authError?.message || 'Unknown error'}`,
      };
    }

    // 4. Create Profile entry in 'profiles' table
    const { error: profileError } = await adminClient
      .from('profiles')
      .insert({
        id: authData.user.id,
        nama_lengkap: nama_lengkap.trim(),
        role: 'member',
      });

    // 5. Transaction Rollback: if profile insertion fails, delete the created auth user
    if (profileError) {
      await adminClient.auth.admin.deleteUser(authData.user.id);
      return {
        success: false,
        error: `Gagal mencatat profil member ke database: ${profileError.message}. Auth user telah di-rollback.`,
      };
    }

    // 6. Refresh the members list page cache
    revalidatePath('/admin/members');

    return {
      success: true,
      message: `Member ${nama_lengkap.trim()} (${email}) berhasil didaftarkan!`,
    };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
