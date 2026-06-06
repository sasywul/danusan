'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Trash2,
  AlertTriangle,
  Loader2,
  X,
  TrendingUp,
  Download,
  CheckCircle2,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import type { Profile, UserStockWithProductAndProfile } from '@/types/database';
import { deleteStockAllocation, batchUpdateStockAllocations } from '@/actions/distribution';

interface MemberStockManagerProps {
  member: Profile;
  initialStocks: UserStockWithProductAndProfile[];
}

export function MemberStockManager({ member, initialStocks }: MemberStockManagerProps) {
  const router = useRouter();

  // State for batch edit
  const [editedStocks, setEditedStocks] = useState<Record<string, number>>({});
  
  // State for delete modal
  const [selectedStock, setSelectedStock] = useState<UserStockWithProductAndProfile | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  
  // UI States
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Calculate stats based on current database state (initialStocks)
  const totalOmzet = initialStocks.reduce((sum, s) => {
    return sum + (s.jumlah_laku * (s.products?.harga_jual || 0));
  }, 0);

  const totalProdukCarried = initialStocks.length;

  // Check if anything is dirty
  const dirtyItems = Object.keys(editedStocks).filter((id) => {
    const stock = initialStocks.find((s) => s.id === id);
    if (!stock) return false;
    return editedStocks[id] !== stock.jumlah_diambil;
  });

  const isDirty = dirtyItems.length > 0;

  // Validation: check if any edited value is less than laku
  let hasValidationError = false;
  let validationMessage = '';

  for (const id of Object.keys(editedStocks)) {
    const stock = initialStocks.find((s) => s.id === id);
    if (stock && editedStocks[id] < stock.jumlah_laku) {
      hasValidationError = true;
      validationMessage = `Jumlah diambil untuk ${stock.products?.nama_produk || 'produk'} tidak boleh kurang dari jumlah laku (${stock.jumlah_laku}).`;
      break;
    }
  }

  function handleInputChange(stockId: string, valStr: string) {
    const val = parseInt(valStr);
    const value = isNaN(val) ? 0 : val;
    setErrorMsg(null);
    setSuccessMsg(null);
    
    setEditedStocks((prev) => {
      const updated = { ...prev, [stockId]: value };
      // If it matches original value, remove it from changes to clean up
      const stock = initialStocks.find((s) => s.id === stockId);
      if (stock && value === stock.jumlah_diambil) {
        delete updated[stockId];
      }
      return updated;
    });
  }

  function handleCancelEdit() {
    setEditedStocks({});
    setErrorMsg(null);
    setSuccessMsg(null);
  }

  async function handleBatchSave() {
    if (hasValidationError) return;
    
    const payload = dirtyItems.map((id) => ({
      stockId: id,
      newJumlahDiambil: editedStocks[id],
    }));

    if (payload.length === 0) return;

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await batchUpdateStockAllocations(payload);
      if (res.success) {
        setSuccessMsg(res.message || 'Perubahan stok berhasil disimpan.');
        setEditedStocks({});
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

  function openDelete(stock: UserStockWithProductAndProfile) {
    setSelectedStock(stock);
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsDeleteOpen(true);
  }

  async function handleDeleteConfirm() {
    if (!selectedStock) return;
    
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await deleteStockAllocation(selectedStock.id);
      if (res.success) {
        setSuccessMsg(res.message || 'Alokasi stok berhasil ditarik/dihapus.');
        setIsDeleteOpen(false);
        setSelectedStock(null);
        
        // Clean up from edited stocks if it was there
        if (editedStocks[selectedStock.id] !== undefined) {
          setEditedStocks((prev) => {
            const updated = { ...prev };
            delete updated[selectedStock.id];
            return updated;
          });
        }
        
        router.refresh();
      } else {
        setErrorMsg(res.error || 'Gagal menarik alokasi.');
      }
    } catch (e) {
      setErrorMsg((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function handleExportDetail() {
    const dataToExport = initialStocks.map((stock) => {
      const val = editedStocks[stock.id] !== undefined ? editedStocks[stock.id] : stock.jumlah_diambil;
      const sisa = val - stock.jumlah_laku;
      const omzet = stock.jumlah_laku * (stock.products?.harga_jual || 0);
      return {
        'Nama Produk': stock.products?.nama_produk || '-',
        'Bawa (Awal)': val,
        'Laku (Terjual)': stock.jumlah_laku,
        'Sisa Bawaan': sisa,
        'Harga Jual': Number(stock.products?.harga_jual || 0),
        'Omzet': omzet,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Stok Bawaan');

    const dateStr = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).replace(/\s/g, '');

    XLSX.writeFile(workbook, `Rekap_Stok_${member.nama_lengkap.replace(/\s/g, '_')}_${dateStr}.xlsx`);
  }

  return (
    <div className="space-y-6">
      {/* Top Bar with Back Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/monitoring"
            className="w-10 h-10 bg-white border border-border hover:bg-surface-hover text-text-secondary rounded-xl flex items-center justify-center transition-all active:scale-95 cursor-pointer"
            title="Kembali ke Pantau Member"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <span className="text-[10px] font-extrabold text-usm-primary uppercase tracking-wider block">
              Detail Alokasi & Riwayat Member
            </span>
            <h2 className="text-xl font-bold text-text-primary mt-0.5">
              {member.nama_lengkap}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {totalProdukCarried > 0 && (
            <button
              onClick={handleExportDetail}
              className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Export Excel Member
            </button>
          )}
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Card 1: Revenue */}
        <div className="bg-gradient-to-br from-success-bg/60 to-success-bg border border-success/25 rounded-2xl p-5 flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-success uppercase tracking-wider block">
              Omzet Penjualan Sementara
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-text-primary">
              Rp {totalOmzet.toLocaleString('id-ID')}
            </h3>
          </div>
          <div className="w-12 h-12 bg-success text-white rounded-xl flex items-center justify-center shadow-lg shadow-success/20 shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Products Count */}
        <div className="bg-white border border-border rounded-2xl p-5 flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">
              Jumlah Produk Bawaan
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-text-primary">
              {totalProdukCarried} Jenis Jajanan
            </h3>
          </div>
        </div>
      </div>

      {/* Notification Messages */}
      {successMsg && (
        <div className="p-4 bg-success-bg text-success border border-success/15 rounded-2xl text-sm font-semibold flex items-center gap-2.5 animate-fade-in shadow-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0 animate-bounce" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-danger-bg text-danger border border-danger/15 rounded-2xl text-sm font-semibold flex items-center gap-2.5 animate-fade-in shadow-sm">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {hasValidationError && (
        <div className="p-4 bg-warning-bg text-warning border border-warning/15 rounded-2xl text-sm font-semibold flex items-center gap-2.5 animate-fade-in shadow-sm">
          <AlertTriangle className="w-5 h-5 shrink-0 animate-pulse" />
          <span>{validationMessage}</span>
        </div>
      )}

      {/* Main Stock Allocation Table Form */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-bold text-text-primary">
            Daftar Barang Bawaan Jualan
          </h3>
          {isDirty && (
            <span className="text-xs text-warning bg-warning-bg border border-warning/10 px-2.5 py-0.5 rounded-full font-bold animate-pulse">
              Ada perubahan belum disimpan
            </span>
          )}
        </div>

        {initialStocks.length === 0 ? (
          <div className="p-10 text-center text-text-muted text-sm">
            Member ini belum memiliki alokasi barang bawaan jualan. Anda bisa memberikan alokasi dari menu{' '}
            <Link href="/admin/distribution" className="text-usm-primary font-bold hover:underline">
              Distribusi Stok
            </Link>
            .
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-alt border-b border-border">
                  <th className="text-left px-5 py-3 font-semibold text-text-secondary">
                    Produk
                  </th>
                  <th className="text-center px-5 py-3 font-semibold text-text-secondary w-36">
                    Bawa (Awal)
                  </th>
                  <th className="text-center px-5 py-3 font-semibold text-text-secondary w-28">
                    Terjual (Laku)
                  </th>
                  <th className="text-center px-5 py-3 font-semibold text-text-secondary w-28">
                    Sisa
                  </th>
                  <th className="text-right px-5 py-3 font-semibold text-text-secondary">
                    Omzet Sementara
                  </th>
                  <th className="text-center px-5 py-3 font-semibold text-text-secondary w-24">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {initialStocks.map((stock) => {
                  const val = editedStocks[stock.id] !== undefined ? editedStocks[stock.id] : stock.jumlah_diambil;
                  const sisa = val - stock.jumlah_laku;
                  const isInvalid = val < stock.jumlah_laku;
                  const isChanged = val !== stock.jumlah_diambil;
                  const omzet = stock.jumlah_laku * (stock.products?.harga_jual || 0);

                  return (
                    <tr
                      key={stock.id}
                      className={`transition-colors hover:bg-surface-alt/40 ${
                        isChanged ? 'bg-warning-bg/5' : ''
                      } ${isInvalid ? 'bg-danger-bg/10' : ''}`}
                    >
                      <td className="px-5 py-4 font-semibold text-text-primary">
                        {stock.products?.nama_produk || '-'}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="relative inline-block w-28">
                          <input
                            type="number"
                            min={stock.jumlah_laku}
                            value={val}
                            onChange={(e) => handleInputChange(stock.id, e.target.value)}
                            disabled={loading}
                            className={`w-full text-center py-1.5 px-2.5 rounded-lg border text-sm font-semibold bg-surface border-border focus:outline-none focus:ring-2 focus:ring-usm-primary/20 ${
                              isInvalid
                                ? 'border-danger ring-danger/10 text-danger focus:border-danger'
                                : isChanged
                                ? 'border-warning ring-warning/10 text-warning focus:border-warning'
                                : 'text-text-primary focus:border-usm-primary'
                            }`}
                          />
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="inline-flex items-center justify-center min-w-[2rem] px-2.5 py-0.5 rounded-full bg-success-bg text-success font-bold text-xs border border-success/10">
                          {stock.jumlah_laku}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center font-extrabold">
                        <span
                          className={`inline-flex items-center justify-center min-w-[2rem] px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            sisa === 0
                              ? 'bg-success-bg text-success border border-success/10'
                              : sisa <= 3
                              ? 'bg-warning-bg text-warning border border-warning/10'
                              : 'bg-surface-alt text-text-secondary'
                          }`}
                        >
                          {sisa}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right font-semibold text-text-primary">
                        Rp {omzet.toLocaleString('id-ID')}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={() => openDelete(stock)}
                          disabled={loading}
                          className="p-1.5 bg-danger-bg text-danger hover:bg-danger hover:text-white rounded-lg transition-all active:scale-[0.9] cursor-pointer disabled:opacity-50"
                          title="Tarik / Hapus Alokasi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Floating Save Actions Bar */}
      {isDirty && (
        <div className="bg-white border border-border shadow-lg rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-scale-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
            <span className="text-xs text-text-secondary font-medium">
              Anda memiliki {dirtyItems.length} perubahan jumlah stok awal yang belum disimpan.
            </span>
          </div>
          <div className="flex gap-2.5 w-full sm:w-auto shrink-0">
            <button
              onClick={handleCancelEdit}
              disabled={loading}
              className="flex-1 sm:flex-initial px-4 py-2 border border-border bg-surface-alt hover:bg-surface-hover text-text-secondary text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
            <button
              onClick={handleBatchSave}
              disabled={loading || hasValidationError}
              className="flex-1 sm:flex-initial px-5 py-2 bg-usm-primary hover:bg-usm-primary-dark disabled:bg-usm-primary/50 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-55"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Simpan Semua Perubahan'
              )}
            </button>
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
                Yakin ingin menarik kembali sisa stok ini dari member?
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-surface-alt rounded-2xl p-4 border border-border space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="font-semibold text-text-secondary">Nama Member:</span>
                <span className="font-bold text-text-primary">{member.nama_lengkap}</span>
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
                  Jika Anda hanya ingin mengurangi atau menyesuaikan sisa stok barang bawaannya tanpa merusak riwayat omzet, silakan gunakan edit input di tabel utama lalu simpan.
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
                onClick={handleDeleteConfirm}
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
