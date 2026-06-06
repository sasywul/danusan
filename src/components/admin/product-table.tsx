'use client';

import { useState } from 'react';
import { createProduct, updateProduct, toggleProductActive } from '@/actions/products';
import { Plus, Pencil, ToggleLeft, ToggleRight, Loader2, X, Package } from 'lucide-react';
import type { Product } from '@/types/database';

interface ProductTableProps {
  products: Product[];
}

export function ProductTable({ products }: ProductTableProps) {
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [toggleLoading, setToggleLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  function openCreate() {
    setEditProduct(null);
    setShowModal(true);
    setMessage(null);
  }

  function openEdit(product: Product) {
    setEditProduct(product);
    setShowModal(true);
    setMessage(null);
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    const result = editProduct
      ? await updateProduct(formData)
      : await createProduct(formData);

    if (result.success) {
      setShowModal(false);
      setMessage({ type: 'success', text: result.message || 'Berhasil!' });
    } else {
      setMessage({ type: 'error', text: result.error || 'Gagal.' });
    }
    setLoading(false);
  }

  async function handleToggle(productId: string, currentActive: boolean) {
    setToggleLoading(productId);
    await toggleProductActive(productId, !currentActive);
    setToggleLoading(null);
  }

  return (
    <>
      {/* Message toast */}
      {message && (
        <div
          className={`mb-4 p-3 rounded-xl text-sm font-medium animate-fade-in ${
            message.type === 'success'
              ? 'bg-success-bg text-success border border-success/20'
              : 'bg-danger-bg text-danger border border-danger/20'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-usm-primary" />
            <h2 className="font-semibold text-text-primary">Daftar Produk</h2>
            <span className="text-xs text-text-muted bg-surface-alt px-2 py-0.5 rounded-full">
              {products.length}
            </span>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-usm-primary text-white rounded-xl text-sm font-semibold hover:bg-usm-primary-dark active:scale-95 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Tambah Produk
          </button>
        </div>

        {/* Table */}
        {products.length === 0 ? (
          <div className="p-8 text-center text-text-muted">
            Belum ada produk. Tambahkan produk pertama.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-alt">
                  <th className="text-left px-5 py-3 font-semibold text-text-secondary">
                    Nama Produk
                  </th>
                  <th className="text-center px-5 py-3 font-semibold text-text-secondary">
                    Stok Gudang
                  </th>
                  <th className="text-right px-5 py-3 font-semibold text-text-secondary">
                    Harga Modal
                  </th>
                  <th className="text-right px-5 py-3 font-semibold text-text-secondary">
                    Harga Jual
                  </th>
                  <th className="text-center px-5 py-3 font-semibold text-text-secondary">
                    Status
                  </th>
                  <th className="text-center px-5 py-3 font-semibold text-text-secondary">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className={`hover:bg-surface-alt/50 transition-colors ${
                      !product.is_active ? 'opacity-50' : ''
                    }`}
                  >
                    <td className="px-5 py-3.5 font-medium text-text-primary">
                      {product.nama_produk}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span
                        className={`inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-full font-semibold text-xs ${
                          product.stok_gudang === 0
                            ? 'bg-danger-bg text-danger'
                            : product.stok_gudang <= 10
                            ? 'bg-warning-bg text-warning'
                            : 'bg-success-bg text-success'
                        }`}
                      >
                        {product.stok_gudang}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right text-text-secondary">
                      Rp {product.harga_modal.toLocaleString('id-ID')}
                    </td>
                    <td className="px-5 py-3.5 text-right font-medium text-text-primary">
                      Rp {product.harga_jual.toLocaleString('id-ID')}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => handleToggle(product.id, product.is_active)}
                        disabled={toggleLoading === product.id}
                        className="inline-flex items-center gap-1 transition-all"
                        title={product.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                      >
                        {toggleLoading === product.id ? (
                          <Loader2 className="w-5 h-5 animate-spin text-text-muted" />
                        ) : product.is_active ? (
                          <ToggleRight className="w-6 h-6 text-success" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-text-muted" />
                        )}
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => openEdit(product)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-usm-primary bg-info-bg hover:bg-usm-primary hover:text-white transition-all"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scale-in">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="text-lg font-semibold text-text-primary">
                {editProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg hover:bg-surface-alt transition-colors"
              >
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>

            <form action={handleSubmit} className="p-5 space-y-4">
              {editProduct && (
                <input type="hidden" name="id" value={editProduct.id} />
              )}
              {editProduct && (
                <input
                  type="hidden"
                  name="is_active"
                  value={String(editProduct.is_active)}
                />
              )}

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Nama Produk
                </label>
                <input
                  name="nama_produk"
                  required
                  defaultValue={editProduct?.nama_produk}
                  placeholder="cth: Keripik Singkong"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-text-primary placeholder:text-text-muted focus:border-usm-primary focus:ring-2 focus:ring-usm-primary/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Stok Gudang
                </label>
                <input
                  name="stok_gudang"
                  type="number"
                  min="0"
                  required
                  defaultValue={editProduct?.stok_gudang}
                  placeholder="0"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-text-primary placeholder:text-text-muted focus:border-usm-primary focus:ring-2 focus:ring-usm-primary/20 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">
                    Harga Modal
                  </label>
                  <input
                    name="harga_modal"
                    type="number"
                    min="0"
                    required
                    defaultValue={editProduct?.harga_modal}
                    placeholder="Rp 0"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-text-primary placeholder:text-text-muted focus:border-usm-primary focus:ring-2 focus:ring-usm-primary/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">
                    Harga Jual
                  </label>
                  <input
                    name="harga_jual"
                    type="number"
                    min="0"
                    required
                    defaultValue={editProduct?.harga_jual}
                    placeholder="Rp 0"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-text-primary placeholder:text-text-muted focus:border-usm-primary focus:ring-2 focus:ring-usm-primary/20 outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-border text-text-secondary font-medium hover:bg-surface-alt transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-usm-primary text-white font-semibold hover:bg-usm-primary-dark disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : null}
                  {editProduct ? 'Simpan' : 'Tambah'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
