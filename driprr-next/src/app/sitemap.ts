import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://driprr.com';

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/stores`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/categories`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/category/top-wear`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/category/bottom-wear`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/category/foot-wear`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/search`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    { url: `${baseUrl}/faq`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/how-it-works`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
  ];

  // Dynamic store pages
  const { data: stores } = await supabase.from('Store').select('slug, updatedAt').eq('status', 'active');
  const storePages: MetadataRoute.Sitemap = (stores ?? []).map((s) => ({
    url: `${baseUrl}/store/${s.slug}`,
    lastModified: new Date(s.updatedAt),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  // Dynamic product pages
  const { data: products } = await supabase.from('Product').select('id, updatedAt').eq('published', true);
  const productPages: MetadataRoute.Sitemap = (products ?? []).map((p) => ({
    url: `${baseUrl}/product/${p.id}`,
    lastModified: new Date(p.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...storePages, ...productPages];
}
