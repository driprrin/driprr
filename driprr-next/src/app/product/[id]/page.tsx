import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import ProductClient from "@/components/product/ProductClient";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { data } = await supabase.from('Product').select('name, brand, price, imageUrls, description').eq('id', id).maybeSingle();
  if (!data) return { title: 'Product Not Found' };
  return {
    title: `${data.name} by ${data.brand}`,
    description: data.description ?? `Shop ${data.name} from a nearby fashion store on Driprr. Check price, availability, sizes, and delivery options.`,
    alternates: { canonical: `https://driprr.com/product/${id}` },
    openGraph: {
      title: `${data.name} by ${data.brand}`,
      description: `₹${data.price} - Shop ${data.name} on Driprr`,
      images: data.imageUrls?.[0] ? [{ url: data.imageUrls[0], width: 1200, height: 630 }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  return <ProductClient id={id} />;
}
