import { Metadata } from 'next';
import Link from 'next/link';

const city = "Hubli-Dharwad";

export const metadata: Metadata = {
  title: `Frequently Asked Questions`,
  description: `Delivery times, coverage areas, payments & more — everything you need to know about ordering fashion on Driprr in ${city}.`,
  alternates: { canonical: 'https://driprr.com/faq' },
};

const faqs = [
  { q: "How fast is delivery on Driprr?", a: `Most orders in ${city} are delivered in 30-90 minutes, depending on your distance from the store and current order volume.` },
  { q: "Which areas does Driprr deliver to?", a: `Driprr currently delivers across ${city}. Enter your address at checkout to confirm coverage for your exact location.` },
  { q: "Are the products on Driprr authentic?", a: `Yes. Every product is sourced directly from verified local fashion stores in ${city} — nothing is shipped from unverified sellers.` },
  { q: "What payment options does Driprr support?", a: "UPI, credit/debit cards, netbanking via Razorpay, and Cash on Delivery (COD)." },
  { q: "Can I track my order in real time?", a: "Yes, every order includes live rider tracking from the moment the store confirms it until it's delivered to your door." },
  { q: "Is there a delivery fee?", a: "Delivery fees vary by store. Many stores offer free delivery above a minimum order value." },
  { q: "Does Driprr have a return or exchange policy?", a: "Returns and exchanges are handled by the individual store. Contact the store through your order page for assistance." },
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-background text-text-primary pb-24">
      <div className="max-w-3xl mx-auto px-5 pt-10">
        <h1 className="font-display font-bold text-2xl mb-2">Frequently Asked Questions</h1>
        <p className="text-text-mute text-sm mb-8">Everything you need to know about ordering fashion on Driprr.</p>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-surface-1 border border-border-low rounded-2xl p-5">
              <h2 className="font-bold text-base text-text-primary mb-2">{faq.q}</h2>
              <p className="text-sm text-text-dim leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link href="/" className="text-primary font-bold text-sm">← Back to Home</Link>
        </div>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqs.map(f => ({
          "@type": "Question",
          "name": f.q,
          "acceptedAnswer": { "@type": "Answer", "text": f.a }
        }))
      }) }} />
    </div>
  );
}
