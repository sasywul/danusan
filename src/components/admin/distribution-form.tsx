'use client';

import { useState } from 'react';
import { allocateStock } from '@/actions/distribution';
import { Loader2, Send, Users, Package as PackageIcon } from 'lucide-react';
import type { Profile, Product } from '@/types/database';

interface DistributionFormProps {
  members: Profile[];
  products: Product[];
}

export function DistributionForm({ members, products }: DistributionFormProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedMember, setSelectedMember] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');

  const selectedProductData = products.find((p) => p.id === selectedProduct);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setMessage(null);
    const result = await allocateStock(formData);

    if (result.success) {
      setMessage({ type: 'success', text: result.message || 'Berhasil!' });
      // Reset form
      setSelectedMember('');
      setSelectedProduct('');
    } else {
      setMessage({ type: 'error', text: result.error || 'Gagal.' });
    }
    setLoading(false);
  }

  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden">
      <div className="p-5 border-b border-border flex items-center gap-2">
        <Send className="w-5 h-5 text-usm-primary" />
        <h2 className="font-semibold text-text-primary">Alokasi Stok Baru</h2>
      </div>

      {message && (
        <div
          className={`mx-5 mt-5 p-3 rounded-xl text-sm font-medium animate-fade-in ${
            message.type === 'success'
              ? 'bg-success-bg text-success border border-success/20'
              : 'bg-danger-bg text-danger border border-danger/20'
          }`}
        >
          {message.text}
        </div>
      )}

      <form action={handleSubmit} className="p-5 space-y-5">
        {/* Member selection */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-text-primary mb-2">
            <Users className="w-4 h-4 text-text-muted" />
            Pilih Member
          </label>
          {members.length === 0 ? (
            <p className="text-sm text-text-muted p-3 bg-surface-alt rounded-xl">
              Belum ada member terdaftar.
            </p>
          ) : (
            <select
              name="user_id"
              required
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-text-primary focus:border-usm-primary focus:ring-2 focus:ring-usm-primary/20 outline-none appearance-none"
            >
              <option value="">-- Pilih Member --</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.nama_lengkap}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Product selection */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-text-primary mb-2">
            <PackageIcon className="w-4 h-4 text-text-muted" />
            Pilih Produk
          </label>
          {products.length === 0 ? (
            <p className="text-sm text-text-muted p-3 bg-surface-alt rounded-xl">
              Belum ada produk aktif.
            </p>
          ) : (
            <select
              name="product_id"
              required
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-text-primary focus:border-usm-primary focus:ring-2 focus:ring-usm-primary/20 outline-none appearance-none"
            >
              <option value="">-- Pilih Produk --</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.nama_produk} (Stok: {product.stok_gudang})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Show selected product info */}
        {selectedProductData && (
          <div className="p-4 bg-info-bg rounded-xl border border-info/10 animate-fade-in">
            <p className="text-sm font-medium text-info">
              {selectedProductData.nama_produk}
            </p>
            <p className="text-xs text-info/70 mt-1">
              Stok tersedia: <strong>{selectedProductData.stok_gudang}</strong>{' '}
              &middot; Harga jual: Rp{' '}
              {selectedProductData.harga_jual.toLocaleString('id-ID')}
            </p>
          </div>
        )}

        {/* Quantity */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">
            Jumlah Alokasi
          </label>
          <input
            name="jumlah"
            type="number"
            min="1"
            max={selectedProductData?.stok_gudang || 999}
            required
            placeholder="0"
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-text-primary placeholder:text-text-muted focus:border-usm-primary focus:ring-2 focus:ring-usm-primary/20 outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !selectedMember || !selectedProduct}
          className="w-full py-3 px-4 bg-usm-primary text-white font-semibold rounded-xl hover:bg-usm-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Mengalokasikan...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Alokasikan Stok
            </>
          )}
        </button>
      </form>
    </div>
  );
}
