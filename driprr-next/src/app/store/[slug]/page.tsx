import StoreClient from "@/components/store/StoreClient";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function StorePage({ params }: Props) {
  const { slug } = await params;
  return <StoreClient slug={slug} />;
}
