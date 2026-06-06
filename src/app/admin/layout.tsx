'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { logout } from '@/actions/auth';
import { getPendingSetoranCount } from '@/actions/setoran';
import {
  LayoutDashboard,
  Package,
  Truck,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Users,
  Eye,
  Receipt,
} from 'lucide-react';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Produk', icon: Package },
  { href: '/admin/distribution', label: 'Distribusi', icon: Truck },
  { href: '/admin/members', label: 'Members', icon: Users },
  { href: '/admin/monitoring', label: 'Pantau Member', icon: Eye },
  { href: '/admin/settlements', label: 'Setoran', icon: Receipt },
];

function SidebarContent({
  pathname,
  pendingCount,
  onNavigate,
}: {
  pathname: string;
  pendingCount: number;
  onNavigate?: () => void;
}) {
  return (
    <>
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Danusan Logo"
            className="w-10 h-10 rounded-xl object-cover shadow-md"
          />
          <div>
            <h2 className="font-bold text-white text-lg leading-none">Danusan</h2>
            <span className="text-xs text-white/50">Admin Panel</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href);
          const hasBadge = item.href === '/admin/settlements' && pendingCount > 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'text-usm-accent' : 'text-white/40 group-hover:text-white/70'}`} />
              <span>{item.label}</span>
              {hasBadge && (
                <span className="ml-auto inline-flex items-center justify-center w-5 h-5 text-[10px] font-extrabold text-white bg-danger rounded-full animate-pulse">
                  {pendingCount}
                </span>
              )}
              {isActive && !hasBadge && (
                <ChevronRight className="w-4 h-4 ml-auto text-usm-accent" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-white/10">
        <form action={logout}>
          <button
            type="submit"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/50 hover:text-white hover:bg-white/5 transition-all w-full"
          >
            <LogOut className="w-5 h-5" />
            Keluar
          </button>
        </form>
      </div>
    </>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    async function fetchCount() {
      const count = await getPendingSetoranCount();
      setPendingCount(count);
    }
    fetchCount();
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-gradient-to-b from-usm-primary-dark to-usm-primary fixed inset-y-0 left-0 z-30">
        <SidebarContent pathname={pathname} pendingCount={pendingCount} />
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-usm-primary-dark to-usm-primary flex flex-col transform transition-transform duration-300 lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute top-4 right-4 text-white/60 hover:text-white p-1"
        >
          <X className="w-5 h-5" />
        </button>
        <SidebarContent
          pathname={pathname}
          pendingCount={pendingCount}
          onNavigate={() => setSidebarOpen(false)}
        />
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-border px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl hover:bg-surface-alt transition-colors"
          >
            <Menu className="w-5 h-5 text-text-primary" />
          </button>
          <h1 className="font-bold text-text-primary">Danusan Admin</h1>
        </header>

        <div className="p-4 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
