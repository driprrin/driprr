import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-5 px-4">
      <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
        <span className="material-symbols-outlined text-white text-[32px]">storefront</span>
      </div>
      <div className="text-center">
        <h1 className="text-6xl font-black text-text-primary">404</h1>
        <p className="text-text-mute text-sm mt-2">This page doesn't exist in your dashboard.</p>
      </div>
      <Link href="/dashboard"
        className="px-6 py-3 bg-primary text-on-primary font-bold rounded-2xl text-sm hover:opacity-90 transition-opacity">
        Back to Dashboard
      </Link>
    </div>
  );
}
