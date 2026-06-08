import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Eye, Clock, TrendingUp, HelpCircle, ArrowRight } from 'lucide-react';

export const revalidate = 0; // Always fetch fresh real-time data

interface GroupedMember {
  member_id: string;
  nama_member: string;
  total_omzet: number;
  total_terjual: number;
  terakhir_aktif: string | null;
  items: {
    nama_produk: string;
    jumlah_laku: number;
    subtotal_omzet: number;
  }[];
}

export default async function AdminMonitoringPage() {
  const supabase = await createClient();

  // Fetch all profiles where role = 'member' and all penjualan records
  const [profilesRes, penjualanRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, nama_lengkap')
      .eq('role', 'member')
      .order('nama_lengkap', { ascending: true }),
    supabase
      .from('penjualan')
      .select('id, user_id, product_id, jumlah, harga_satuan, total_harga, created_at, products(nama_produk)')
      .order('created_at', { ascending: false }),
  ]);

  const error = profilesRes.error || penjualanRes.error;
  const profiles = profilesRes.data || [];
  const penjualan = penjualanRes.data || [];

  // Group and aggregate data in memory
  const memberGroups: GroupedMember[] = profiles.map((profile) => {
    const memberSales = penjualan.filter((p) => p.user_id === profile.id);

    const productMap = new Map<
      string,
      { nama_produk: string; jumlah_laku: number; subtotal_omzet: number }
    >();
    let totalOmzet = 0;
    let totalTerjual = 0;
    let terakhirAktif: string | null = null;

    for (const sale of memberSales) {
      totalOmzet += sale.total_harga || 0;
      totalTerjual += sale.jumlah || 0;
      if (!terakhirAktif || new Date(sale.created_at) > new Date(terakhirAktif)) {
        terakhirAktif = sale.created_at;
      }

      const prodId = sale.product_id;
      const prodName = (sale.products as unknown as { nama_produk: string } | null)?.nama_produk || 'Produk';
      const existing = productMap.get(prodId);

      if (existing) {
        existing.jumlah_laku += sale.jumlah || 0;
        existing.subtotal_omzet += sale.total_harga || 0;
      } else {
        productMap.set(prodId, {
          nama_produk: prodName,
          jumlah_laku: sale.jumlah || 0,
          subtotal_omzet: sale.total_harga || 0,
        });
      }
    }

    return {
      member_id: profile.id,
      nama_member: profile.nama_lengkap,
      total_omzet: totalOmzet,
      total_terjual: totalTerjual,
      terakhir_aktif: terakhirAktif,
      items: Array.from(productMap.values()).sort((a, b) =>
        a.nama_produk.localeCompare(b.nama_produk)
      ),
    };
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-usm-primary/10 rounded-2xl flex items-center justify-center">
            <Eye className="w-6 h-6 text-usm-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-primary">Pantau Member</h2>
            <p className="text-xs text-text-muted mt-0.5">
              Pantau total penjualan, omzet, dan keaktifan member secara real-time.
            </p>
          </div>
        </div>
      </div>

      {error ? (
        <div className="p-8 text-center bg-danger-bg text-danger border border-danger/25 rounded-2xl text-sm font-medium">
          Gagal memuat data pantau: {error.message}
        </div>
      ) : memberGroups.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-border">
          <UsersIcon className="w-16 h-16 mx-auto text-text-muted/30 mb-4" />
          <h4 className="text-lg font-bold text-text-primary">Tidak Ada Data Member</h4>
          <p className="text-sm text-text-secondary mt-1">
            Belum ada member aktif yang terdaftar di sistem.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 stagger-children">
          {memberGroups.map((member) => (
            <div
              key={member.member_id}
              className="bg-white rounded-2xl border border-border shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
            >
              {/* Card Content */}
              <div className="p-5 flex-grow space-y-4">
                <div>
                  <h4 className="font-extrabold text-text-primary text-base leading-tight">
                    <Link
                      href={`/admin/members/${member.member_id}`}
                      className="hover:text-usm-primary hover:underline transition-colors"
                    >
                      {member.nama_member}
                    </Link>
                  </h4>
                  {member.terakhir_aktif ? (
                    <p className="text-[10px] text-text-muted flex items-center gap-1 mt-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      Aktif:{' '}
                      {new Date(member.terakhir_aktif).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  ) : (
                    <p className="text-[10px] text-text-muted flex items-center gap-1 mt-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      Belum aktif mencatat
                    </p>
                  )}
                </div>

                {/* Revenue Badge */}
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-bold text-text-muted tracking-wider">
                    Total Omzet
                  </span>
                  <span className="inline-flex items-center gap-1 mt-1 px-3 py-1 bg-success-bg border border-success/15 rounded-xl text-sm font-extrabold text-success w-fit">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Rp {member.total_omzet.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Card Footer */}
              <div className="px-5 py-3 bg-surface-alt border-t border-border">
                <Link
                  href={`/admin/members/${member.member_id}`}
                  className="w-full text-center inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-usm-primary hover:bg-usm-primary-dark text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  Kelola & Detail
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer helper info */}
      <div className="bg-info-bg/40 border border-info/15 rounded-3xl p-4 flex gap-3 text-xs text-text-secondary">
        <HelpCircle className="w-5 h-5 text-info shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-text-primary">Informasi Monitoring Real-Time</p>
          <p className="leading-relaxed leading-normal">
            Halaman ini menampilkan rekapitulasi real-time dari data penjualan anggota yang dilaporkan melalui dashboard member. 
            Data diurutkan berdasarkan alfabetis nama member dan diperbarui otomatis begitu member menekan tombol penjualan atau pembatalan di dashboard mereka.
          </p>
        </div>
      </div>
    </div>
  );
}

// Simple placeholder fallback icon for users
function UsersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
      />
    </svg>
  );
}
