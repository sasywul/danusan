'use client';

import { useState } from 'react';
import { approveSetoran } from '@/actions/setoran';
import { Check, Loader2, Clock, CheckCircle2, Download } from 'lucide-react';
import type { SetoranWithProfile } from '@/types/database';
import * as XLSX from 'xlsx';

interface SetoranTableProps {
  setoranList: SetoranWithProfile[];
}

export function SetoranTable({ setoranList }: SetoranTableProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleApprove(setoranId: string) {
    setLoadingId(setoranId);
    await approveSetoran(setoranId);
    setLoadingId(null);
  }

  function handleExportSetoran() {
    const dataToExport = setoranList.map((setoran) => {
      return {
        'Nama Member': setoran.profiles?.nama_lengkap || '-',
        'Total Setoran': Number(setoran.total_uang_disetor),
        'Status': setoran.status_setoran,
        'Tanggal': new Date(setoran.created_at).toLocaleString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Setoran');

    const dateStr = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).replace(/\s/g, '');

    XLSX.writeFile(workbook, `Rekap_Setoran_Danusan_${dateStr}.xlsx`);
  }

  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-border flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">
          Persetujuan Setoran
        </h2>
        {setoranList.length > 0 && (
          <button
            onClick={handleExportSetoran}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export Excel
          </button>
        )}
      </div>

      {setoranList.length === 0 ? (
        <div className="p-8 text-center text-text-muted">
          Belum ada setoran masuk.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-alt">
                <th className="text-left px-5 py-3 font-semibold text-text-secondary">
                  Member
                </th>
                <th className="text-right px-5 py-3 font-semibold text-text-secondary">
                  Total Setoran
                </th>
                <th className="text-center px-5 py-3 font-semibold text-text-secondary">
                  Status
                </th>
                <th className="text-center px-5 py-3 font-semibold text-text-secondary">
                  Tanggal
                </th>
                <th className="text-center px-5 py-3 font-semibold text-text-secondary">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {setoranList.map((setoran) => (
                <tr
                  key={setoran.id}
                  className="hover:bg-surface-alt/50 transition-colors"
                >
                  <td className="px-5 py-3.5 font-medium text-text-primary">
                    {setoran.profiles?.nama_lengkap || '-'}
                  </td>
                  <td className="px-5 py-3.5 text-right font-semibold text-text-primary">
                    Rp {setoran.total_uang_disetor.toLocaleString('id-ID')}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    {setoran.status_setoran === 'pending' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-warning-bg text-warning text-xs font-semibold">
                        <Clock className="w-3.5 h-3.5" />
                        Pending
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success-bg text-success text-xs font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Approved
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-center text-text-secondary text-xs">
                    {new Date(setoran.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    {setoran.status_setoran === 'pending' ? (
                      <button
                        onClick={() => handleApprove(setoran.id)}
                        disabled={loadingId === setoran.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success text-white text-xs font-semibold hover:bg-success/90 disabled:opacity-50 transition-all active:scale-95"
                      >
                        {loadingId === setoran.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        Approve
                      </button>
                    ) : (
                      <span className="text-xs text-text-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

