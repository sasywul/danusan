'use client';

import { useState } from 'react';
import { login } from '@/actions/auth';
import { Package, Eye, EyeOff, Loader2, KeyRound, ShieldAlert } from 'lucide-react';

export default function LoginPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);

    // Pre-process FormData based on active mode
    if (!isAdminMode) {
      const kode = (formData.get('kode_member') as string || '').trim();
      if (!kode) {
        setError('Kode member harus diisi.');
        setLoading(false);
        return;
      }
      // Construct email and password automatically
      const email = `${kode.toLowerCase()}@danusan.local`;
      const password = `${kode}-pass123`;
      formData.set('email', email);
      formData.set('password', password);
    } else {
      const email = (formData.get('email') as string || '').trim();
      const password = formData.get('password') as string;
      if (!email || !password) {
        setError('Email dan password harus diisi.');
        setLoading(false);
        return;
      }
    }

    try {
      const result = await login(formData);
      if (result?.error) {
        setError(result.error);
      }
    } catch (e) {
      // redirect() throws a NEXT_REDIRECT error which is expected
      // Any other error means something went wrong
      const msg = e instanceof Error ? e.message : 'Terjadi kesalahan.';
      if (!msg.includes('NEXT_REDIRECT')) {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-usm-primary-dark via-usm-primary to-usm-primary-light px-4">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-usm-accent/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-usm-accent/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none" />
      <div className="absolute top-1/2 left-10 w-3 h-3 bg-usm-accent/20 rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-10 w-4 h-4 bg-white/10 rounded-full pointer-events-none" />

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md animate-scale-in">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
          
          {/* Logo Area */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4 relative group">
              <img
                src="/logo.png"
                alt="Danusan Logo"
                className="w-16 h-16 rounded-2xl object-cover shadow-lg group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <h1 className="text-2xl font-extrabold text-text-primary tracking-tight">
              {isAdminMode ? 'Login Admin' : 'Login Member'}
            </h1>
            <p className="text-xs text-text-secondary mt-1 font-medium">
              Danusan USM &middot; 
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-danger-bg border border-danger/20 rounded-2xl text-xs text-danger font-medium flex items-start gap-2.5 animate-fade-in">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isAdminMode ? (
              /* MEMBER MODE FORM (Default) - Only Member Code */
              <div className="animate-fade-in">
                <label
                  htmlFor="kode_member"
                  className="block text-xs font-semibold text-text-primary mb-1.5"
                >
                  Kode Member
                </label>
                <input
                  id="kode_member"
                  name="kode_member"
                  type="text"
                  required
                  placeholder="Contoh: USM-001"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-white text-text-primary placeholder:text-text-muted focus:border-usm-primary focus:ring-2 focus:ring-usm-primary/20 outline-none text-sm transition-all"
                />
              </div>
            ) : (
              /* ADMIN MODE FORM - Email and Password */
              <div className="space-y-5 animate-fade-in">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-semibold text-text-primary mb-1.5"
                  >
                    Email Admin
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="admin@usm.ac.id"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-white text-text-primary placeholder:text-text-muted focus:border-usm-primary focus:ring-2 focus:ring-usm-primary/20 outline-none text-sm transition-all"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-xs font-semibold text-text-primary mb-1.5"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      className="w-full px-4 py-3 rounded-xl border border-border bg-white text-text-primary placeholder:text-text-muted focus:border-usm-primary focus:ring-2 focus:ring-usm-primary/20 outline-none text-sm transition-all pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary p-1"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-usm-primary to-usm-primary-light text-white font-bold rounded-xl hover:from-usm-primary-dark hover:to-usm-primary active:scale-[0.98] disabled:from-blue-400 disabled:to-blue-400/80 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-md shadow-usm-primary/20 flex items-center justify-center mt-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Memproses...
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4 mr-2" />
                  {isAdminMode ? 'Masuk Panel Admin' : 'Masuk Jualan'}
                </>
              )}
            </button>
          </form>

          {/* Toggle Mode Switcher */}
          <div className="text-center mt-5">
            <button
              type="button"
              onClick={() => {
                setIsAdminMode(!isAdminMode);
                setError('');
              }}
              className="text-xs font-semibold text-text-secondary hover:text-usm-primary transition-all cursor-pointer underline decoration-dotted"
            >
              {isAdminMode ? 'Kembali ke Login Member' : 'Login sebagai Pengurus/Admin'}
            </button>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-border flex flex-col items-center gap-1">
            <p className="text-[10px] text-center text-text-muted font-medium">
              Universitas Semarang &middot; HIMMATISI
            </p>
            <p className="text-[9px] text-center text-text-muted/65">
              Hubungi Administrator jika belum memiliki akun
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
