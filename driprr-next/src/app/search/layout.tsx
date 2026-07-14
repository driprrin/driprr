import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Search Fashion',
  description: 'Search for clothing, footwear, and accessories from nearby stores on Driprr.',
  alternates: { canonical: 'https://driprr.com/search' },
  robots: { index: true, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
