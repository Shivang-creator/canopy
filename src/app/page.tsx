import Link from "next/link";
import { Dashboard } from "@/components/Dashboard";

export default function Home() {
  return (
    <>
      <header
        className="border-b"
        style={{ borderColor: "var(--border)", background: "var(--bg-sunken)" }}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 flex items-baseline justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl italic" style={{ color: "var(--canopy-strong)" }}>
              Canopy
            </h1>
            <p className="text-xs sm:text-sm mt-0.5" style={{ color: "var(--ink-muted)" }}>
              A nature-exposure diary that shows its work.
            </p>
          </div>
          <Link
            href="/method"
            className="text-sm underline decoration-dotted whitespace-nowrap"
            style={{ color: "var(--ink-muted)" }}
          >
            How this works
          </Link>
        </div>
      </header>
      <main className="flex-1 pb-16" style={{ background: "var(--bg)" }}>
        <Dashboard />
      </main>
      <footer className="py-6 text-center text-xs" style={{ color: "var(--ink-faint)" }}>
        Built for OregonHacks · green-space data © OpenStreetMap contributors (ODbL) ·{" "}
        <Link href="/method" className="underline decoration-dotted">
          method &amp; limits
        </Link>
      </footer>
    </>
  );
}
