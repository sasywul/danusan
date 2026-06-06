import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Eye, Clock, TrendingUp, Package, CheckCircle2, AlertTriangle, HelpCircle, ArrowRight } from 'lucide-react';

export const revalidate = 0; // Always fetch fresh real-time data

interface PantauRecord {
  member_id: string;
  nama_member: string;
  nama_produk: string;
  jumlah_diambil: number;
  jumlah_laku: number;
  sisa_bawaan: number;
  omzet_sementara: number;
  waktu_laporan_terakhir: string | null;
}

interface GroupedMember {
  member_id: string;
  nama_member: string;
  total_omzet: number;
  terakhir_aktif: string | null;
  items: PantauRecord[];
}

export default async function AdminMonitoringPage() {
  const supabase = await createClient();

  // Query database view: pantau_member
  // Ordered by nama_member (ascending) and waktu_laporan_terakhir (descending)
  const { data, error } = await supabase
    .from('pantau_member')
    .select('*')
    .order('nama_member', { ascending: true })
    .order('waktu_laporan_terakhir', { ascending: false });

  let memberGroups: GroupedMember[] = [];

  if (data) {
    const grouped: Record<string, GroupedMember> = {};

    for (const row of data as PantauRecord[]) {
      if (!grouped[row.nama_member]) {
        grouped[row.nama_member] = {
          member_id: row.member_id,
          nama_member: row.nama_member,
          total_omzet: 0,
          terakhir_aktif: null,
          items: [],
        };
      }
      grouped[row.nama_member].items.push(row);
      grouped[row.nama_member].total_omzet += row.omzet_sementara;

      // Find the latest time reported across all items for this member
      if (row.waktu_laporan_terakhir) {
        if (
          !grouped[row.nama_member].terakhir_aktif ||
          new Date(row.waktu_laporan_terakhir) > new Date(grouped[row.nama_member].terakhir_aktif!)
        ) {
          grouped[row.nama_member].terakhir_aktif = row.waktu_laporan_terakhir;
        }
      }
    }

    // Sort alphabetically by member name (Object.values order is usually preserved but sorting is safer)
    memberGroups = Object.values(grouped).sort((a, b) =>
      a.nama_member.localeCompare(b.nama_member)
    );
  }

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
              Pantau alokasi barang bawaan, penjualan, dan omzet per individu secara real-time.
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
            Belum ada member aktif yang sedang memegang atau menjual barang bawaan.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 stagger-children">
          {memberGroups.map((member) => (
            <div
              key={member.member_id}
              className="bg-white rounded-3xl border border-border shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
            >
              {/* Card Header */}
              <div className="p-5 border-b border-border bg-gradient-to-r from-surface to-surface-alt flex items-center justify-between">
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
                    <p className="text-3xs text-text-muted flex items-center gap-1 mt-1 font-medium">
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
                    <p className="text-3xs text-text-muted flex items-center gap-1 mt-1 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      Belum aktif mencatat
                    </p>
                  )}
                </div>
                
                {/* Revenue Badge */}
                <div className="text-right flex flex-col items-end">
                  <span className="text-[9px] uppercase font-bold text-text-muted tracking-wider">
                    Omzet Sementara
                  </span>
                  <span className="inline-flex items-center gap-1 mt-0.5 px-3 py-1 bg-success-bg border border-success/15 rounded-xl text-sm font-extrabold text-success">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Rp {member.total_omzet.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Card Body Table */}
              <div className="p-4 flex-grow overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="text-text-secondary border-b border-border/80">
                      <th className="pb-2.5 font-bold text-text-muted">Nama Produk</th>
                      <th className="pb-2.5 text-center font-bold text-text-muted w-12">Bawa</th>
                      <th className="pb-2.5 text-center font-bold text-text-muted w-12">Laku</th>
                      <th className="pb-2.5 text-center font-bold text-text-muted w-12">Sisa</th>
                      <th className="pb-2.5 text-center font-bold text-text-muted w-24">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {member.items.map((item, idx) => {
                      const isSoldOut = item.sisa_bawaan === 0;
                      const isLowStock = item.sisa_bawaan > 0 && item.sisa_bawaan <= 3;
                      return (
                        <tr key={idx} className="hover:bg-surface-alt/20 transition-colors">
                          <td className="py-3 font-semibold text-text-primary">
                            {item.nama_produk}
                          </td>
                          <td className="py-3 text-center text-text-secondary font-medium">
                            {item.jumlah_diambil}
                          </td>
                          <td className="py-3 text-center font-bold text-success">
                            {item.jumlah_laku}
                          </td>
                          <td className="py-3 text-center font-extrabold">
                            <span className={isSoldOut ? 'text-text-muted line-through' : isLowStock ? 'text-warning' : 'text-text-primary'}>
                              {item.sisa_bawaan}
                            </span>
                          </td>
                          <td className="py-3 text-center">
                            {isSoldOut ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-success-bg text-success text-[10px] font-extrabold uppercase tracking-wide">
                                <CheckCircle2 className="w-3 h-3" />
                                Habis Terjual
                              </span>
                            ) : isLowStock ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-warning-bg text-warning text-[10px] font-extrabold uppercase tracking-wide">
                                <AlertTriangle className="w-3 h-3" />
                                Sisa Sedikit
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-info-bg text-info text-[10px] font-extrabold uppercase tracking-wide">
                                <Package className="w-3 h-3" />
                                Tersedia
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Card Footer */}
              <div className="px-5 py-3.5 bg-surface-alt border-t border-border flex items-center justify-end">
                <Link
                  href={`/admin/members/${member.member_id}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-usm-primary hover:bg-usm-primary-dark text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  Kelola Stok & Detail
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
