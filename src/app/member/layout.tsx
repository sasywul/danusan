'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '@/actions/auth';
import { ShoppingBag, Receipt, LogOut, History } from 'lucide-react';

const navItems = [
  { href: '/member', label: 'Penjualan', icon: ShoppingBag },
  { href: '/member/history', label: 'Riwayat', icon: History },
  { href: '/member/settlement', label: 'Setoran', icon: Receipt },
];

export default function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top header */}
      <header className="sticky top-0 z-20 bg-gradient-to-r from-usm-primary-dark to-usm-primary px-4 py-3 shadow-lg shadow-usm-primary/10">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="Danusan Logo"
              className="w-8 h-8 rounded-lg object-cover"
            />
            <div>
              <h1 className="font-bold text-white text-sm leading-none">Danusan</h1>
              <span className="text-[10px] text-white/50">Titip Jual USM</span>
            </div>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all"
              title="Keluar"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </form>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-4 pb-32">
        {children}
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 w-full z-50 bg-white border-t border-border safe-area-inset-bottom">
        <div className="max-w-lg mx-auto flex">
          {navItems.map((item) => {
            const isActive =
              item.href === '/member'
                ? pathname === '/member'
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 flex flex-col items-center gap-1 py-3 relative transition-colors ${
                  isActive
                    ? 'text-usm-primary'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                <item.icon
                  className={`w-5 h-5 ${isActive ? 'text-usm-primary' : ''}`}
                />
                <span className="text-[11px] font-medium">{item.label}</span>
                {isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-usm-primary rounded-full" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
