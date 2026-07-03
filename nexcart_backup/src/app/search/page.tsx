import { dbService } from '@/lib/dbWrapper';
import SearchClient from '@/components/store/SearchClient';

export const revalidate = 0;

interface SearchPageProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
    brand?: string;
    minPrice?: string;
    maxPrice?: string;
    rating?: string;
    inStock?: string;
    sort?: string;
    page?: string;
  }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  // Await searchParams Promise (Next.js 15+ requirement)
  const resolvedParams = await searchParams;
  
  const categories = await dbService.getCategories();
  const brands = await dbService.getBrands();

  return (
    <SearchClient
      initialParams={resolvedParams}
      categories={JSON.parse(JSON.stringify(categories))}
      brands={JSON.parse(JSON.stringify(brands))}
    />
  );
}
