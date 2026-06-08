import { getMemberSalesSummary } from '@/actions/penjualan';
import { getSetoranForMember } from '@/actions/setoran';
import { SettlementForm } from '@/components/member/settlement-form';
import { Clock, CheckCircle2, Receipt } from 'lucide-react';

export default async function SettlementPage() {
  const [salesSummary, setoranList] = await Promise.all([
    getMemberSalesSummary(),
    getSetoranForMember(),
  ]);

  // Total omzet from penjualan
  const totalOmzet = salesSummary.reduce((sum, s) => sum + s.total_harga, 0);

  // Total approved setoran
  const totalDisetor = setoranList
    .filter((s) => s.status_setoran === 'approved')
    .reduce((sum, s) => sum + s.total_uang_disetor, 0);

  // Total pending setoran
  const totalPending = setoranList
    .filter((s) => s.status_setoran === 'pending')
    .reduce((sum, s) => sum + s.total_uang_disetor, 0);

  // Outstanding = omzet - approved setoran
  const outstanding = totalOmzet - totalDisetor;

  return (
    <div className="space-y-5 animate-fade-in pb-4">
      {/* Summary card */}
      <div className="bg-gradient-to-br from-usm-primary to-usm-primary-light rounded-2xl p-5 text-white">
        <p className="text-white/70 text-sm flex items-center gap-1.5">
          <Receipt className="w-4 h-4" />
          Ringkasan Setoran
        </p>
        <div className="grid grid-cols-2 gap-3 mt-4">
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
              Rp {outstanding.toLocaleString('id-ID')}
            </p>
            <p className="text-[10px] text-white/60">Belum Disetor</p>
          </div>
          <div>
            <p className="text-lg font-bold text-yellow-300">
              Rp {totalPending.toLocaleString('id-ID')}
            </p>
            <p className="text-[10px] text-white/60">Menunggu Approval</p>
          </div>
        </div>
      </div>

      {/* Sales detail per product */}
      <div className="bg-white rounded-2xl border border-border p-4">
        <h3 className="font-semibold text-text-primary text-sm mb-3">
          Detail Penjualan
        </h3>
        {salesSummary.length === 0 ? (
          <p className="text-sm text-text-muted">Belum ada penjualan.</p>
        ) : (
          <div className="space-y-2">
            {salesSummary.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 border-b border-border last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {item.nama_produk}
                  </p>
                  <p className="text-xs text-text-muted">
                    {item.total_jumlah} terjual × Rp{' '}
                    {item.harga_jual.toLocaleString('id-ID')}
                  </p>
                </div>
                <p className="font-semibold text-sm text-text-primary">
                  Rp {item.total_harga.toLocaleString('id-ID')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit setoran form — show outstanding amount */}
      <SettlementForm totalOmzet={totalOmzet} outstanding={outstanding} />

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
      {/* Spacer agar tidak terhalang bottom nav */}
      <div className="h-36 w-full shrink-0"></div>
    </div>
  );
}
