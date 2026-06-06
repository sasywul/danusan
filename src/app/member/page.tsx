import { getUserStocksForMember } from '@/actions/sales';
import { getProfile } from '@/actions/auth';
import { ProductCard } from '@/components/member/product-card';
import { ShoppingBag } from 'lucide-react';

export default async function MemberPage() {
  const [userStocks, profile] = await Promise.all([
    getUserStocksForMember(),
    getProfile(),
  ]);

  const totalTerjual = userStocks.reduce((sum, s) => sum + s.jumlah_laku, 0);
  const totalOmzet = userStocks.reduce(
    (sum, s) => sum + s.jumlah_laku * (s.products?.harga_jual || 0),
    0
  );

  return (
    <div className="space-y-5 animate-fade-in pb-4">
      {/* Greeting */}
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

      {/* Products */}
      <div className="flex items-center gap-2 px-1">
        <ShoppingBag className="w-5 h-5 text-usm-primary" />
        <h3 className="font-semibold text-text-primary">Produk Saya</h3>
        <span className="text-xs text-text-muted bg-surface-alt px-2 py-0.5 rounded-full">
          {userStocks.length}
        </span>
      </div>

      {userStocks.length === 0 ? (
        <div className="text-center py-12 text-text-muted">
          <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Belum ada produk yang dialokasikan.</p>
          <p className="text-xs mt-1">Hubungi admin untuk distribusi stok.</p>
        </div>
      ) : (
        <div className="space-y-3 stagger-children">
          {userStocks.map((stock) => (
            <ProductCard key={stock.id} stock={stock} />
          ))}
        </div>
      )}
    </div>
  );
}
