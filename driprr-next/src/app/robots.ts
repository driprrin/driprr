import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/stores', '/store/', '/category/', '/product/', '/search'],
        disallow: ['/cart', '/checkout', '/profile', '/orders', '/login', '/signup', '/order-confirmation', '/api/'],
      },
    ],
    sitemap: 'https://driprr.com/sitemap.xml',
  };
}
