import { getProducts } from '@/actions/products';
import { ProductTable } from '@/components/admin/product-table';

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Master Produk</h1>
        <p className="text-text-secondary mt-1">
          Kelola daftar jajanan dan produk konsinyasi
        </p>
      </div>

      <ProductTable products={products} />
    </div>
  );
}
