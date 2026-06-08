'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
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
  const pendingSalesRef = useRef(pendingSales);
  pendingSalesRef.current = pendingSales;

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
        <div className="space-y-3 stagger-children">
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
                <div className="p-4">
                  {/* Product info */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 bg-gradient-to-br from-usm-primary/10 to-usm-accent/10 rounded-xl flex items-center justify-center shrink-0">
                        <Package className="w-5 h-5 text-usm-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-text-primary text-sm leading-tight">
                          {product.nama_produk}
                        </h4>
                        <p className="text-xs text-text-muted mt-0.5">
                          Rp {product.harga_jual.toLocaleString('id-ID')} / pcs
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-text-muted">Stok</p>
                      <p className={`font-bold text-sm ${isHabis ? 'text-danger' : stok <= 5 ? 'text-warning' : 'text-success'}`}>
                        {stok}
                      </p>
                    </div>
                  </div>

                  {/* Row 1: Quantity Stepper */}
                  {!isHabis && (
                    <div className="flex items-center justify-between mb-3 bg-surface-alt rounded-xl p-1.5">
                      <button
                        type="button"
                        onClick={() => setQty(product.id, qty - 1)}
                        disabled={qty <= 1 || isSending}
                        className="w-10 h-10 rounded-lg bg-white border border-border flex items-center justify-center text-text-secondary hover:bg-danger-bg hover:text-danger hover:border-danger/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90 shadow-sm"
                      >
                        <Minus className="w-4 h-4" />
                      </button>

                      <div className="flex-1 text-center">
                        <p className="text-2xl font-bold text-text-primary tabular-nums">{qty}</p>
                        <p className="text-[10px] text-text-muted -mt-0.5">
                          = Rp {subtotal.toLocaleString('id-ID')}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setQty(product.id, qty + 1)}
                        disabled={qty >= stok || isSending}
                        className="w-10 h-10 rounded-lg bg-white border border-border flex items-center justify-center text-text-secondary hover:bg-success-bg hover:text-success hover:border-success/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90 shadow-sm"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Row 2: Main sell button */}
                  <button
                    type="button"
                    onClick={() => handleSell(product)}
                    disabled={isHabis || isSending}
                    className={`w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 active:scale-[0.97] transition-all ${
                      isHabis
                        ? 'bg-surface-alt text-text-muted cursor-not-allowed'
                        : isSending
                        ? 'bg-usm-primary/80 text-white cursor-wait'
                        : 'bg-gradient-to-r from-usm-primary to-usm-primary-light text-white shadow-lg shadow-usm-primary/20 hover:shadow-xl hover:shadow-usm-primary/30'
                    }`}
                  >
                    {isHabis ? (
                      <><Check className="w-5 h-5" /> Stok Habis</>
                    ) : isSending ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> Menyimpan...</>
                    ) : (
                      <><ShoppingBag className="w-5 h-5" /> Catat Laku {qty}</>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ==================== UNDO TOAST — Fixed to viewport ==================== */}
      {pendingSales.length > 0 && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4 pointer-events-none">
          <div className="space-y-2">
            {pendingSales.map((ps) => (
              <UndoToastItem key={ps.tempId} pending={ps} onCancel={cancelPendingSale} />
            ))}
          </div>
        </div>
      )}

      {/* ==================== STATUS TOAST — Fixed to viewport ==================== */}
      {toastMessage && !pendingSales.length && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 w-full max-w-lg px-4 pointer-events-none">
          <div className="bg-text-primary text-white text-sm font-medium px-4 py-3 rounded-xl shadow-2xl animate-fade-in pointer-events-auto text-center">
            {toastMessage}
          </div>
        </div>
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
          className="shrink-0 ml-3 px-3 py-1 rounded-lg bg-white/20 text-white text-xs font-bold hover:bg-white/30 active:scale-95 transition-all flex items-center gap-1"
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
