import { notFound } from 'next/navigation';
import { dbService } from '@/lib/dbWrapper';
import ProductClient from '@/components/store/ProductClient';

export const revalidate = 0;

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  // Await params Promise (Next.js 15+ requirement)
  const { slug } = await params;
  
  const product = await dbService.getProductBySlug(slug);
  if (!product) {
    notFound();
  }

  // Fetch related products (same category, excluding current product)
  const allProducts = await dbService.getProducts();
  const related = allProducts
    .filter((p: any) => p.categoryId === product.categoryId && p.id !== product.id)
    .slice(0, 3);

  // Fetch frequently bought together suggestions (take the next product in catalog)
  const frequentlyBought = allProducts
    .filter((p: any) => p.id !== product.id)
    .slice(0, 1);

  return (
    <ProductClient
      product={JSON.parse(JSON.stringify(product))}
      relatedProducts={JSON.parse(JSON.stringify(related))}
      frequentlyBought={JSON.parse(JSON.stringify(frequentlyBought))}
    />
  );
}
