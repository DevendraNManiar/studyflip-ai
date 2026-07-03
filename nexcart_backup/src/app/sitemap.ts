import { MetadataRoute } from 'next';
import { dbService } from '@/lib/dbWrapper';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Base pages
  const routes = [
    '',
    '/search',
    '/cart',
    '/wishlist',
    '/login',
    '/register',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  // Product detail pages
  try {
    const products = await dbService.getProducts();
    const productRoutes = products.map((p: any) => ({
      url: `${baseUrl}/products/${p.slug}`,
      lastModified: new Date(p.updatedAt || p.createdAt || Date.now()),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));
    return [...routes, ...productRoutes];
  } catch (e) {
    console.error("Failed to generate dynamic product sitemap routes:", e);
    return routes;
  }
}
