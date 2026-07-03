import { dbService } from '@/lib/dbWrapper';
import HomeClient from '@/components/store/HomeClient';

// Disable caching for dev so database additions reflect instantly
export const revalidate = 0;

export default async function HomePage() {
  const products = await dbService.getProducts();
  const categories = await dbService.getCategories();

  return (
    <HomeClient 
      initialProducts={JSON.parse(JSON.stringify(products))} 
      initialCategories={JSON.parse(JSON.stringify(categories))} 
    />
  );
}
