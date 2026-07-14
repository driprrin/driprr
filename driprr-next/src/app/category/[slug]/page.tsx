import { Metadata } from 'next';
import CategoryClient from "@/components/category/CategoryClient";

const city = "Hubli-Dharwad";

const categoryMeta: Record<string, { title: string; description: string; h1: string; intro: string }> = {
  "top-wear": {
    title: `Top Wear Delivery in ${city} | T-Shirts, Hoodies & Jackets | Driprr`,
    description: `Shop t-shirts, shirts, hoodies & jackets from nearby stores in ${city}. 30-90 min delivery, 100% authentic. Order on Driprr.`,
    h1: `Top Wear Delivery in ${city}`,
    intro: `Shop t-shirts, shirts, hoodies and jackets from local stores across ${city}, delivered to your door in 30-90 minutes. Every item ships from a nearby store — not a warehouse — so what you see is what's actually in stock near you.`,
  },
  "bottom-wear": {
    title: `Bottom Wear Delivery in ${city} | Jeans, Joggers & Trousers | Driprr`,
    description: `Shop jeans, joggers, trousers & shorts from nearby stores in ${city}. 30-90 min delivery on Driprr.`,
    h1: `Bottom Wear Delivery in ${city}`,
    intro: `Jeans, joggers, trousers and shorts from local stores across ${city} — delivered in 30-90 minutes, no need to visit multiple shops.`,
  },
  "foot-wear": {
    title: `Footwear Delivery in ${city} | Sneakers, Shoes & Sandals | Driprr`,
    description: `Shop sneakers, shoes & sandals from nearby stores in ${city}. Fast 30-90 min delivery on Driprr.`,
    h1: `Footwear Delivery in ${city}`,
    intro: `Sneakers, shoes and sandals from trusted local stores in ${city}, delivered fast — track your rider in real time from store to door.`,
  },
};

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const meta = categoryMeta[slug];
  if (meta) {
    return {
      title: meta.title,
      description: meta.description,
      alternates: { canonical: `https://driprr.com/category/${slug}` },
    };
  }
  // Fallback for unknown categories
  const title = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  return {
    title: `${title} Near You`,
    description: `Shop ${title.toLowerCase()} from nearby fashion stores with fast local delivery on Driprr.`,
    alternates: { canonical: `https://driprr.com/category/${slug}` },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  return <CategoryClient slug={slug} />;
}
