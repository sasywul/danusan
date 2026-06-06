'use client';

import { useState } from 'react';
import { incrementSale, decrementSale } from '@/actions/sales';
import { Plus, Minus, Check, Package } from 'lucide-react';
import type { UserStockWithProduct } from '@/types/database';

interface ProductCardProps {
  stock: UserStockWithProduct;
}

export function ProductCard({ stock }: ProductCardProps) {
  const [loading, setLoading] = useState(false);
  const [justSold, setJustSold] = useState(false);
  const [prevJumlahLaku, setPrevJumlahLaku] = useState(stock.jumlah_laku);
  const [localLaku, setLocalLaku] = useState(stock.jumlah_laku);

  if (stock.jumlah_laku !== prevJumlahLaku) {
    setPrevJumlahLaku(stock.jumlah_laku);
    setLocalLaku(stock.jumlah_laku);
  }

  const sisa = stock.jumlah_diambil - localLaku;
  const product = stock.products;
  const isHabis = sisa <= 0;
  const progressPercent = stock.jumlah_diambil > 0 
    ? Math.round((localLaku / stock.jumlah_diambil) * 100) 
    : 0;

  async function handleSell() {
    if (localLaku >= stock.jumlah_diambil || loading) return;

    // Optimistic Update
    setLocalLaku((prev) => prev + 1);
    setJustSold(true);
    const tempJustSoldTimeout = setTimeout(() => setJustSold(false), 600);

    setLoading(true);
    try {
      const result = await incrementSale(stock.id);
      if (!result.success) {
        // Rollback
        setLocalLaku((prev) => Math.max(0, prev - 1));
        setJustSold(false);
        clearTimeout(tempJustSoldTimeout);
        alert(result.error || 'Gagal mencatat penjualan.');
      }
    } catch (error) {
      // Rollback
      setLocalLaku((prev) => Math.max(0, prev - 1));
      setJustSold(false);
      clearTimeout(tempJustSoldTimeout);
      alert('Terjadi kesalahan koneksi.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    if (localLaku <= 0 || loading) return;

    // Optimistic Update
    setLocalLaku((prev) => prev - 1);

    setLoading(true);
    try {
      const result = await decrementSale(stock.id);
      if (!result.success) {
        // Rollback
        setLocalLaku((prev) => Math.min(stock.jumlah_diambil, prev + 1));
        alert(result.error || 'Gagal membatalkan penjualan.');
      }
    } catch (error) {
      // Rollback
      setLocalLaku((prev) => Math.min(stock.jumlah_diambil, prev + 1));
      alert('Terjadi kesalahan koneksi.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={`bg-white rounded-2xl border border-border overflow-hidden transition-all ${
        justSold ? 'animate-pulse-success' : ''
      } ${isHabis ? 'opacity-60' : ''}`}
    >
      <div className="p-4">
        {/* Product info */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-usm-primary/10 to-usm-accent/10 rounded-xl flex items-center justify-center shrink-0">
              <Package className="w-5 h-5 text-usm-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-text-primary text-sm leading-tight">
                {product?.nama_produk}
              </h4>
              <p className="text-xs text-text-muted mt-0.5">
                Rp {product?.harga_jual.toLocaleString('id-ID')} / pcs
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-text-muted">Omzet</p>
            <p className="font-bold text-text-primary text-sm">
              Rp {(localLaku * (product?.harga_jual || 0)).toLocaleString('id-ID')}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-text-secondary">
              Terjual <strong className="text-success">{localLaku}</strong> dari{' '}
              {stock.jumlah_diambil}
            </span>
            <span
              className={`font-semibold ${
                isHabis ? 'text-success' : sisa <= 3 ? 'text-warning' : 'text-text-secondary'
              }`}
            >
              Sisa: {sisa}
            </span>
          </div>
          <div className="h-2 bg-surface-alt rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isHabis
                  ? 'bg-success'
                  : progressPercent > 60
                  ? 'bg-usm-accent'
                  : 'bg-usm-primary'
              }`}
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 w-full mt-4">
          {/* Tombol Kiri ("- Batal") */}
          <button
            type="button"
            onClick={handleCancel}
            disabled={localLaku === 0 || loading}
            className={`px-4 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5 active:scale-[0.97] transition-all whitespace-nowrap ${
              localLaku === 0
                ? 'bg-surface-alt text-text-muted cursor-not-allowed opacity-50'
                : 'bg-red-100 text-red-600 hover:bg-red-200 active:bg-red-300 shadow-sm shadow-red-100/30'
            }`}
          >
            <Minus className="w-4 h-4" />
            Batal
          </button>

          {/* Tombol Kanan ("+ Laku 1") */}
          <button
            type="button"
            onClick={handleSell}
            disabled={isHabis || loading}
            className={`flex-1 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 active:scale-[0.97] transition-all ${
              isHabis
                ? 'bg-surface-alt text-text-muted cursor-not-allowed opacity-50'
                : justSold
                ? 'bg-success text-white'
                : 'bg-gradient-to-r from-usm-primary to-usm-primary-light text-white shadow-lg shadow-usm-primary/20 hover:shadow-xl hover:shadow-usm-primary/30'
            }`}
          >
            {isHabis ? (
              <>
                <Check className="w-4 h-4" />
                Habis Terjual
              </>
            ) : justSold ? (
              <>
                <Check className="w-4 h-4" />
                Tercatat!
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Laku 1
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

