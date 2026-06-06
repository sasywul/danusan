import { createAdminClient } from '@/lib/supabase-admin';
import { MemberForm } from './member-form';
import { Users, AlertTriangle, KeyRound, Clock } from 'lucide-react';
import Link from 'next/link';

export const revalidate = 0; // Always fetch fresh data

export default async function AdminMembersPage() {
  let membersList: { id: string; nama_lengkap: string; email: string; created_at: string }[] = [];
  let errorState = null;

  try {
    const adminClient = createAdminClient();
    
    // Fetch profiles and auth users list parallelly
    const [profilesRes, usersRes] = await Promise.all([
      adminClient
        .from('profiles')
        .select('id, nama_lengkap, created_at')
        .eq('role', 'member')
        .order('created_at', { ascending: false }),
      adminClient.auth.admin.listUsers(),
    ]);

    if (profilesRes.error) throw new Error(profilesRes.error.message);
    if (usersRes.error) throw new Error(usersRes.error.message);

    const usersMap = new Map((usersRes.data?.users || []).map((u) => [u.id, u.email]));

    membersList = (profilesRes.data || []).map((p) => ({
      id: p.id,
      nama_lengkap: p.nama_lengkap,
      email: usersMap.get(p.id) || '-',
      created_at: p.created_at,
    }));
  } catch (e) {
    const error = e as Error;
    console.error('Error fetching members:', error);
    errorState = {
      message: error.message || 'Gagal terhubung dengan server database.',
      isKeyMissing:
        error.message?.includes('SUPABASE_SERVICE_ROLE_KEY') ||
        error.message?.includes('service_role') ||
        false,
    };
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Title Bar */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-usm-primary/10 rounded-2xl flex items-center justify-center">
          <Users className="w-6 h-6 text-usm-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-text-primary">Manajemen Member</h2>
          <p className="text-xs text-text-muted mt-0.5">
            Daftarkan dan awasi anggota staff penjualan kampus.
          </p>
        </div>
      </div>

      {/* Check if Key is missing and render a guide */}
      {errorState?.isKeyMissing && (
        <div className="bg-warning-bg border border-warning/20 rounded-2xl p-5 flex gap-4 text-sm text-text-secondary animate-fade-in shadow-sm">
          <AlertTriangle className="w-8 h-8 text-warning shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h4 className="font-bold text-text-primary text-base">SUPABASE_SERVICE_ROLE_KEY Belum Dikonfigurasi</h4>
            <p className="leading-relaxed text-xs">
              Untuk mengizinkan pendaftaran anggota baru langsung dari web, silakan tambahkan baris berikut ke dalam file <strong>.env.local</strong> Anda:
            </p>
            <pre className="bg-white px-4 py-3 rounded-xl border border-border text-2xs text-text-primary font-mono select-all w-full overflow-x-auto">
              SUPABASE_SERVICE_ROLE_KEY=isi_dengan_service_role_key_supabase_anda
            </pre>
            <p className="text-2xs text-text-muted">
              Kunci ini bisa didapatkan di Dashboard Supabase &rarr; Project Settings &rarr; API &rarr; Project API Keys &rarr; service_role.
            </p>
          </div>
        </div>
      )}

      {/* Grid Layout for Form & Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Form Registration (Left / 1 Span) */}
        <div className="lg:col-span-1">
          {errorState?.isKeyMissing ? (
            <div className="bg-white rounded-2xl border border-border p-6 text-center text-text-muted space-y-3">
              <KeyRound className="w-12 h-12 mx-auto text-text-muted/40" />
              <h4 className="font-bold text-text-primary text-sm">Registrasi Dinonaktifkan</h4>
              <p className="text-xs">
                Konfigurasikan service role key terlebih dahulu untuk mengaktifkan form registrasi.
              </p>
            </div>
          ) : (
            <MemberForm />
          )}
        </div>

        {/* Members List Table (Right / 2 Spans) */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm flex flex-col h-full">
            <div className="p-5 border-b border-border flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-usm-primary" />
                <h3 className="font-bold text-text-primary text-sm">Daftar Member Aktif</h3>
              </div>
              <span className="text-2xs text-text-muted bg-surface-alt px-2 py-0.5 rounded-full font-medium">
                {membersList.length} Terdaftar
              </span>
            </div>

            {errorState && !errorState.isKeyMissing && (
              <div className="p-8 text-center text-danger text-sm font-medium">
                Terjadi kesalahan: {errorState.message}
              </div>
            )}

            {!errorState && membersList.length === 0 ? (
              <div className="p-10 text-center text-text-muted text-sm flex-grow flex flex-col justify-center">
                Belum ada member yang terdaftar. Gunakan form di sebelah kiri untuk menambahkan.
              </div>
            ) : (
              <div className="overflow-x-auto flex-grow">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="bg-surface-alt border-b border-border">
                      <th className="px-5 py-3.5 font-bold text-text-secondary text-xs uppercase tracking-wider">
                        Nama Lengkap
                      </th>
                      <th className="px-5 py-3.5 font-bold text-text-secondary text-xs uppercase tracking-wider">
                        Email Login
                      </th>
                      <th className="px-5 py-3.5 font-bold text-text-secondary text-xs uppercase tracking-wider">
                        Terdaftar Pada
                      </th>
                      <th className="px-5 py-3.5 font-bold text-text-secondary text-xs uppercase tracking-wider text-center">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {membersList.map((member) => (
                      <tr key={member.id} className="hover:bg-surface-alt/30 transition-colors">
                        <td className="px-5 py-4 font-bold text-text-primary text-sm">
                          {member.nama_lengkap}
                        </td>
                        <td className="px-5 py-4 text-text-secondary font-mono text-xs select-all">
                          {member.email}
                        </td>
                        <td className="px-5 py-4 text-text-muted text-xs inline-flex items-center gap-1.5 mt-0.5 border-b-0">
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          {new Date(member.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <Link
                            href={`/admin/members/${member.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-usm-primary hover:bg-usm-primary-dark text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                          >
                            Kelola Stok &rarr;
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
