import { getUserStocksForAdmin } from '@/actions/distribution';
import { getSetoranForAdmin } from '@/actions/setoran';
import { SetoranTable } from '@/components/admin/setoran-table';
import {
  TrendingUp,
  Users,
  Package,
  Wallet,
} from 'lucide-react';

export default async function AdminDashboard() {
  const [userStocks, setoranList] = await Promise.all([
    getUserStocksForAdmin(),
    getSetoranForAdmin(),
  ]);

  // Calculate summary stats
  const totalTerjual = userStocks.reduce(
    (sum, s) => sum + (s.jumlah_laku || 0),
    0
  );
  const totalMember = new Set(userStocks.map((s) => s.user_id)).size;
  const totalProdukAktif = new Set(userStocks.map((s) => s.product_id)).size;
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
      value: totalTerjual,
      icon: TrendingUp,
      color: 'text-success',
      bg: 'bg-success-bg',
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
    {
      label: 'Setoran Pending',
      value: pendingSetoran,
      icon: Wallet,
      color: 'text-warning',
      bg: 'bg-warning-bg',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-text-secondary mt-1">
          Ringkasan aktivitas penjualan konsinyasi
        </p>
      </div>

      {/* Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: Total Kas Masuk */}
        <div className="bg-gradient-to-br from-success-bg/60 to-success-bg border border-success/25 rounded-2xl p-6 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-success uppercase tracking-wider block">
              Total Kas Masuk / Pemasukan Asli
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-text-primary">
              Rp {totalKasMasuk.toLocaleString('id-ID')}
            </h3>
            <p className="text-xs text-text-secondary leading-normal">
              Uang tunai hasil penjualan yang telah terverifikasi aman di kas.
            </p>
          </div>
          <div className="w-12 h-12 bg-success text-white rounded-xl flex items-center justify-center shadow-lg shadow-success/20 shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Menunggu Konfirmasi */}
        <div className="bg-gradient-to-br from-warning-bg/60 to-warning-bg border border-warning/25 rounded-2xl p-6 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-warning uppercase tracking-wider block">
              Menunggu Konfirmasi
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-text-primary">
              Rp {totalPendingUang.toLocaleString('id-ID')}
            </h3>
            <p className="text-xs text-text-secondary leading-normal">
              Setoran uang dari member yang perlu diverifikasi dan disetujui.
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
            <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
            <p className="text-sm text-text-secondary mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Setoran approval */}
      <SetoranTable setoranList={setoranList} />
    </div>
  );
}
