import { getUserStocksForMember } from '@/actions/sales';
import { Package, HelpCircle } from 'lucide-react';

export const revalidate = 0; // Ensure we always fetch fresh data

export default async function MemberStocksPage() {
  const userStocks = await getUserStocksForMember();

  return (
    <div className="space-y-5 animate-fade-in pb-4">
      {/* Title Header */}
      <div className="flex items-center gap-2 px-1">
        <Package className="w-5 h-5 text-usm-primary" />
        <h3 className="font-semibold text-text-primary">Stok Barang Saya</h3>
        <span className="text-xs text-text-muted bg-surface-alt px-2 py-0.5 rounded-full">
          {userStocks.length} Produk
        </span>
      </div>

      {userStocks.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-border text-text-muted">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30 text-usm-primary" />
          <p className="text-sm font-medium">Belum ada produk yang dialokasikan.</p>
          <p className="text-xs mt-1 text-text-muted">Hubungi admin untuk distribusi stok barang.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-surface-alt border-b border-border">
                  <th className="px-4 py-3.5 font-bold text-text-secondary text-xs uppercase tracking-wider">
                    Nama Produk
                  </th>
                  <th className="px-3 py-3.5 font-bold text-text-secondary text-xs uppercase tracking-wider text-center">
                    Awal
                  </th>
                  <th className="px-3 py-3.5 font-bold text-text-secondary text-xs uppercase tracking-wider text-center">
                    Laku
                  </th>
                  <th className="px-3 py-3.5 font-bold text-text-secondary text-xs uppercase tracking-wider text-center">
                    Sisa
                  </th>
                  <th className="px-4 py-3.5 font-bold text-text-secondary text-xs uppercase tracking-wider text-center">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {userStocks.map((stock) => {
                  const sisa = stock.jumlah_diambil - stock.jumlah_laku;
                  const isHabis = sisa <= 0;
                  const isWarning = sisa > 0 && sisa <= 3;
                  return (
                    <tr
                      key={stock.id}
                      className={`hover:bg-surface-alt/30 transition-colors ${
                        isHabis ? 'bg-surface-alt/10' : ''
                      }`}
                    >
                      {/* Product Name */}
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-text-primary leading-tight">
                          {stock.products?.nama_produk}
                        </p>
                        <p className="text-2xs text-text-muted mt-0.5">
                          Rp {stock.products?.harga_jual.toLocaleString('id-ID')} / pcs
                        </p>
                      </td>

                      {/* Allocated (Awal) */}
                      <td className="px-3 py-3.5 text-center text-text-secondary font-medium">
                        {stock.jumlah_diambil}
                      </td>

                      {/* Laku (Terjual) */}
                      <td className="px-3 py-3.5 text-center font-semibold text-success">
                        {stock.jumlah_laku}
                      </td>

                      {/* Sisa */}
                      <td className="px-3 py-3.5 text-center">
                        <span
                          className={`font-bold text-sm ${
                            isHabis
                              ? 'text-text-muted line-through'
                              : isWarning
                              ? 'text-warning'
                              : 'text-text-primary'
                          }`}
                        >
                          {sisa}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-3xs font-extrabold uppercase tracking-wide ${
                            isHabis
                              ? 'bg-danger-bg text-danger'
                              : isWarning
                              ? 'bg-warning-bg text-warning'
                              : 'bg-success-bg text-success'
                          }`}
                        >
                          {isHabis ? 'Habis' : 'Tersedia'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Info Card helper */}
      <div className="bg-info-bg/50 border border-info/10 rounded-2xl p-4 flex gap-3 text-text-secondary text-xs">
        <HelpCircle className="w-5 h-5 text-info shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-text-primary text-xs">Informasi Alokasi Stok</p>
          <p className="leading-relaxed">
            Data di atas menunjukkan jumlah alokasi barang konsinyasi yang Anda bawa saat ini. 
            Jika terdapat ketidaksesuaian jumlah awal stok, segera hubungi staff admin gudang untuk penyesuaian.
          </p>
        </div>
      </div>
    </div>
  );
}
