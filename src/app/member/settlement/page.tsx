import { getUserStocksForMember } from '@/actions/sales';
import { getSetoranForMember } from '@/actions/setoran';
import { SettlementForm } from '@/components/member/settlement-form';
import { Clock, CheckCircle2, Receipt } from 'lucide-react';

export default async function SettlementPage() {
  const [userStocks, setoranList] = await Promise.all([
    getUserStocksForMember(),
    getSetoranForMember(),
  ]);

  // Calculate total owed based on sales
  const totalOmzet = userStocks.reduce(
    (sum, s) => sum + s.jumlah_laku * (s.products?.harga_jual || 0),
    0
  );
  const totalDisetor = setoranList
    .filter((s) => s.status_setoran === 'approved')
    .reduce((sum, s) => sum + s.total_uang_disetor, 0);
  const totalPending = setoranList
    .filter((s) => s.status_setoran === 'pending')
    .reduce((sum, s) => sum + s.total_uang_disetor, 0);

  return (
    <div className="space-y-5 animate-fade-in pb-4">
      {/* Summary card */}
      <div className="bg-gradient-to-br from-usm-primary to-usm-primary-light rounded-2xl p-5 text-white">
        <p className="text-white/70 text-sm flex items-center gap-1.5">
          <Receipt className="w-4 h-4" />
          Ringkasan Setoran
        </p>
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div>
            <p className="text-lg font-bold">
              Rp {totalOmzet.toLocaleString('id-ID')}
            </p>
            <p className="text-[10px] text-white/60">Total Omzet</p>
          </div>
          <div>
            <p className="text-lg font-bold">
              Rp {totalDisetor.toLocaleString('id-ID')}
            </p>
            <p className="text-[10px] text-white/60">Sudah Disetor</p>
          </div>
          <div>
            <p className="text-lg font-bold text-usm-accent">
              Rp {totalPending.toLocaleString('id-ID')}
            </p>
            <p className="text-[10px] text-white/60">Menunggu</p>
          </div>
        </div>
      </div>

      {/* Sales detail */}
      <div className="bg-white rounded-2xl border border-border p-4">
        <h3 className="font-semibold text-text-primary text-sm mb-3">
          Detail Penjualan
        </h3>
        {userStocks.length === 0 ? (
          <p className="text-sm text-text-muted">Belum ada penjualan.</p>
        ) : (
          <div className="space-y-2">
            {userStocks.map((stock) => {
              const omzet =
                stock.jumlah_laku * (stock.products?.harga_jual || 0);
              return (
                <div
                  key={stock.id}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {stock.products?.nama_produk}
                    </p>
                    <p className="text-xs text-text-muted">
                      {stock.jumlah_laku} terjual × Rp{' '}
                      {(stock.products?.harga_jual || 0).toLocaleString('id-ID')}
                    </p>
                  </div>
                  <p className="font-semibold text-sm text-text-primary">
                    Rp {omzet.toLocaleString('id-ID')}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Submit setoran form */}
      <SettlementForm totalOmzet={totalOmzet} />

      {/* Setoran history */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-text-primary text-sm">
            Riwayat Setoran
          </h3>
        </div>
        {setoranList.length === 0 ? (
          <div className="p-6 text-center text-text-muted text-sm">
            Belum ada riwayat setoran.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {setoranList.map((setoran) => (
              <div key={setoran.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm text-text-primary">
                    Rp {setoran.total_uang_disetor.toLocaleString('id-ID')}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {new Date(setoran.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                {setoran.status_setoran === 'pending' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-warning-bg text-warning text-xs font-semibold">
                    <Clock className="w-3 h-3" />
                    Pending
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-success-bg text-success text-xs font-semibold">
                    <CheckCircle2 className="w-3 h-3" />
                    Approved
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
