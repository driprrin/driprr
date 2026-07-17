import { Metadata } from 'next';
import HomeClient from "@/components/home/HomeClient";
import { FAQSchema } from '@/components/JsonLd';

const city = "Hubli-Dharwad";

export const metadata: Metadata = {
  title: 'Driprr: Fashion Delivery in 30-90 Min',
  description: 'Driprr is your neighbourhood fashion delivery app, delivering clothing, footwear, streetwear & more from nearby stores to your doorstep in just 30-90 minutes.',
  alternates: { canonical: 'https://driprr.com' },
};

const faqs = [
  { q: "How fast is delivery on Driprr?", a: `Most orders in ${city} are delivered in 30-90 minutes, depending on your distance from the store and current order volume.` },
  { q: "Which areas does Driprr deliver to?", a: `Driprr currently delivers across ${city}. Enter your address at checkout to confirm coverage for your exact location.` },
  { q: "Are the products on Driprr authentic?", a: `Yes. Every product is sourced directly from verified local fashion stores in ${city} — nothing is shipped from unverified sellers.` },
  { q: "What payment options does Driprr support?", a: "UPI, credit/debit cards, netbanking via Razorpay, and Cash on Delivery (COD)." },
  { q: "Can I track my order in real time?", a: "Yes, every order includes live rider tracking from the moment the store confirms it until it's delivered to your door." },
];

export default function HomePage() {
  return (
    <>
      <FAQSchema faqs={faqs} />
      <HomeClient />
    </>
  );
}
