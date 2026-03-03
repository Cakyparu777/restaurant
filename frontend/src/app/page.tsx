import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-900 via-surface-800 to-surface-950 text-white overflow-hidden">
      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-glow">
            <span className="text-white font-bold text-lg">M</span>
          </div>
          <span className="font-bold text-xl">MenuOrder</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="btn-ghost text-white/70 hover:text-white">
            Log in
          </Link>
          <Link href="/register" className="btn-primary text-sm">
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 md:px-12 pt-20 md:pt-32 pb-20">
        {/* Glowing orb */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-primary-400 animate-pulse-soft" />
            <span className="text-sm text-white/60">Now with real-time order tracking</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6 animate-slide-up">
            Your restaurant&apos;s
            <br />
            <span className="bg-gradient-to-r from-primary-400 via-primary-300 to-accent-400 bg-clip-text text-transparent">
              digital menu
            </span>
            <br />
            in minutes.
          </h1>

          <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-12 animate-slide-up">
            Create a beautiful online menu, receive orders via QR code, and manage everything from one dashboard. No fees, no commissions.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up">
            <Link href="/scan" className="btn-primary text-lg px-10 py-4 flex items-center">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              Scan QR to Order
            </Link>
            <Link href="/register" className="btn-secondary bg-white/5 border-white/10 text-white hover:bg-white/10 text-lg px-10 py-4">
              Restaurant Owner? Get Started
            </Link>
          </div>
        </div>

        {/* Feature cards */}
        <div className="grid md:grid-cols-3 gap-6 mt-32">
          {[
            {
              icon: "📱",
              title: "QR Code Ordering",
              desc: "Customers scan, browse, and order — no app download required.",
            },
            {
              icon: "⚡",
              title: "Real-time Dashboard",
              desc: "See orders come in live. Update statuses with one click.",
            },
            {
              icon: "🎨",
              title: "Beautiful Menus",
              desc: "Gorgeous mobile-first menu that converts browsers to buyers.",
            },
          ].map((f, i) => (
            <div
              key={i}
              className="group p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-white/40 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8 text-center text-white/30 text-sm">
        &copy; 2026 MenuOrder. Built for restaurants.
      </footer>
    </div>
  );
}
