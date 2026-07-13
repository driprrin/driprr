import Link from "next/link";
export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-5 px-5 text-center">
      <h1 className="text-6xl font-black text-text-primary">404</h1>
      <p className="text-text-mute text-sm">Page not found.</p>
      <Link href="/home" className="px-6 py-3 bg-primary text-on-primary font-bold rounded-2xl text-sm">Back to Home</Link>
    </div>
  );
}
