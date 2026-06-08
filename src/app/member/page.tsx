import { getActiveProducts } from '@/actions/products';
import { getPenjualanForMember } from '@/actions/penjualan';
import { getProfile } from '@/actions/auth';
import { MemberSalesView } from '@/components/member/member-sales-view';

export const revalidate = 0; // Always fetch fresh data

export default async function MemberPage() {
  const [products, penjualanList, profile] = await Promise.all([
    getActiveProducts(),
    getPenjualanForMember(),
    getProfile(),
  ]);

  // Calculate member stats from committed penjualan
  const totalTerjual = penjualanList.reduce((sum, p) => sum + p.jumlah, 0);
  const totalOmzet = penjualanList.reduce((sum, p) => sum + p.total_harga, 0);

  return (
    <div className="space-y-5 animate-fade-in pb-4">
      {/* Greeting card */}
      <div className="bg-gradient-to-br from-usm-primary to-usm-primary-light rounded-2xl p-5 text-white">
        <p className="text-white/70 text-sm">Halo,</p>
        <h2 className="text-xl font-bold mt-0.5">
          {profile?.nama_lengkap || 'Member'} 👋
        </h2>
        <div className="flex gap-6 mt-4">
          <div>
            <p className="text-2xl font-bold">{totalTerjual}</p>
            <p className="text-xs text-white/60">Terjual</p>
          </div>
          <div>
            <p className="text-2xl font-bold">
              Rp {totalOmzet.toLocaleString('id-ID')}
            </p>
            <p className="text-xs text-white/60">Omzet</p>
          </div>
        </div>
      </div>

      {/* Products + Quick Undo Toast — all managed client-side */}
      <MemberSalesView
        initialProducts={products}
      />
    </div>
  );
}
