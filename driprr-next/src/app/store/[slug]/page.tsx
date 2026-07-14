import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import StoreClient from "@/components/store/StoreClient";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { data } = await supabase.from('Store').select('name, coverUrl, tagline').eq('slug', slug).maybeSingle();
  const name = data?.name ?? slug;
  return {
    title: `${name} | Shop Online on Driprr`,
    description: data?.tagline ?? `Shop available clothing and fashion products from ${name} on Driprr.`,
    alternates: { canonical: `https://driprr.com/store/${slug}` },
    openGraph: {
      title: `${name} | Shop Online on Driprr`,
      description: `Shop from ${name} on Driprr`,
      images: data?.coverUrl ? [{ url: data.coverUrl, width: 1200, height: 630 }] : undefined,
    },
  };
}

export default async function StorePage({ params }: Props) {
  const { slug } = await params;
  return <StoreClient slug={slug} />;
}
