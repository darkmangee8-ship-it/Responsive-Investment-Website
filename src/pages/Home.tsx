import { Link } from "react-router";
import { useState } from "react";

const stats = [
  { label: "Minimum Investment", value: "$1,000", mono: true },
  { label: "Stated Daily Rate", value: "2.0%", mono: true },
  { label: "Investment Plans", value: "4", mono: true },
  { label: "Founded", value: "2017", mono: true },
];

const planPreview = [
  { name: "Foundation", min: "$1,000", max: "$9,999", rate: "2.0%", duration: "30 days", color: "#9090a8" },
  { name: "Growth", min: "$10,000", max: "$49,999", rate: "2.0%", duration: "60 days", color: "#d4a017" },
  { name: "Apex", min: "$50,000", max: "$249,999", rate: "2.0%", duration: "90 days", color: "#e8b830" },
  { name: "Sovereign", min: "$250,000", max: "No limit", rate: "2.0%", duration: "120 days", color: "#f5f0e8" },
];

const steps = [
  { n: "01", title: "Create an Account", body: "Register securely with your email address. Identity verification may be required based on applicable regulations." },
  { n: "02", title: "Fund Your Wallet", body: "Deposit funds through our integrated payment processing system. Your deposit is credited upon confirmed payment." },
  { n: "03", title: "Choose a Plan", body: "Select an investment plan that matches your capital allocation goals and intended holding period." },
  { n: "04", title: "Monitor Returns", body: "Track your active investments, accrued returns, and wallet balances from your secure dashboard." },
];

const ticker = [
  "Investment involves risk · Past performance does not indicate future results",
  "All stated rates are calculated rates, not guaranteed returns",
  "Capital is subject to market and operational risks",
  "Read the Risk Disclosure before investing",
  "Minimum investment: $1,000 · Maximum varies by plan",
];

