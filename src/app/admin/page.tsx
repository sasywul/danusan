import { getPenjualanForAdmin } from '@/actions/penjualan';
import { getSetoranForAdmin } from '@/actions/setoran';
import { getProducts } from '@/actions/products';
import { SetoranTable } from '@/components/admin/setoran-table';
import {
  TrendingUp,
  Users,
  Package,
  Wallet,
} from 'lucide-react';

export default async function AdminDashboard() {
  const [penjualanList, setoranList, products] = await Promise.all([
    getPenjualanForAdmin(),
    getSetoranForAdmin(),
    getProducts(),
  ]);

  // Calculate summary stats from penjualan
  const totalTerjual = penjualanList.reduce(
    (sum, p) => sum + (p.jumlah || 0),
    0
  );
  const totalOmzet = penjualanList.reduce(
    (sum, p) => sum + (p.total_harga || 0),
    0
  );
  const totalMember = new Set(penjualanList.map((p) => p.user_id)).size;
  const totalProdukAktif = products.filter((p) => p.is_active).length;
  const pendingSetoran = setoranList.filter(
    (s) => s.status_setoran === 'pending'
  ).length;

  const totalKasMasuk = setoranList
    .filter((s) => s.status_setoran === 'approved')
    .reduce((sum, s) => sum + s.total_uang_disetor, 0);

  const totalPendingUang = setoranList
    .filter((s) => s.status_setoran === 'pending')
    .reduce((sum, s) => sum + s.total_uang_disetor, 0);

  const stats = [
    {
      label: 'Total Terjual',
      value: `${totalTerjual} pcs`,
      icon: TrendingUp,
      color: 'text-success',
      bg: 'bg-success-bg',
    },
    {
      label: 'Total Omzet',
      value: `Rp ${totalOmzet.toLocaleString('id-ID')}`,
      icon: Wallet,
      color: 'text-usm-primary',
      bg: 'bg-info-bg',
    },
    {
      label: 'Member Aktif',
      value: totalMember,
      icon: Users,
      color: 'text-info',
      bg: 'bg-info-bg',
    },
    {
      label: 'Produk Aktif',
      value: totalProdukAktif,
      icon: Package,
      color: 'text-usm-accent',
      bg: 'bg-warning-bg',
    },
  ];

  // Aggregate penjualan per member for the activity table
  const memberSalesMap = new Map<string, { nama: string; totalJumlah: number; totalHarga: number; products: Set<string> }>();
  for (const p of penjualanList) {
    const uid = p.user_id;
    const nama = (p.profiles as { nama_lengkap: string } | null)?.nama_lengkap || '-';
    const existing = memberSalesMap.get(uid);
    if (existing) {
      existing.totalJumlah += p.jumlah;
      existing.totalHarga += p.total_harga;
      existing.products.add((p.products as { nama_produk: string } | null)?.nama_produk || '-');
    } else {
      memberSalesMap.set(uid, {
        nama,
        totalJumlah: p.jumlah,
        totalHarga: p.total_harga,
        products: new Set([(p.products as { nama_produk: string } | null)?.nama_produk || '-']),
      });
    }
  }
  const memberSales = Array.from(memberSalesMap.values());

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-text-secondary mt-1">
          Ringkasan aktivitas penjualan langsung
        </p>
      </div>

      {/* Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-gradient-to-br from-success-bg/60 to-success-bg border border-success/25 rounded-2xl p-6 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-success uppercase tracking-wider block">
              Total Kas Masuk
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-text-primary">
              Rp {totalKasMasuk.toLocaleString('id-ID')}
            </h3>
            <p className="text-xs text-text-secondary leading-normal">
              Setoran yang telah diverifikasi dan disetujui.
            </p>
          </div>
          <div className="w-12 h-12 bg-success text-white rounded-xl flex items-center justify-center shadow-lg shadow-success/20 shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-warning-bg/60 to-warning-bg border border-warning/25 rounded-2xl p-6 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-warning uppercase tracking-wider block">
              Menunggu Konfirmasi
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-text-primary">
              Rp {totalPendingUang.toLocaleString('id-ID')}
            </h3>
            <p className="text-xs text-text-secondary leading-normal">
              Setoran member yang perlu diverifikasi.
            </p>
          </div>
          <div className="w-12 h-12 bg-warning text-white rounded-xl flex items-center justify-center shadow-lg shadow-warning/20 shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-2xl border border-border p-5 hover:shadow-md transition-shadow"
          >
            <div className={`inline-flex p-2.5 rounded-xl ${stat.bg} mb-3`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <p className="text-xl font-bold text-text-primary">{stat.value}</p>
            <p className="text-sm text-text-secondary mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Member Activity */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="p-5 border-b border-border">
          <h2 className="text-lg font-semibold text-text-primary">
            Aktivitas Penjualan Member
          </h2>
        </div>
        {memberSales.length === 0 ? (
          <div className="p-8 text-center text-text-muted">
            Belum ada data penjualan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-alt">
                  <th className="text-left px-5 py-3 font-semibold text-text-secondary">Member</th>
                  <th className="text-center px-5 py-3 font-semibold text-text-secondary">Produk Dijual</th>
                  <th className="text-center px-5 py-3 font-semibold text-text-secondary">Total Terjual</th>
                  <th className="text-right px-5 py-3 font-semibold text-text-secondary">Omzet</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {memberSales.map((ms, i) => (
                  <tr key={i} className="hover:bg-surface-alt/50 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-text-primary">{ms.nama}</td>
                    <td className="px-5 py-3.5 text-center text-text-secondary text-xs">
                      {Array.from(ms.products).join(', ')}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-full bg-success-bg text-success font-semibold text-xs">
                        {ms.totalJumlah}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-medium text-text-primary">
                      Rp {ms.totalHarga.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Setoran approval */}
      <SetoranTable setoranList={setoranList} />
    </div>
  );
}
