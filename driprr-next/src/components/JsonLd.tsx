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
    logo: 'https://driprr.com/logo.png',
    description: 'Hyperlocal fashion delivery app connecting local clothing stores with customers in India for 30-90 minute delivery.',
    areaServed: { '@type': 'City', name: 'Hubli-Dharwad', addressRegion: 'Karnataka', addressCountry: 'IN' },
    sameAs: [
      'https://www.instagram.com/driprr.official/',
    ],
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}

export function LocalBusinessJsonLd() {
  const city = "Hubli-Dharwad";
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Driprr',
    description: 'Hyperlocal fashion delivery from nearby stores in 30-90 minutes',
    url: 'https://driprr.com',
    areaServed: { '@type': 'City', name: city, addressRegion: 'Karnataka', addressCountry: 'IN' },
    priceRange: '₹₹',
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}

export function FAQSchema({ faqs }: { faqs: { q: string; a: string }[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}

export function BreadcrumbSchema({ items }: { items: { name: string; url: string }[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
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
