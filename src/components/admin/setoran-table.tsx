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
              <tr className="bg-surface-alt border-b border-border">
                <th className="text-left px-4 py-2 font-bold text-text-secondary text-xs uppercase tracking-wider">
                  Member
                </th>
                <th className="text-right px-4 py-2 font-bold text-text-secondary text-xs uppercase tracking-wider">
                  Total Setoran
                </th>
                <th className="text-center px-4 py-2 font-bold text-text-secondary text-xs uppercase tracking-wider">
                  Status
                </th>
                <th className="text-center px-4 py-2 font-bold text-text-secondary text-xs uppercase tracking-wider">
                  Tanggal
                </th>
                <th className="text-center px-4 py-2 font-bold text-text-secondary text-xs uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {setoranList.map((setoran) => (
                <tr
                  key={setoran.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-4 py-2 font-bold text-text-primary text-sm">
                    {setoran.profiles?.nama_lengkap || '-'}
                  </td>
                  <td className="px-4 py-2 text-right font-extrabold text-text-primary text-sm">
                    Rp {setoran.total_uang_disetor.toLocaleString('id-ID')}
                  </td>
                  <td className="px-4 py-2 text-center text-sm">
                    {setoran.status_setoran === 'pending' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-warning-bg text-warning text-xs font-semibold">
                        <Clock className="w-3 h-3" />
                        Pending
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-success-bg text-success text-xs font-semibold">
                        <Check className="w-3.5 h-3.5" />
                        Approved
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-center text-text-secondary text-xs">
                    {new Date(setoran.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-4 py-2 text-center text-sm">
                    {setoran.status_setoran === 'pending' ? (
                      <button
                        onClick={() => handleApprove(setoran.id)}
                        disabled={loadingId === setoran.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-success text-white text-xs font-semibold hover:bg-success/90 disabled:opacity-50 transition-all active:scale-95 cursor-pointer"
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

