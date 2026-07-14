import { Metadata } from 'next';

const city = "Hubli-Dharwad";

export const metadata: Metadata = {
  title: `Fashion Stores in ${city}`,
  description: `Discover local fashion stores in ${city} delivering through Driprr. Shop top wear, bottom wear & footwear in 30-90 minutes.`,
  alternates: { canonical: 'https://driprr.com/stores' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
