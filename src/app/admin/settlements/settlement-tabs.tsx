'use client';

import { useState } from 'react';
import { approveSetoran } from '@/actions/setoran';
import { Check, Loader2, DollarSign, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface SettlementRecord {
  id: string;
  user_id: string;
  total_uang_disetor: number;
  status_setoran: 'pending' | 'approved';
  created_at: string;
  updated_at: string;
  profiles: {
    nama_lengkap: string;
  } | null;
}

interface SettlementTabsProps {
  initialSetoran: SettlementRecord[];
}

export function SettlementTabs({ initialSetoran }: SettlementTabsProps) {
  const [activeTab, setActiveTab] = useState<'pending' | 'approved'>('pending');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Group data
  const pendingSetoran = initialSetoran.filter((s) => s.status_setoran === 'pending');
  const approvedSetoran = initialSetoran.filter((s) => s.status_setoran === 'approved');

  async function handleApprove(id: string) {
    setLoadingId(id);
    setToast(null);

    try {
      const result = await approveSetoran(id);
      if (result.success) {
        setToast({ type: 'success', text: result.message || 'Setoran berhasil disetujui.' });
        // Clear toast after 3 seconds
        setTimeout(() => setToast(null), 3000);
      } else {
        setToast({ type: 'error', text: result.error || 'Gagal menyetujui setoran.' });
      }
    } catch (e) {
      setToast({
        type: 'error',
        text: e instanceof Error ? e.message : 'Terjadi kesalahan koneksi.',
      });
    } finally {
      setLoadingId(null);
    }
  }

  const currentRecords = activeTab === 'pending' ? pendingSetoran : approvedSetoran;

  return (
    <div className="space-y-6">
      
      {/* Toast Alert */}
      {toast && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-start gap-2.5 animate-fade-in ${
            toast.type === 'success'
              ? 'bg-success-bg text-success border border-success/20'
              : 'bg-danger-bg text-danger border border-danger/20'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Tab Selectors */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-sm transition-all outline-none ${
            activeTab === 'pending'
              ? 'border-usm-primary text-usm-primary'
              : 'border-transparent text-text-muted hover:text-text-secondary'
          }`}
        >
          <span>Menunggu Persetujuan</span>
          {pendingSetoran.length > 0 && (
            <span className="inline-flex items-center justify-center px-2 py-0.5 text-3xs font-extrabold leading-none text-white bg-danger rounded-full">
              {pendingSetoran.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('approved')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-sm transition-all outline-none ${
            activeTab === 'approved'
              ? 'border-usm-primary text-usm-primary'
              : 'border-transparent text-text-muted hover:text-text-secondary'
          }`}
        >
          <span>Riwayat Disetujui</span>
          <span className="inline-flex items-center justify-center px-2 py-0.5 text-3xs font-bold leading-none text-text-muted bg-surface-alt rounded-full">
            {approvedSetoran.length}
          </span>
        </button>
      </div>

      {/* Table Content */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
        {currentRecords.length === 0 ? (
          <div className="p-12 text-center text-text-muted text-sm space-y-2">
            <DollarSign className="w-12 h-12 mx-auto text-text-muted/30" />
            <p className="font-bold text-text-primary">Tidak Ada Catatan Setoran</p>
            <p className="text-xs">
              {activeTab === 'pending'
                ? 'Semua setoran member telah disetujui dan diverifikasi.'
                : 'Belum ada riwayat setoran uang yang disetujui.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-surface-alt border-b border-border">
                  <th className="px-4 py-2 font-bold text-text-secondary text-xs uppercase tracking-wider">
                    Nama Member
                  </th>
                  <th className="px-4 py-2 font-bold text-text-secondary text-xs uppercase tracking-wider text-right">
                    Nominal Disetor
                  </th>
                  <th className="px-4 py-2 font-bold text-text-secondary text-xs uppercase tracking-wider">
                    Tanggal / Waktu
                  </th>
                  <th className="px-4 py-2 font-bold text-text-secondary text-xs uppercase tracking-wider text-center">
                    Status
                  </th>
                  {activeTab === 'pending' && (
                    <th className="px-4 py-2 font-bold text-text-secondary text-xs uppercase tracking-wider text-center w-36">
                      Aksi
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {currentRecords.map((setoran) => (
                  <tr key={setoran.id} className="hover:bg-slate-50 transition-colors">
                    {/* Member Name */}
                    <td className="px-4 py-2 font-bold text-text-primary text-sm">
                      {setoran.profiles?.nama_lengkap || 'Tidak Dikenal'}
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-2 text-right font-extrabold text-text-primary text-sm">
                      Rp {setoran.total_uang_disetor.toLocaleString('id-ID')}
                    </td>

                    {/* Date / Time */}
                    <td className="px-4 py-2 text-text-secondary text-xs">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-text-muted shrink-0" />
                        <span>
                          {new Date(setoran.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}{' '}
                          &middot;{' '}
                          {new Date(setoran.created_at).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-2 text-center">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-3xs font-extrabold uppercase tracking-wider ${
                          setoran.status_setoran === 'pending'
                            ? 'bg-warning-bg text-warning'
                            : 'bg-success-bg text-success'
                        }`}
                      >
                        {setoran.status_setoran}
                      </span>
                    </td>

                    {/* Action Button */}
                    {activeTab === 'pending' && (
                      <td className="px-4 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleApprove(setoran.id)}
                          disabled={loadingId !== null}
                          className="w-full py-1 px-3 bg-usm-primary hover:bg-usm-primary-dark text-white font-bold rounded-xl text-2xs flex items-center justify-center gap-1 active:scale-[0.97] disabled:opacity-50 transition-all cursor-pointer shadow-sm"
                        >
                          {loadingId === setoran.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Check className="w-3 h-3" />
                          )}
                          Approve
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
