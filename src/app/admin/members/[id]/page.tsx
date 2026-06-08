import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ id: string }>;
}

export const revalidate = 0;

export default async function MemberDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch member profile
  const { data: member, error: memberErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .eq('role', 'member')
    .single();

  if (memberErr || !member) {
    notFound();
  }

  // Fetch penjualan for this member
  const { data: penjualanList, error: penjualanErr } = await supabase
    .from('penjualan')
    .select('*, products(nama_produk, harga_jual)')
    .eq('user_id', id)
    .order('created_at', { ascending: false });

  if (penjualanErr) {
    throw new Error(penjualanErr.message);
  }

  // Fetch setoran for this member
  const { data: setoranList } = await supabase
    .from('setoran')
    .select('*')
    .eq('user_id', id)
    .order('created_at', { ascending: false });

  const totalTerjual = (penjualanList || []).reduce((sum, p) => sum + p.jumlah, 0);
  const totalOmzet = (penjualanList || []).reduce((sum, p) => sum + p.total_harga, 0);
  const totalDisetor = (setoranList || [])
    .filter((s) => s.status_setoran === 'approved')
    .reduce((sum, s) => sum + s.total_uang_disetor, 0);
  const outstanding = totalOmzet - totalDisetor;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/members"
          className="p-2 rounded-xl hover:bg-surface-alt transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-text-secondary" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            {member.nama_lengkap}
          </h1>
          <p className="text-text-secondary text-sm">Detail penjualan member</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-border p-4">
          <p className="text-xs text-text-muted">Total Terjual</p>
          <p className="text-xl font-bold text-text-primary mt-1">{totalTerjual} pcs</p>
        </div>
        <div className="bg-white rounded-2xl border border-border p-4">
          <p className="text-xs text-text-muted">Total Omzet</p>
          <p className="text-xl font-bold text-text-primary mt-1">Rp {totalOmzet.toLocaleString('id-ID')}</p>
        </div>
        <div className="bg-white rounded-2xl border border-border p-4">
          <p className="text-xs text-text-muted">Sudah Disetor</p>
          <p className="text-xl font-bold text-success mt-1">Rp {totalDisetor.toLocaleString('id-ID')}</p>
        </div>
        <div className="bg-white rounded-2xl border border-border p-4">
          <p className="text-xs text-text-muted">Belum Disetor</p>
          <p className={`text-xl font-bold mt-1 ${outstanding > 0 ? 'text-danger' : 'text-success'}`}>
            Rp {outstanding.toLocaleString('id-ID')}
          </p>
        </div>
      </div>

      {/* Penjualan history */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="p-5 border-b border-border flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-usm-primary" />
          <h2 className="font-semibold text-text-primary">Riwayat Penjualan</h2>
          <span className="text-xs text-text-muted bg-surface-alt px-2 py-0.5 rounded-full">
            {(penjualanList || []).length}
          </span>
        </div>
        {(penjualanList || []).length === 0 ? (
          <div className="p-8 text-center text-text-muted">
            Belum ada riwayat penjualan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-alt">
                  <th className="text-left px-5 py-3 font-semibold text-text-secondary">Produk</th>
                  <th className="text-center px-5 py-3 font-semibold text-text-secondary">Jumlah</th>
                  <th className="text-right px-5 py-3 font-semibold text-text-secondary">Total</th>
                  <th className="text-right px-5 py-3 font-semibold text-text-secondary">Waktu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(penjualanList || []).map((p) => (
                  <tr key={p.id} className="hover:bg-surface-alt/50 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-text-primary">
                      {(p.products as { nama_produk: string } | null)?.nama_produk || '-'}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-full bg-success-bg text-success font-semibold text-xs">
                        {p.jumlah}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-medium text-text-primary">
                      Rp {p.total_harga.toLocaleString('id-ID')}
                    </td>
                    <td className="px-5 py-3.5 text-right text-text-secondary text-xs">
                      {new Date(p.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
