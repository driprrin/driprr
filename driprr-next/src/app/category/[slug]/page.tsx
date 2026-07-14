import { Metadata } from 'next';
import CategoryClient from "@/components/category/CategoryClient";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
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
