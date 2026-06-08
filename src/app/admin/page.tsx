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

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Kas Masuk */}
        <div className="bg-gradient-to-br from-success-bg/60 to-success-bg border border-success/25 rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow h-28 relative overflow-hidden">
          <div className="space-y-1">
            <span className="text-[9px] font-extrabold text-success uppercase tracking-wider block">
              Total Kas Masuk
            </span>
            <h3 className="text-lg font-bold text-text-primary">
              Rp {totalKasMasuk.toLocaleString('id-ID')}
            </h3>
          </div>
          <p className="text-[10px] text-text-secondary leading-tight mt-auto">
            Setoran terverifikasi.
          </p>
          <div className="absolute right-3 bottom-3 w-8 h-8 bg-success text-white rounded-lg flex items-center justify-center shadow-md shadow-success/15 shrink-0 opacity-80">
            <Wallet className="w-4 h-4" />
          </div>
        </div>

        {/* Menunggu Konfirmasi */}
        <div className="bg-gradient-to-br from-warning-bg/60 to-warning-bg border border-warning/25 rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow h-28 relative overflow-hidden">
          <div className="space-y-1">
            <span className="text-[9px] font-extrabold text-warning uppercase tracking-wider block">
              Menunggu Konfirmasi
            </span>
            <h3 className="text-lg font-bold text-text-primary">
              Rp {totalPendingUang.toLocaleString('id-ID')}
            </h3>
          </div>
          <p className="text-[10px] text-text-secondary leading-tight mt-auto">
            Perlu diverifikasi.
          </p>
          <div className="absolute right-3 bottom-3 w-8 h-8 bg-warning text-white rounded-lg flex items-center justify-center shadow-md shadow-warning/15 shrink-0 opacity-80">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        {/* Dynamic Stats Cards */}
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-2xl border border-border p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-28 relative overflow-hidden"
          >
            <div className="space-y-1">
              <span className="text-[9px] font-extrabold text-text-muted uppercase tracking-wider block">
                {stat.label}
              </span>
              <h3 className="text-lg font-bold text-text-primary">
                {stat.value}
              </h3>
            </div>
            <div className="absolute right-3 bottom-3 w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-text-secondary shrink-0">
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
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
                <tr className="bg-surface-alt border-b border-border">
                  <th className="text-left px-4 py-2 font-bold text-text-secondary text-xs uppercase tracking-wider">Member</th>
                  <th className="text-center px-4 py-2 font-bold text-text-secondary text-xs uppercase tracking-wider">Produk Dijual</th>
                  <th className="text-center px-4 py-2 font-bold text-text-secondary text-xs uppercase tracking-wider w-24">Total Terjual</th>
                  <th className="text-right px-4 py-2 font-bold text-text-secondary text-xs uppercase tracking-wider">Omzet</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {memberSales.map((ms, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2 font-bold text-text-primary text-sm">{ms.nama}</td>
                    <td className="px-4 py-2 text-center text-text-secondary text-xs">
                      {Array.from(ms.products).join(', ')}
                    </td>
                    <td className="px-4 py-2 text-center text-sm">
                      <span className="inline-flex items-center justify-center min-w-[1.5rem] px-2 py-0.5 rounded-full bg-success-bg text-success font-semibold text-xs">
                        {ms.totalJumlah}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right font-semibold text-text-primary text-sm">
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
