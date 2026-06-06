import { getMembers } from '@/actions/distribution';
import { getActiveProducts } from '@/actions/products';
import { DistributionForm } from '@/components/admin/distribution-form';

export default async function DistributionPage() {
  const [members, products] = await Promise.all([
    getMembers(),
    getActiveProducts(),
  ]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Distribusi Stok</h1>
        <p className="text-text-secondary mt-1">
          Alokasikan stok jajanan ke akun member
        </p>
      </div>

      <DistributionForm members={members} products={products} />
    </div>
  );
}
