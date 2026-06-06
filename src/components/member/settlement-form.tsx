'use client';

import { useState } from 'react';
import { submitSetoran } from '@/actions/setoran';
import { Loader2, Send, Wallet } from 'lucide-react';

interface SettlementFormProps {
  totalOmzet: number;
}

export function SettlementForm({ totalOmzet }: SettlementFormProps) {
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
            required
            placeholder={`cth: ${totalOmzet}`}
            className="w-full px-4 py-3 rounded-xl border border-border bg-white text-text-primary placeholder:text-text-muted focus:border-usm-primary focus:ring-2 focus:ring-usm-primary/20 outline-none text-lg font-medium"
          />
          <p className="text-xs text-text-muted mt-1.5">
            Total omzet Anda saat ini:{' '}
            <strong>Rp {totalOmzet.toLocaleString('id-ID')}</strong>
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 px-4 bg-gradient-to-r from-usm-accent-dark to-usm-accent text-usm-primary-dark font-bold rounded-xl hover:from-usm-accent hover:to-usm-accent-light disabled:opacity-50 transition-all flex items-center justify-center gap-2 active:scale-[0.97] shadow-lg shadow-usm-accent/20"
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
