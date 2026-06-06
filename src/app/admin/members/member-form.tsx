'use client';

import { useState } from 'react';
import { createMember } from '@/actions/member';
import { Loader2, Plus, Info, CheckCircle, AlertCircle, Copy, Check, ClipboardCheck } from 'lucide-react';

export function MemberForm() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Fields for credentials preview
  const [kodeMember, setKodeMember] = useState('');

  // States for Popup and Clipboard copy
  const [registeredInfo, setRegisteredInfo] = useState<{ nama: string; kode: string } | null>(null);
  const [copied, setCopied] = useState(false);

  function performCopy(nama: string, kode: string) {
    const textToCopy = `Nama: ${nama}\nKode: ${kode}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setLoading(true);
    setMessage(null);

    const formData = new FormData(formElement);
    const nama = (formData.get('nama_lengkap') as string || '').trim();
    const kode = (formData.get('kode_member') as string || '').trim();

    try {
      const result = await createMember(formData);
      if (result.success) {
        setMessage({ type: 'success', text: result.message || 'Member berhasil didaftarkan.' });
        
        // Save registered user details to display in popup modal
        setRegisteredInfo({ nama, kode });

        // Auto-copy details to clipboard
        performCopy(nama, kode);

        formElement.reset();
        setKodeMember('');
      } else {
        setMessage({ type: 'error', text: result.error || 'Gagal mendaftarkan member.' });
      }
    } catch (e) {
      setMessage({
        type: 'error',
        text: e instanceof Error ? e.message : 'Terjadi kesalahan sistem.',
      });
    } finally {
      setLoading(false);
    }
  }

  const generatedEmail = kodeMember ? `${kodeMember.trim().toLowerCase()}@danusan.local` : '[kode_member]@danusan.local';
  const generatedPassword = kodeMember ? `${kodeMember.trim()}-pass123` : '[kode_member]-pass123';

  return (
    <>
      <div className="bg-white rounded-2xl border border-border p-6 shadow-sm space-y-5">
        <div>
          <h3 className="font-bold text-text-primary text-base">Registrasi Member Baru</h3>
          <p className="text-xs text-text-muted mt-0.5">
            Daftarkan anggota staff atau penjaga stand untuk mengakses panel penjualan.
          </p>
        </div>

        {message && (
          <div
            className={`p-4 rounded-xl text-xs font-semibold flex items-start gap-2.5 animate-fade-in ${
              message.type === 'success'
                ? 'bg-success-bg text-success border border-success/20'
                : 'bg-danger-bg text-danger border border-danger/20'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-text-primary mb-1.5">
              Nama Lengkap
            </label>
            <input
              name="nama_lengkap"
              required
              placeholder="cth: Budi Luhur"
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-text-primary text-sm placeholder:text-text-muted focus:border-usm-primary focus:ring-2 focus:ring-usm-primary/20 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-text-primary mb-1.5">
              Kode Member
            </label>
            <input
              name="kode_member"
              required
              placeholder="cth: USM-001"
              value={kodeMember}
              onChange={(e) => setKodeMember(e.target.value.replace(/\s/g, ''))}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-text-primary text-sm placeholder:text-text-muted focus:border-usm-primary focus:ring-2 focus:ring-usm-primary/20 outline-none transition-all"
            />
          </div>

          {/* Credentials Preview */}
          <div className="bg-surface-alt rounded-xl p-3 text-2xs text-text-secondary space-y-1">
            <div className="flex items-center gap-1 text-text-primary font-bold">
              <Info className="w-3.5 h-3.5 text-usm-primary shrink-0" />
              <span>Kredensial Login Otomatis</span>
            </div>
            <p>
              Email: <strong className="text-text-primary">{generatedEmail}</strong>
            </p>
            <p>
              Password: <strong className="text-text-primary">{generatedPassword}</strong>
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-usm-primary hover:bg-usm-primary-dark text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.97]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Mendaftarkan...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Daftarkan Member
            </>
          )}
          </button>
        </form>
      </div>

      {/* Modal Popup for Registration Success and Auto-Copy */}
      {registeredInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/55 backdrop-blur-sm transition-opacity"
            onClick={() => setRegisteredInfo(null)}
          />

          {/* Modal Card */}
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm border border-border p-6 animate-scale-in z-10 space-y-5">
            {/* Header */}
            <div className="text-center space-y-1">
              <div className="w-12 h-12 bg-success-bg text-success rounded-full flex items-center justify-center mx-auto shadow-sm">
                <ClipboardCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-text-primary mt-3">
                Registrasi Berhasil!
              </h3>
              <p className="text-xs text-text-muted">
                Data member telah disalin otomatis ke clipboard.
              </p>
            </div>

            {/* Details Box */}
            <div className="bg-surface-alt rounded-2xl p-4 border border-border space-y-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider block">
                  Nama Lengkap
                </span>
                <span className="text-sm font-extrabold text-text-primary block mt-0.5">
                  {registeredInfo.nama}
                </span>
              </div>
              
              <div className="pt-2.5 border-t border-border/60">
                <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider block">
                  Kode Member
                </span>
                <span className="text-sm font-extrabold text-text-primary font-mono block mt-0.5">
                  {registeredInfo.kode}
                </span>
              </div>
            </div>

            {/* Visual Copy Feedback Message */}
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-success-bg border border-success/15 rounded-full text-2xs font-semibold text-success animate-pulse">
                <Check className="w-3.5 h-3.5" />
                Telah Disalin Otomatis
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => performCopy(registeredInfo.nama, registeredInfo.kode)}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-[0.97] ${
                  copied
                    ? 'bg-success-bg text-success border border-success/20 animate-scale-in'
                    : 'bg-surface-alt text-text-secondary border border-border hover:bg-surface-hover'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Tersalin!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Salin Ulang
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setRegisteredInfo(null)}
                className="flex-1 py-2.5 px-4 bg-usm-primary hover:bg-usm-primary-dark text-white font-bold rounded-xl text-xs shadow-sm transition-all active:scale-[0.97]"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
