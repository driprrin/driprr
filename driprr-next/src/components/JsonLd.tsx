export function WebsiteJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Driprr',
    url: 'https://driprr.com',
    description: 'Fashion from nearby stores, delivered fast',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://driprr.com/search?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}

export function OrganizationJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Driprr',
    url: 'https://driprr.com',
    description: 'Hyperlocal fashion delivery platform',
    areaServed: { '@type': 'City', name: 'Hubli-Dharwad', addressRegion: 'Karnataka', addressCountry: 'IN' },
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}

export function ProductJsonLd({ product }: { product: { name: string; brand: string; price: number; originalPrice: number; description?: string; imageUrls?: string[]; id: string; inStock?: boolean } }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    brand: { '@type': 'Brand', name: product.brand },
    description: product.description ?? `${product.name} by ${product.brand}`,
    image: product.imageUrls?.[0],
    sku: product.id,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'INR',
      availability: product.inStock !== false ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `https://driprr.com/product/${product.id}`,
    },
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}
