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
    <main className="w-full max-w-7xl mx-auto px-4 md:px-8 min-h-screen pb-36 relative bg-white flex flex-col">
      {/* Top header */}
      <header className="sticky top-0 z-20 bg-gradient-to-r from-usm-primary-dark to-usm-primary px-4 py-3 shadow-lg shadow-usm-primary/10 rounded-b-2xl">
        <div className="flex items-center justify-between">
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
              className="w-12 h-12 rounded-xl text-white/50 active:text-white active:bg-white/10 transition-all flex items-center justify-center cursor-pointer"
              title="Keluar"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </form>
        </div>
      </header>

      {/* Content wrapper */}
      <div className="flex-1 w-full py-4">
        {children}
      </div>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-7xl mx-auto z-50 bg-white border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] flex justify-around pt-3 pb-6 px-4 md:px-8">
        {navItems.map((item) => {
          const isActive =
            item.href === '/member'
              ? pathname === '/member'
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-grow flex flex-col items-center gap-1 py-1 relative transition-all active:scale-95 ${
                isActive
                  ? 'text-usm-primary'
                  : 'text-text-muted active:text-text-secondary'
              }`}
            >
              <item.icon
                className={`w-5.5 h-5.5 ${isActive ? 'text-usm-primary' : ''}`}
              />
              <span className="text-[11px] font-semibold">{item.label}</span>
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-usm-primary rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>
    </main>
  );
}
