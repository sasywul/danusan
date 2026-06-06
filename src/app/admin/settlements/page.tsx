import { getSetoranForAdmin } from '@/actions/setoran';
import { SettlementTabs } from './settlement-tabs';
import { Receipt, HelpCircle } from 'lucide-react';

export const revalidate = 0; // Always fetch fresh database records on render

export default async function AdminSettlementsPage() {
  const setoranList = await getSetoranForAdmin();

  // Convert raw DB profiles query type to match prop interface
  const formattedSetoran = (setoranList || []).map((s) => ({
    id: s.id,
    user_id: s.user_id,
    total_uang_disetor: s.total_uang_disetor,
    status_setoran: s.status_setoran,
    created_at: s.created_at,
    updated_at: s.updated_at,
    profiles: s.profiles ? { nama_lengkap: s.profiles.nama_lengkap } : null,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-usm-primary/10 rounded-2xl flex items-center justify-center">
            <Receipt className="w-6 h-6 text-usm-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-primary">Manajemen Setoran</h2>
            <p className="text-xs text-text-muted mt-0.5">
              Kelola, verifikasi, dan setujui uang setoran masuk dari hasil penjualan member.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Tabs */}
      <SettlementTabs initialSetoran={formattedSetoran} />

      {/* Info helper card */}
      <div className="bg-info-bg/40 border border-info/15 rounded-3xl p-4 flex gap-3 text-xs text-text-secondary">
        <HelpCircle className="w-5 h-5 text-info shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-text-primary">Panduan Verifikasi Setoran</p>
          <p className="leading-relaxed leading-normal">
            Harap pastikan uang tunai atau bukti transfer fisik telah diterima dan jumlahnya sesuai dengan nominal yang tertera 
            sebelum mengeklik tombol <strong>Approve</strong>. Setoran yang telah disetujui akan masuk ke rekap keuangan di dashboard utama admin.
          </p>
        </div>
      </div>
    </div>
  );
}
