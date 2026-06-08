'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { voidTransaction } from '@/actions/penjualan';
import { useRouter } from 'next/navigation';
import { Clock, History, Loader2, X, RefreshCw } from 'lucide-react';

interface SaleItem {
  id: string;
  user_id: string;
  product_id: string;
  jumlah: number;
  harga_satuan: number;
  total_harga: number;
  created_at: string;
  products: {
    nama_produk: string;
    harga_jual: number;
  } | null;
}

interface SalesHistoryProps {
  initialSales: SaleItem[];
}

export function SalesHistory({ initialSales }: SalesHistoryProps) {
  const router = useRouter();
  const [todaySales, setTodaySales] = useState<SaleItem[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Filter to only today's transactions in user's local timezone
    const todayStr = new Date().toDateString();
    const filtered = initialSales.filter(
      (sale) => new Date(sale.created_at).toDateString() === todayStr
    );
    setTodaySales(filtered);
  }, [initialSales]);

  const formatWIB = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return (
        date.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZone: 'Asia/Jakarta',
        }) + ' WIB'
      );
    } catch {
      return '00:00 WIB';
    }
  };

  async function handleVoid(id: string, productName: string) {
    const confirmed = window.confirm('Yakin ingin membatalkan penjualan ini?');
    if (!confirmed) return;

    setLoadingId(id);
    try {
      const result = await voidTransaction(id);
      if (result.success) {
        setToastMessage(`✓ ${result.message || 'Penjualan dibatalkan'}`);
        router.refresh();
      } else {
        setToastMessage(`❌ Gagal: ${result.error}`);
      }
    } catch (err) {
      setToastMessage('❌ Terjadi kesalahan koneksi.');
    } finally {
      setLoadingId(null);
      setTimeout(() => setToastMessage(null), 3000);
    }
  }

  const totalQtyToday = todaySales.reduce((sum, item) => sum + item.jumlah, 0);
  const totalOmzetToday = todaySales.reduce((sum, item) => sum + item.total_harga, 0);

  return (
    <div className="space-y-4">
      {/* Header Summary */}
      <div className="bg-gradient-to-br from-usm-primary to-usm-primary-light rounded-2xl p-5 text-white shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <History className="w-5 h-5 text-usm-accent" />
          <h2 className="text-base font-bold">Riwayat Penjualan Hari Ini</h2>
        </div>
        <p className="text-xs text-white/70">Ringkasan transaksi yang tercatat hari ini.</p>
        <div className="grid grid-cols-2 gap-4 mt-4 pt-3 border-t border-white/10">
          <div>
            <p className="text-2xl font-bold">{totalQtyToday}</p>
            <p className="text-[10px] text-white/60 uppercase tracking-wider font-semibold">
              Terjual Hari Ini
            </p>
          </div>
          <div>
            <p className="text-2xl font-bold">
              Rp {totalOmzetToday.toLocaleString('id-ID')}
            </p>
            <p className="text-[10px] text-white/60 uppercase tracking-wider font-semibold">
              Omzet Hari Ini
            </p>
          </div>
        </div>
      </div>

      {/* Sales List */}
      <div className="bg-white rounded-2xl border border-border p-4">
        <h3 className="font-semibold text-text-primary text-sm mb-3">
          Daftar Penjualan
        </h3>

        {todaySales.length === 0 ? (
          <div className="text-center py-8 text-text-muted">
            <Clock className="w-10 h-10 mx-auto mb-2 opacity-35" />
            <p className="text-sm">Belum ada transaksi hari ini.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {todaySales.map((item) => {
              const productName = item.products?.nama_produk || 'Produk';
              const isProcessing = loadingId === item.id;

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-sm text-text-primary font-medium leading-relaxed">
                      {formatWIB(item.created_at)} -{' '}
                      {item.jumlah > 1 ? `${item.jumlah}x ` : ''}
                      {productName}
                    </p>
                    <p className="text-xs text-text-muted">
                      Total: Rp {item.total_harga.toLocaleString('id-ID')}
                    </p>
                  </div>

                  <button
                    onClick={() => handleVoid(item.id, productName)}
                    disabled={isProcessing}
                    className="shrink-0 px-3 py-1.5 rounded-lg bg-danger-bg hover:bg-danger/10 text-danger text-xs font-semibold border border-danger/10 disabled:opacity-50 transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : null}
                    Batal
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ==================== TOAST NOTIFICATION — Fixed to viewport ==================== */}
      {mounted && toastMessage && createPortal(
        <div className="fixed bottom-24 left-0 right-0 mx-auto w-[90%] max-w-sm z-[9999] pointer-events-auto">
          <div className="bg-text-primary text-white text-sm font-medium px-4 py-3 rounded-xl shadow-2xl animate-fade-in text-center flex items-center justify-center gap-2">
            <span>{toastMessage}</span>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
