import { Metadata } from 'next';
import Link from 'next/link';

const city = "Hubli-Dharwad";

export const metadata: Metadata = {
  title: `How Driprr Works | Fashion Delivery in ${city}`,
  description: `Learn how Driprr delivers fashion from nearby stores in ${city} in 30-90 minutes. Browse, order, track, and receive.`,
  alternates: { canonical: 'https://driprr.com/how-it-works' },
};

export default function HowItWorksPage() {
  const steps = [
    { num: "1", title: "Browse", desc: `See real-time stock from local stores across ${city}, sorted by what's nearby.` },
    { num: "2", title: "Order", desc: "Pay by UPI, card, netbanking, or Cash on Delivery." },
    { num: "3", title: "Track", desc: "Watch your order live from the moment the store confirms it." },
    { num: "4", title: "Receive", desc: "Your order arrives in 30-90 minutes, delivered by a Driprr rider." },
  ];

  return (
    <div className="min-h-screen bg-background text-text-primary pb-24">
      <div className="max-w-3xl mx-auto px-5 pt-10">
        <h1 className="font-display font-bold text-2xl mb-2">How Driprr Works</h1>
        <p className="text-text-mute text-sm mb-8">
          Driprr connects you with fashion stores already near you in {city}, and gets what you order to your door in 30-90 minutes.
        </p>
        <div className="space-y-4">
          {steps.map((step) => (
            <div key={step.num} className="bg-surface-1 border border-border-low rounded-2xl p-5 flex gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-primary font-black text-lg">{step.num}</span>
              </div>
              <div>
                <h2 className="font-bold text-base text-text-primary">{step.title}</h2>
                <p className="text-sm text-text-dim mt-1">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-8 text-sm text-text-dim leading-relaxed bg-surface-1 border border-border-low rounded-2xl p-5">
          Unlike marketplaces that ship from warehouses days away, every Driprr order comes from a real store in your city — so delivery is measured in minutes, not days.
        </p>
        <div className="mt-8 text-center">
          <Link href="/stores" className="px-6 py-3 bg-primary text-on-primary font-bold text-sm rounded-xl">Shop Now</Link>
        </div>
      </div>
    </div>
  );
}