export default function Home() {
  const [hoveredPlan, setHoveredPlan] = useState<number | null>(null);

  return (
    <div className="fade-up">
      {/* Risk ticker */}
      <div
        className="overflow-hidden py-2 mt-16 md:mt-20"
        style={{ background: "rgba(212,160,23,0.07)", borderBottom: "1px solid rgba(212,160,23,0.15)" }}
      >
        <div className="ticker-track flex gap-16 whitespace-nowrap">
          {[...ticker, ...ticker].map((t, i) => (
            <span key={i} className="text-xs font-mono flex-shrink-0" style={{ color: "#d4a017", fontFamily: "'DM Mono', monospace" }}>
              ◆ {t}
            </span>
          ))}
        </div>
      </div>

      {/* Hero */}
      <section className="hero-gradient relative pt-24 pb-32 px-6 md:px-10">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 mb-8 text-xs font-semibold uppercase tracking-widest"
              style={{ border: "1px solid rgba(212,160,23,0.3)", color: "#d4a017" }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#d4a017" }} />
              Structured Investment Platform
            </div>

            <h1
              className="text-5xl md:text-7xl font-black leading-none tracking-tight mb-8"
              style={{ letterSpacing: "-0.04em", lineHeight: "0.95" }}
            >
              Capital
              <br />
              <span style={{ color: "#d4a017" }}>structured</span>
              <br />
              for growth.
            </h1>

            <p className="text-lg md:text-xl leading-relaxed max-w-xl mb-10" style={{ color: "#9090a8" }}>
              Musk Enterprise provides a disciplined investment framework with defined plans, transparent rate structures, and a secure portfolio management platform.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/register"
                className="inline-flex items-center justify-center px-8 py-4 text-sm font-bold tracking-wide transition-all duration-150"
                style={{ background: "#d4a017", color: "#09090e" }}
                onMouseEnter={(e) => { (e.target as HTMLAnchorElement).style.background = "#e8b830"; }}
                onMouseLeave={(e) => { (e.target as HTMLAnchorElement).style.background = "#d4a017"; }}
              >
                Open an Account →
              </Link>
              <Link
                to="/plans"
                className="inline-flex items-center justify-center px-8 py-4 text-sm font-medium tracking-wide border transition-all duration-150"
                style={{ color: "#f5f0e8", borderColor: "rgba(212,160,23,0.3)" }}
                onMouseEnter={(e) => { (e.target as HTMLAnchorElement).style.borderColor = "rgba(212,160,23,0.7)"; }}
                onMouseLeave={(e) => { (e.target as HTMLAnchorElement).style.borderColor = "rgba(212,160,23,0.3)"; }}
              >
                View Investment Plans
              </Link>
            </div>
          </div>

          {/* Stats row */}
          <div
            className="mt-20 grid grid-cols-2 md:grid-cols-4 border-t"
            style={{ borderColor: "rgba(212,160,23,0.15)" }}
          >
            {stats.map((s, i) => (
              <div
                key={i}
                className="py-8 px-6 border-b md:border-b-0 border-r"
                style={{ borderColor: "rgba(212,160,23,0.1)" }}
              >
                <p
                  className="text-3xl font-black mb-1"
                  style={{
                    fontFamily: s.mono ? "'DM Mono', monospace" : undefined,
                    color: "#d4a017",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {s.value}
                </p>
                <p className="text-xs" style={{ color: "#9090a8" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Investment Plans Preview */}
      <section className="py-24 px-6 md:px-10" style={{ background: "#111118" }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#d4a017" }}>Investment Plans</p>
              <h2 className="text-3xl md:text-5xl font-black tracking-tight" style={{ letterSpacing: "-0.03em" }}>
                Four tiers.<br />One framework.
              </h2>
            </div>
            <p className="text-sm max-w-sm leading-relaxed" style={{ color: "#9090a8" }}>
              Each plan operates under the same stated daily rate structure. Tier determines minimum capital, duration, and available features.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px" style={{ background: "rgba(212,160,23,0.1)" }}>
            {planPreview.map((p, i) => (
              <div
                key={i}
                className="p-8 cursor-pointer transition-all duration-200 card-glow"
                style={{
                  background: hoveredPlan === i ? "#16161f" : "#111118",
                }}
                onMouseEnter={() => setHoveredPlan(i)}
                onMouseLeave={() => setHoveredPlan(null)}
              >
                <div className="w-2 h-2 mb-6" style={{ background: p.color }} />
                <p className="text-lg font-bold mb-1" style={{ color: p.color }}>{p.name}</p>
                <p className="text-xs mb-8" style={{ color: "#9090a8" }}>{p.min} – {p.max}</p>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs" style={{ color: "#9090a8" }}>Daily rate</span>
                    <span className="text-sm font-bold" style={{ fontFamily: "'DM Mono', monospace", color: "#d4a017" }}>{p.rate}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs" style={{ color: "#9090a8" }}>Duration</span>
                    <span className="text-sm font-medium" style={{ fontFamily: "'DM Mono', monospace", color: "#f5f0e8" }}>{p.duration}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs" style={{ color: "#9090a8" }}>Min. capital</span>
                    <span className="text-sm font-medium" style={{ fontFamily: "'DM Mono', monospace", color: "#f5f0e8" }}>{p.min}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              to="/plans"
              className="inline-flex items-center gap-2 text-sm font-semibold transition-colors"
              style={{ color: "#d4a017" }}
            >
              Full plan details and terms →
            </Link>
          </div>
        </div>
      </section>

      {/* Return illustration */}
      <section className="py-24 px-6 md:px-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#d4a017" }}>Stated Rate Structure</p>
              <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-6" style={{ letterSpacing: "-0.03em" }}>
                Transparent<br />calculation.
              </h2>
              <p className="text-sm leading-relaxed mb-6" style={{ color: "#9090a8" }}>
                The platform applies a stated daily rate to your invested principal. This is a calculated rate used for illustrative and accrual purposes — not a guarantee of financial return.
              </p>
              <p className="text-xs leading-relaxed p-4 border-l-2" style={{ color: "#9090a8", borderColor: "#d4a017", background: "rgba(212,160,23,0.04)" }}>
                Risk disclosure: All figures shown are based on the platform's stated daily calculation rate. Investment returns are not guaranteed. Capital may be lost. Read the full Risk Disclosure before investing.
              </p>
            </div>

            {/* Calculation card */}
            <div className="p-8 border" style={{ background: "#111118", borderColor: "rgba(212,160,23,0.2)" }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-6" style={{ color: "#d4a017" }}>Example Calculation</p>
              <div className="space-y-4 font-mono text-sm" style={{ fontFamily: "'DM Mono', monospace" }}>
                <div className="flex justify-between py-3 border-b" style={{ borderColor: "rgba(212,160,23,0.1)" }}>
                  <span style={{ color: "#9090a8" }}>Principal</span>
                  <span style={{ color: "#f5f0e8" }}>$10,000.00</span>
                </div>
                <div className="flex justify-between py-3 border-b" style={{ borderColor: "rgba(212,160,23,0.1)" }}>
                  <span style={{ color: "#9090a8" }}>Stated daily rate</span>
                  <span style={{ color: "#d4a017" }}>× 2.00%</span>
                </div>
                <div className="flex justify-between py-3 border-b" style={{ borderColor: "rgba(212,160,23,0.1)" }}>
                  <span style={{ color: "#9090a8" }}>Daily accrual</span>
                  <span style={{ color: "#d4a017" }}>= $200.00</span>
                </div>
                <div className="flex justify-between py-3 border-b" style={{ borderColor: "rgba(212,160,23,0.1)" }}>
                  <span style={{ color: "#9090a8" }}>Duration</span>
                  <span style={{ color: "#f5f0e8" }}>60 days</span>
                </div>
                <div className="flex justify-between py-4" style={{ background: "rgba(212,160,23,0.06)", padding: "1rem", marginLeft: "-0.5rem", marginRight: "-0.5rem" }}>
                  <span className="font-bold" style={{ color: "#f5f0e8" }}>Total stated return</span>
                  <span className="font-black" style={{ color: "#d4a017" }}>$12,000.00</span>
                </div>
              </div>
              <p className="text-xs mt-4" style={{ color: "#9090a8" }}>
                Illustrative only. Not a guarantee of financial outcome.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6 md:px-10" style={{ background: "#111118" }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#d4a017" }}>Process</p>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight" style={{ letterSpacing: "-0.03em" }}>How it works</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((s, i) => (
              <div key={i} className="relative">
                <div className="text-xs font-mono mb-4" style={{ fontFamily: "'DM Mono', monospace", color: "rgba(212,160,23,0.4)" }}>{s.n}</div>
                <div className="w-10 h-px mb-6" style={{ background: "#d4a017" }} />
                <h3 className="text-base font-bold mb-3">{s.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#9090a8" }}>{s.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <Link
              to="/how-it-works"
              className="inline-flex items-center gap-2 text-sm font-semibold transition-colors"
              style={{ color: "#d4a017" }}
            >
              Full process overview →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 md:px-10">
        <div className="max-w-7xl mx-auto">
          <div
            className="p-12 md:p-20 text-center"
            style={{ background: "#111118", border: "1px solid rgba(212,160,23,0.2)" }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#d4a017" }}>Get Started</p>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-6" style={{ letterSpacing: "-0.03em" }}>
              Ready to begin?
            </h2>
            <p className="text-sm leading-relaxed mb-10 max-w-lg mx-auto" style={{ color: "#9090a8" }}>
              Create your account today. Minimum opening investment is $1,000. All investments carry risk — please read the Risk Disclosure before proceeding.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/register"
                className="inline-flex items-center justify-center px-10 py-4 text-sm font-bold tracking-wide"
                style={{ background: "#d4a017", color: "#09090e" }}
              >
                Create Account
              </Link>
              <Link
                to="/risk-disclosure"
                className="inline-flex items-center justify-center px-10 py-4 text-sm font-medium border"
                style={{ color: "#9090a8", borderColor: "rgba(212,160,23,0.2)" }}
              >
                Read Risk Disclosure
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
