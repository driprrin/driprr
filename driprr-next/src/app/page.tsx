import { Metadata } from 'next';
import HomeClient from "@/components/home/HomeClient";

export const metadata: Metadata = {
  title: 'Fashion Delivery from Nearby Stores',
  description: 'Shop clothing, footwear, accessories, and streetwear from nearby fashion stores with fast local delivery on Driprr.',
  alternates: { canonical: 'https://driprr.com' },
};

export default function HomePage() {
  return <HomeClient />;
}
