"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ChevronRight } from "lucide-react";
import parachutePants from "@/assets/parachute-pants.jpg";
import boxyHoodie from "@/assets/boxy-hoodie.jpg";
import aeroSneakers from "@/assets/aero-sneakers.jpg";
import utilityVest from "@/assets/utility-vest.jpg";

const categories = [
  {
    label: "Top Wear",
    slug: "top-wear",
    img: boxyHoodie,
    desc: "Oversized hoodies, tees, and heavy garments.",
    itemsCount: 12,
  },
  {
    label: "Bottom Wear",
    slug: "bottom-wear",
    img: parachutePants,
    desc: "Cargo pants, parachute trousers, and denim.",
    itemsCount: 8,
  },
  {
    label: "Foot Wear",
    slug: "foot-wear",
    img: aeroSneakers,
    desc: "Limited sneakers and technical footwear.",
    itemsCount: 6,
  },
];

export default function CategoriesPage() {
  return (
    <div className="min-h-screen bg-background text-text-primary pb-24 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="px-5 pt-6 pb-4 flex items-center justify-between border-b border-border-low bg-surface-1/40 backdrop-blur-md sticky top-0 z-30 max-w-6xl mx-auto w-full">
        {/* Left: Home Navigation */}
        <Link
          href="/"
          className="w-10 h-10 bg-surface-2 border border-border-low rounded-2xl flex items-center justify-center text-text-dim hover:text-text-primary transition-all"
        >
          <ArrowLeft size={18} />
        </Link>

        {/* Center Title */}
        <h1 className="text-lg font-black tracking-widest uppercase">CATEGORIES</h1>

        {/* Right spacing */}
        <div className="w-10" />
      </header>

      <main className="max-w-4xl mx-auto px-5 pt-10 relative z-10">
        {/* SEO intro */}
        <p className="text-sm text-text-dim leading-relaxed mb-8">
          Driprr connects you with local fashion stores. Choose a category below to see what&apos;s available for delivery near you right now.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categories.map((c) => (
            <Link
              key={c.label}
              href={`/category/${c.slug}`}
              className="group relative bg-surface-1 border border-border-low rounded-3xl overflow-hidden min-h-[220px] flex flex-col justify-end p-6 shadow-sm hover:scale-[1.02] hover:border-primary/40 transition-all duration-300"
            >
              {/* Cover Image */}
              <div className="absolute inset-0 z-0">
                <Image
                  src={c.img}
                  alt={c.label}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                {/* Translucent overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/10" />
              </div>

              {/* Text content */}
              <div className="relative z-10 text-left">
                <h2 className="font-display font-black text-2xl text-white mt-2 leading-none">
                  {c.label}
                </h2>
                <p className="text-neutral-400 text-xs mt-1.5 leading-relaxed max-w-[280px]">
                  {c.desc}
                </p>
                <div className="mt-4 flex items-center gap-1.5 text-white font-bold text-xs uppercase tracking-wider">
                  <span>Explore Collection</span>
                  <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
