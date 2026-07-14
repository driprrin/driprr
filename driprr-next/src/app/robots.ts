import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/stores', '/store/', '/category/', '/categories', '/product/', '/search', '/faq', '/how-it-works'],
        disallow: ['/cart', '/checkout', '/profile', '/orders', '/login', '/signup', '/order-confirmation', '/api/'],
      },
    ],
    sitemap: 'https://driprr.com/sitemap.xml',
  };
}
