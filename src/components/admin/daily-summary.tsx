'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, Pencil, Trash2, X, AlertTriangle, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import type { UserStockWithProductAndProfile } from '@/types/database';
import { updateStockAllocation, deleteStockAllocation } from '@/actions/distribution';

interface DailySummaryProps {
  userStocks: UserStockWithProductAndProfile[];
}

export function DailySummary({ userStocks }: DailySummaryProps) {
  const router = useRouter();

  // State for modals
  const [selectedStock, setSelectedStock] = useState<UserStockWithProductAndProfile | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editJumlahDiambil, setEditJumlahDiambil] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleExportPenjualan() {
    const dataToExport = userStocks.map((stock) => {
      const sisa = Number(stock.jumlah_diambil) - Number(stock.jumlah_laku);
      const omzet = Number(stock.jumlah_laku) * Number(stock.products?.harga_jual || 0);
      return {
        'Nama Member': stock.profiles?.nama_lengkap || '-',
        'Nama Produk': stock.products?.nama_produk || '-',
        'Bawa (Awal)': Number(stock.jumlah_diambil),
        'Laku (Terjual)': Number(stock.jumlah_laku),
        'Sisa Bawaan': sisa,
        'Harga Jual': Number(stock.products?.harga_jual || 0),
        'Omzet Sementara': omzet,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Penjualan');

    const dateStr = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).replace(/\s/g, '');

    XLSX.writeFile(workbook, `Rekap_Penjualan_Danusan_${dateStr}.xlsx`);
  }

  function openEdit(stock: UserStockWithProductAndProfile) {
    setSelectedStock(stock);
    setEditJumlahDiambil(stock.jumlah_diambil);
    setErrorMsg(null);
    setIsEditOpen(true);
  }

  function openDelete(stock: UserStockWithProductAndProfile) {
    setSelectedStock(stock);
    setErrorMsg(null);
    setIsDeleteOpen(true);
  }

  async function handleSaveEdit() {
    if (!selectedStock) return;
    if (editJumlahDiambil < selectedStock.jumlah_laku) {
      setErrorMsg(`Jumlah diambil tidak boleh kurang dari jumlah laku (${selectedStock.jumlah_laku}).`);
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await updateStockAllocation(selectedStock.id, editJumlahDiambil);
      if (res.success) {
        setIsEditOpen(false);
        setSelectedStock(null);
        router.refresh();
      } else {
        setErrorMsg(res.error || 'Gagal menyimpan perubahan.');
      }
    } catch (e) {
      setErrorMsg((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!selectedStock) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await deleteStockAllocation(selectedStock.id);
      if (res.success) {
        setIsDeleteOpen(false);
        setSelectedStock(null);
        router.refresh();
      } else {
        setErrorMsg(res.error || 'Gagal menghapus alokasi.');
      }
    } catch (e) {
      setErrorMsg((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-border flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">
          Aktivitas Penjualan Member
        </h2>
        {userStocks.length > 0 && (
          <button
            onClick={handleExportPenjualan}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export Excel
          </button>
        )}
      </div>

      {userStocks.length === 0 ? (
        <div className="p-8 text-center text-text-muted">
          Belum ada data penjualan.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-alt">
                <th className="text-left px-5 py-3 font-semibold text-text-secondary">
                  Member
                </th>
                <th className="text-left px-5 py-3 font-semibold text-text-secondary">
                  Produk
                </th>
                <th className="text-center px-5 py-3 font-semibold text-text-secondary">
                  Diambil
                </th>
                <th className="text-center px-5 py-3 font-semibold text-text-secondary">
                  Terjual
                </th>
                <th className="text-center px-5 py-3 font-semibold text-text-secondary">
                  Sisa
                </th>
                <th className="text-right px-5 py-3 font-semibold text-text-secondary">
                  Omzet
                </th>
                <th className="text-center px-5 py-3 font-semibold text-text-secondary">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {userStocks.map((stock) => {
                const sisa = stock.jumlah_diambil - stock.jumlah_laku;
                const omzet = stock.jumlah_laku * (stock.products?.harga_jual || 0);
                return (
                  <tr
                    key={stock.id}
                    className="hover:bg-surface-alt/50 transition-colors"
                  >
                    <td className="px-5 py-3.5 font-medium text-text-primary">
                      {stock.profiles?.nama_lengkap || '-'}
                    </td>
                    <td className="px-5 py-3.5 text-text-secondary">
                      {stock.products?.nama_produk || '-'}
                    </td>
                    <td className="px-5 py-3.5 text-center text-text-primary">
                      {stock.jumlah_diambil}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-full bg-success-bg text-success font-semibold text-xs">
                        {stock.jumlah_laku}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span
                        className={`inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-full font-semibold text-xs ${
                          sisa === 0
                            ? 'bg-success-bg text-success'
                            : sisa <= 3
                            ? 'bg-warning-bg text-warning'
                            : 'bg-surface-alt text-text-secondary'
                        }`}
                      >
                        {sisa}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-medium text-text-primary">
                      Rp {omzet.toLocaleString('id-ID')}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <div className="inline-flex items-center gap-1.5 justify-center">
                        <button
                          onClick={() => openEdit(stock)}
                          className="p-1.5 bg-warning-bg text-warning hover:bg-warning hover:text-white rounded-lg transition-all active:scale-[0.9] cursor-pointer"
                          title="Edit Alokasi"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openDelete(stock)}
                          className="p-1.5 bg-danger-bg text-danger hover:bg-danger hover:text-white rounded-lg transition-all active:scale-[0.9] cursor-pointer"
                          title="Tarik / Hapus Alokasi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {isEditOpen && selectedStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/55 backdrop-blur-sm transition-opacity"
            onClick={() => {
              if (!loading) {
                setIsEditOpen(false);
                setSelectedStock(null);
              }
            }}
          />

          {/* Modal Card */}
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md border border-border p-6 animate-scale-in z-10 space-y-5">
            {/* Close button */}
            <button
              onClick={() => {
                setIsEditOpen(false);
                setSelectedStock(null);
              }}
              disabled={loading}
              className="absolute top-4 right-4 text-text-muted hover:text-text-primary p-1 rounded-full hover:bg-surface-alt transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div>
              <h3 className="text-lg font-extrabold text-text-primary">
                Edit Alokasi Stok
              </h3>
              <p className="text-xs text-text-muted mt-1">
                Revisi jumlah stok awal yang diberikan untuk member ini.
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-surface-alt rounded-2xl p-4 border border-border space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="font-semibold text-text-secondary">Nama Member:</span>
                <span className="font-bold text-text-primary">{selectedStock.profiles?.nama_lengkap}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-text-secondary">Nama Produk:</span>
                <span className="font-bold text-text-primary">{selectedStock.products?.nama_produk}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-text-secondary">Jumlah Laku:</span>
                <span className="font-bold text-success font-mono">{selectedStock.jumlah_laku} unit</span>
              </div>
            </div>

            {/* Input field */}
            <div className="space-y-2">
              <label htmlFor="edit-stok-awal" className="text-xs font-bold text-text-secondary block">
                Jumlah Diambil (Stok Awal)
              </label>
              <input
                id="edit-stok-awal"
                type="number"
                min={selectedStock.jumlah_laku}
                value={editJumlahDiambil}
                onChange={(e) => {
                  setEditJumlahDiambil(parseInt(e.target.value) || 0);
                  setErrorMsg(null);
                }}
                disabled={loading}
                className="w-full px-4 py-3 bg-surface-alt border border-border rounded-xl text-sm font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-usm-primary/20 focus:border-usm-primary transition-all"
              />
              <p className="text-[10px] text-text-muted leading-relaxed">
                Stok awal baru tidak boleh kurang dari jumlah yang sudah terjual ({selectedStock.jumlah_laku} unit).
              </p>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 bg-danger-bg text-danger border border-danger/15 rounded-xl text-xs font-semibold flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsEditOpen(false);
                  setSelectedStock(null);
                }}
                disabled={loading}
                className="flex-1 py-2.5 px-4 bg-surface-alt border border-border text-text-secondary font-bold rounded-xl text-xs hover:bg-surface-hover transition-all active:scale-[0.97] disabled:opacity-50 cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={loading}
                className="flex-1 py-2.5 px-4 bg-usm-primary hover:bg-usm-primary-dark text-white font-bold rounded-xl text-xs shadow-sm transition-all active:scale-[0.97] flex items-center justify-center gap-1.5 disabled:opacity-75 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  'Simpan Perubahan'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteOpen && selectedStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/55 backdrop-blur-sm transition-opacity"
            onClick={() => {
              if (!loading) {
                setIsDeleteOpen(false);
                setSelectedStock(null);
              }
            }}
          />

          {/* Modal Card */}
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md border border-border p-6 animate-scale-in z-10 space-y-5">
            {/* Close button */}
            <button
              onClick={() => {
                setIsDeleteOpen(false);
                setSelectedStock(null);
              }}
              disabled={loading}
              className="absolute top-4 right-4 text-text-muted hover:text-text-primary p-1 rounded-full hover:bg-surface-alt transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Warning Icon & Header */}
            <div className="text-center space-y-1">
              <div className="w-12 h-12 bg-danger-bg text-danger rounded-full flex items-center justify-center mx-auto shadow-sm">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="text-lg font-extrabold text-text-primary mt-3">
                Tarik & Hapus Alokasi?
              </h3>
              <p className="text-xs text-text-muted">
                Yakin ingin menarik kembali sisa stok ini?
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-surface-alt rounded-2xl p-4 border border-border space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="font-semibold text-text-secondary">Nama Member:</span>
                <span className="font-bold text-text-primary">{selectedStock.profiles?.nama_lengkap}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-text-secondary">Nama Produk:</span>
                <span className="font-bold text-text-primary">{selectedStock.products?.nama_produk}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-text-secondary">Sisa Stok Ditarik:</span>
                <span className="font-bold text-danger font-mono">{selectedStock.jumlah_diambil - selectedStock.jumlah_laku} unit</span>
              </div>
              {selectedStock.jumlah_laku > 0 && (
                <div className="flex justify-between border-t border-border/60 pt-2">
                  <span className="font-semibold text-text-secondary">Telah Terjual (Laku):</span>
                  <span className="font-bold text-success font-mono">{selectedStock.jumlah_laku} unit</span>
                </div>
              )}
            </div>

            {/* Warning Message if there are sales */}
            {selectedStock.jumlah_laku > 0 && (
              <div className="p-3 bg-warning-bg text-warning border border-warning/15 rounded-2xl text-xs leading-relaxed space-y-1.5">
                <p className="font-bold">⚠️ Perhatian / Peringatan:</p>
                <p>
                  Barang ini <strong>sudah ada yang terjual ({selectedStock.jumlah_laku} unit)</strong>. Menghapus alokasi ini akan <strong>menghilangkan riwayat omzet</strong> penjualan anak ini untuk produk tersebut.
                </p>
                <p>
                  Jika Anda hanya ingin mengurangi atau menyesuaikan sisa stok barang bawaannya tanpa merusak riwayat omzet, silakan gunakan fitur <strong>Edit</strong> saja.
                </p>
              </div>
            )}

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 bg-danger-bg text-danger border border-danger/15 rounded-xl text-xs font-semibold flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteOpen(false);
                  setSelectedStock(null);
                }}
                disabled={loading}
                className="flex-1 py-2.5 px-4 bg-surface-alt border border-border text-text-secondary font-bold rounded-xl text-xs hover:bg-surface-hover transition-all active:scale-[0.97] disabled:opacity-50 cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 py-2.5 px-4 bg-danger hover:bg-danger/90 text-white font-bold rounded-xl text-xs shadow-sm transition-all active:scale-[0.97] flex items-center justify-center gap-1.5 disabled:opacity-75 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Menarik...
                  </>
                ) : (
                  'Ya, Tarik & Hapus'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

