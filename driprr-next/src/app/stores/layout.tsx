import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nearby Fashion Stores',
  description: 'Discover fashion stores near you and shop products available for fast local delivery on Driprr.',
  alternates: { canonical: 'https://driprr.com/stores' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
