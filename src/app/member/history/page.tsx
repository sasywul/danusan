import { getPenjualanForMember } from '@/actions/penjualan';
import { SalesHistory } from '@/components/member/sales-history';

export const revalidate = 0; // Always fetch fresh data

export default async function MemberHistoryPage() {
  const penjualanList = await getPenjualanForMember();

  return (
    <div className="animate-fade-in pb-4">
      <SalesHistory initialSales={penjualanList} />
    </div>
  );
}
