import Link from "next/link";
export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-5">
      <h1 className="text-6xl font-black text-text-primary">404</h1>
      <p className="text-text-mute text-sm">Page not found in admin panel.</p>
      <Link href="/applications" className="px-5 py-2.5 bg-primary text-on-primary font-bold rounded-2xl text-sm hover:opacity-90">
        Back to Applications
      </Link>
    </div>
  );
}
