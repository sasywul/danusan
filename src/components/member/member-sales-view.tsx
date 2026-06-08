'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { recordSale } from '@/actions/penjualan';
import { useRouter } from 'next/navigation';
import { Plus, Minus, Check, Package, Loader2, Undo2, ShoppingBag } from 'lucide-react';
import type { Product } from '@/types/database';

// Pending sale for Quick Undo
interface PendingSale {
  tempId: string;
  productId: string;
  productName: string;
  quantity: number;
  hargaJual: number;
  totalHarga: number;
  timer: ReturnType<typeof setTimeout>;
  createdAt: number;
}

interface MemberSalesViewProps {
  initialProducts: Product[];
}

const UNDO_DELAY_MS = 5000;

export function MemberSalesView({ initialProducts }: MemberSalesViewProps) {
  const router = useRouter();
  const [localStoks, setLocalStoks] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    for (const p of initialProducts) map[p.id] = p.stok_gudang;
    return map;
  });
  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    for (const p of initialProducts) map[p.id] = 1;
    return map;
  });
  const [pendingSales, setPendingSales] = useState<PendingSale[]>([]);
  const [sendingProducts, setSendingProducts] = useState<Set<string>>(new Set());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const pendingSalesRef = useRef(pendingSales);
  pendingSalesRef.current = pendingSales;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync stok when server data changes
  useEffect(() => {
    const map: Record<string, number> = {};
    for (const p of initialProducts) map[p.id] = p.stok_gudang;
    setLocalStoks(map);
  }, [initialProducts]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      pendingSalesRef.current.forEach((ps) => clearTimeout(ps.timer));
    };
  }, []);

  // ========== QUANTITY STEPPER ==========
  function setQty(productId: string, newQty: number) {
    const maxStok = localStoks[productId] ?? 0;
    const clamped = Math.max(1, Math.min(newQty, maxStok));
    setQuantities((prev) => ({ ...prev, [productId]: clamped }));
  }

  // ========== QUICK UNDO: Delayed sale ==========
  const handleSell = useCallback((product: Product) => {
    const qty = quantities[product.id] ?? 1;
    const currentStok = localStoks[product.id] ?? 0;
    if (currentStok < qty || qty < 1) return;

    // Optimistic: decrease local stok
    setLocalStoks((prev) => ({ ...prev, [product.id]: (prev[product.id] ?? 0) - qty }));
    // Reset stepper to 1
    setQuantities((prev) => ({ ...prev, [product.id]: 1 }));

    const tempId = `pending-${Date.now()}-${Math.random()}`;
    const totalHarga = product.harga_jual * qty;

    const timer = setTimeout(() => {
      commitSale(tempId, product.id, qty);
    }, UNDO_DELAY_MS);

    setPendingSales((prev) => [
      ...prev,
      { tempId, productId: product.id, productName: product.nama_produk, quantity: qty, hargaJual: product.harga_jual, totalHarga, timer, createdAt: Date.now() },
    ]);
  }, [localStoks, quantities]);

  async function commitSale(tempId: string, productId: string, quantity: number) {
    setPendingSales((prev) => prev.filter((ps) => ps.tempId !== tempId));
    setSendingProducts((prev) => new Set(prev).add(productId));

    try {
      const result = await recordSale(productId, quantity);
      if (!result.success) {
        setLocalStoks((prev) => ({ ...prev, [productId]: (prev[productId] ?? 0) + quantity }));
        setToastMessage(`❌ ${result.error}`);
        setTimeout(() => setToastMessage(null), 3000);
      } else {
        router.refresh();
      }
    } catch {
      setLocalStoks((prev) => ({ ...prev, [productId]: (prev[productId] ?? 0) + quantity }));
      setToastMessage('❌ Kesalahan koneksi.');
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setSendingProducts((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    }
  }

  function cancelPendingSale(tempId: string) {
    const pending = pendingSales.find((ps) => ps.tempId === tempId);
    if (!pending) return;

    clearTimeout(pending.timer);
    setLocalStoks((prev) => ({ ...prev, [pending.productId]: (prev[pending.productId] ?? 0) + pending.quantity }));
    setPendingSales((prev) => prev.filter((ps) => ps.tempId !== tempId));
    setToastMessage(`↩ ${pending.quantity}× ${pending.productName} dibatalkan.`);
    setTimeout(() => setToastMessage(null), 2000);
  }

  const visibleProducts = initialProducts.filter((p) => (localStoks[p.id] ?? p.stok_gudang) > 0 || p.stok_gudang > 0);

  return (
    <>
      {/* ==================== PRODUCTS ==================== */}
      <div className="flex items-center gap-2 px-1">
        <ShoppingBag className="w-5 h-5 text-usm-primary" />
        <h3 className="font-semibold text-text-primary">Produk Tersedia</h3>
        <span className="text-xs text-text-muted bg-surface-alt px-2 py-0.5 rounded-full">
          {visibleProducts.length}
        </span>
      </div>

      {visibleProducts.length === 0 ? (
        <div className="text-center py-12 text-text-muted">
          <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Semua produk sedang habis stok.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6 stagger-children">
            {visibleProducts.map((product) => {
              const stok = localStoks[product.id] ?? product.stok_gudang;
              const qty = quantities[product.id] ?? 1;
              const isHabis = stok <= 0;
              const isSending = sendingProducts.has(product.id);
              const subtotal = product.harga_jual * qty;

              return (
                <div
                  key={product.id}
                  className={`bg-white rounded-2xl border border-border overflow-hidden transition-all ${isHabis ? 'opacity-50' : ''}`}
                >
                  <div className="p-4 space-y-3">
                    {/* Baris 1: Nama Produk, Harga (teks abu-abu), dan Sisa Stok */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-text-primary text-base leading-tight">
                          {product.nama_produk}
                        </h4>
                        <p className="text-xs text-text-muted mt-0.5">
                          Rp {product.harga_jual.toLocaleString('id-ID')}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-text-muted">Stok: </span>
                        <span className={`font-bold text-sm ${isHabis ? 'text-danger' : stok <= 5 ? 'text-warning' : 'text-success'}`}>
                          {stok}
                        </span>
                      </div>
                    </div>

                    {/* Baris 2 (Stepper): Kontrol kuantitas dengan tombol [ - ], Teks Angka, dan tombol [ + ], tinggi minimal h-12 */}
                    {!isHabis && (
                      <div className="flex items-center justify-between bg-surface-alt rounded-xl h-12 overflow-hidden border border-border/50">
                        <button
                          type="button"
                          onClick={() => setQty(product.id, qty - 1)}
                          disabled={qty <= 1 || isSending}
                          className="w-12 h-12 rounded-l-xl bg-white border-r border-border flex items-center justify-center text-text-secondary active:scale-95 active:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer font-bold text-lg"
                        >
                          <Minus className="w-4 h-4" />
                        </button>

                        <div className="flex-1 text-center flex items-center justify-center gap-1.5">
                          <span className="text-lg font-bold text-text-primary tabular-nums">{qty}</span>
                          <span className="text-xs text-text-muted">
                            (Rp {subtotal.toLocaleString('id-ID')})
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setQty(product.id, qty + 1)}
                          disabled={qty >= stok || isSending}
                          className="w-12 h-12 rounded-r-xl bg-white border-l border-border flex items-center justify-center text-text-secondary active:scale-95 active:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer font-bold text-lg"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {/* Baris 3 (Tombol Aksi): Tombol besar w-full h-12 rounded-xl bg-blue-700 text-white */}
                    <button
                      type="button"
                      onClick={() => handleSell(product)}
                      disabled={isHabis || isSending}
                      className={`w-full h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-transform cursor-pointer ${
                        isHabis
                          ? 'bg-surface-alt text-text-muted cursor-not-allowed'
                          : isSending
                          ? 'bg-blue-700/80 text-white cursor-wait'
                          : 'bg-blue-700 text-white active:scale-95 active:bg-blue-800'
                      }`}
                    >
                      {isHabis ? (
                        <><Check className="w-4 h-4" /> Stok Habis</>
                      ) : isSending ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
                      ) : (
                        <><ShoppingBag className="w-4 h-4" /> Catat Laku {qty}</>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="h-36 w-full shrink-0"></div>
        </>
      )}

      {/* ==================== UNDO TOAST — Fixed to viewport ==================== */}
      {mounted && pendingSales.length > 0 && createPortal(
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[9999] w-[90%] sm:max-w-[350px] pointer-events-auto">
          <div className="space-y-2">
            {pendingSales.map((ps) => (
              <UndoToastItem key={ps.tempId} pending={ps} onCancel={cancelPendingSale} />
            ))}
          </div>
        </div>,
        document.body
      )}

      {/* ==================== STATUS TOAST — Fixed to viewport ==================== */}
      {mounted && toastMessage && !pendingSales.length && createPortal(
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[9999] w-[90%] sm:max-w-[350px] pointer-events-auto">
          <div className="bg-text-primary text-white text-sm font-medium px-4 py-3 rounded-xl shadow-2xl animate-fade-in text-center">
            {toastMessage}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

// ============================================================
//  UNDO TOAST ITEM with countdown bar
// ============================================================
function UndoToastItem({ pending, onCancel }: { pending: PendingSale; onCancel: (id: string) => void }) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const startTime = pending.createdAt;
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / UNDO_DELAY_MS) * 100);
      setProgress(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 50);
    return () => clearInterval(interval);
  }, [pending.createdAt]);

  return (
    <div className="bg-text-primary rounded-xl shadow-2xl overflow-hidden pointer-events-auto animate-slide-up">
      <div className="flex items-center justify-between px-4 py-3">
        <p className="text-white text-sm font-medium flex items-center gap-2 min-w-0">
          <Check className="w-4 h-4 text-success shrink-0" />
          <span className="truncate">
            {pending.quantity}× {pending.productName} — Rp {pending.totalHarga.toLocaleString('id-ID')}
          </span>
        </p>
        <button
          onClick={() => onCancel(pending.tempId)}
          className="shrink-0 ml-3 px-4 py-3 min-h-[48px] rounded-xl bg-white/20 text-white text-xs font-bold active:bg-white/30 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Undo2 className="w-3.5 h-3.5" />
          BATALKAN
        </button>
      </div>
      <div className="h-1 bg-white/10">
        <div
          className="h-full bg-usm-accent transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
