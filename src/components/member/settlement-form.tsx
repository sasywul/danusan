'use client';

import { useState } from 'react';
import { submitSetoran } from '@/actions/setoran';
import { Loader2, Send, Wallet } from 'lucide-react';

interface SettlementFormProps {
  totalOmzet: number;
  outstanding: number;
}

export function SettlementForm({ totalOmzet, outstanding }: SettlementFormProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setMessage(null);
    const result = await submitSetoran(formData);

    if (result.success) {
      setMessage({ type: 'success', text: result.message || 'Berhasil!' });
    } else {
      setMessage({ type: 'error', text: result.error || 'Gagal.' });
    }
    setLoading(false);
  }

  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border flex items-center gap-2">
        <Wallet className="w-5 h-5 text-usm-primary" />
        <h3 className="font-semibold text-text-primary text-sm">
          Kirim Setoran
        </h3>
      </div>

      {message && (
        <div
          className={`mx-4 mt-4 p-3 rounded-xl text-sm font-medium animate-fade-in ${
            message.type === 'success'
              ? 'bg-success-bg text-success border border-success/20'
              : 'bg-danger-bg text-danger border border-danger/20'
          }`}
        >
          {message.text}
        </div>
      )}

      <form action={handleSubmit} className="p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">
            Jumlah Uang Disetor (Rp)
          </label>
          <input
            name="total_uang_disetor"
            type="number"
            min="1"
            max={outstanding > 0 ? outstanding : undefined}
            required
            placeholder={outstanding > 0 ? `Max: ${outstanding.toLocaleString('id-ID')}` : '0'}
            className="w-full px-4 py-4 min-h-[48px] rounded-xl border border-border bg-white text-text-primary placeholder:text-text-muted focus:border-usm-primary focus:ring-2 focus:ring-usm-primary/20 outline-none text-lg font-medium"
          />
          <div className="mt-2 space-y-1">
            <p className="text-xs text-text-muted">
              Total omzet:{' '}
              <strong>Rp {totalOmzet.toLocaleString('id-ID')}</strong>
            </p>
            {outstanding > 0 && (
              <p className="text-xs text-warning font-medium">
                Tagihan belum disetor:{' '}
                <strong>Rp {outstanding.toLocaleString('id-ID')}</strong>
              </p>
            )}
            {outstanding <= 0 && totalOmzet > 0 && (
              <p className="text-xs text-success font-medium">
                ✓ Semua tagihan sudah lunas!
              </p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || outstanding <= 0}
          className="w-full py-4 px-4 min-h-[48px] bg-gradient-to-r from-usm-accent-dark to-usm-accent text-usm-primary-dark font-bold rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 active:scale-95 active:brightness-90 shadow-lg shadow-usm-accent/20 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Mengirim...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Kirim Setoran
            </>
          )}
        </button>
      </form>
    </div>
  );
}
