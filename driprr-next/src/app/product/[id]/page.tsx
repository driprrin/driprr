import ProductClient from "@/components/product/ProductClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  return <ProductClient id={id} />;
}
