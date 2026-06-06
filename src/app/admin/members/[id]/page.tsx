import { createClient } from '@/lib/supabase/server';
import { MemberStockManager } from '@/components/admin/member-stock-manager';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

export const revalidate = 0; // Always fetch fresh data

export default async function MemberDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch member profile
  const { data: member, error: memberErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .eq('role', 'member')
    .single();

  if (memberErr || !member) {
    notFound();
  }

  // Fetch stocks allocated to this member
  const { data: stocks, error: stocksErr } = await supabase
    .from('user_stocks')
    .select('*, products(*)')
    .eq('user_id', id)
    .order('created_at', { ascending: false });

  if (stocksErr) {
    throw new Error(stocksErr.message);
  }

  // Map profile to each stock record for type safety matching UserStockWithProductAndProfile
  const typedStocks = (stocks || []).map((s) => ({
    ...s,
    profiles: member,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <MemberStockManager member={member} initialStocks={typedStocks} />
    </div>
  );
}
