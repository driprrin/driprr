import { Metadata } from 'next';

const city = "Hubli-Dharwad";

export const metadata: Metadata = {
  title: `Shop by Category in ${city}`,
  description: `Browse Top Wear, Bottom Wear & Foot Wear from nearby stores in ${city}. Fast 30-90 min delivery on Driprr.`,
  alternates: { canonical: 'https://driprr.com/categories' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
