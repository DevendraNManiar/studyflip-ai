import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/search', '/products/'],
      disallow: ['/admin/', '/api/', '/cart', '/checkout', '/orders', '/wishlist'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
