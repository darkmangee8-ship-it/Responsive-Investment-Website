import { useState, FormEvent } from "react";

export default function Contact() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSent(true);
      setSubmitting(false);
    }, 1000);
  }

  const inputStyle = {
    background: "transparent",
    color: "#f5f0e8",
    border: "1px solid rgba(212,160,23,0.25)",
    outline: "none",
    width: "100%",
    padding: "0.75rem 1rem",
    fontSize: "0.875rem",
    fontFamily: "'Hanken Grotesk', sans-serif",
    transition: "border-color 0.15s",
  } as const;

  return (
    <div className="fade-up pt-32 pb-24 px-6 md:px-10">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Info */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#d4a017" }}>Contact</p>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-8" style={{ letterSpacing: "-0.04em" }}>
              Get in touch.
            </h1>
            <p className="text-base leading-relaxed mb-12" style={{ color: "#9090a8" }}>
              For general enquiries, platform questions, or support issues, use the contact form. Registered users can also open a support ticket directly from their dashboard for faster resolution.
            </p>

            <div className="space-y-8">
              {[
                { label: "General Enquiries", value: "enquiries@musk-enterprise.com", icon: "✉" },
                { label: "Support", value: "support@musk-enterprise.com", icon: "◆" },
                { label: "Compliance", value: "compliance@musk-enterprise.com", icon: "⊡" },
              ].map((c, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 flex items-center justify-center flex-shrink-0"
                    style={{ border: "1px solid rgba(212,160,23,0.2)", color: "#d4a017" }}
                  >
                    <span className="text-sm">{c.icon}</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#9090a8" }}>{c.label}</p>
                    <p className="break-words text-sm" style={{ color: "#f5f0e8" }}>{c.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 p-6 border-l-2" style={{ borderColor: "#d4a017", background: "#111118" }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#d4a017" }}>Response Times</p>
              <p className="text-sm" style={{ color: "#9090a8" }}>
                General enquiries: 1–3 business days<br />
                Support tickets (dashboard): priority queue<br />
                Compliance: up to 5 business days
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="p-8 md:p-10" style={{ background: "#111118", border: "1px solid rgba(212,160,23,0.15)" }}>
            {sent ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-16">
                <div className="w-16 h-16 flex items-center justify-center mb-6" style={{ background: "rgba(212,160,23,0.1)", border: "1px solid rgba(212,160,23,0.3)" }}>
                  <span className="text-2xl" style={{ color: "#d4a017" }}>◆</span>
                </div>
                <h2 className="text-xl font-bold mb-3">Message received</h2>
                <p className="text-sm" style={{ color: "#9090a8" }}>
                  We'll respond to your enquiry within 1–3 business days.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <p className="text-xs font-semibold uppercase tracking-widest mb-6" style={{ color: "#d4a017" }}>Send a Message</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold mb-2" style={{ color: "#9090a8" }}>Full Name</label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={form.name}
                      onChange={handleChange}
                      style={inputStyle}
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-2" style={{ color: "#9090a8" }}>Email Address</label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={form.email}
                      onChange={handleChange}
                      style={inputStyle}
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: "#9090a8" }}>Subject</label>
                  <select
                    name="subject"
                    required
                    value={form.subject}
                    onChange={handleChange}
                    style={{ ...inputStyle, appearance: "none" }}
                  >
                    <option value="">Select a subject…</option>
                    <option value="general">General Enquiry</option>
                    <option value="account">Account Question</option>
                    <option value="investment">Investment Plans</option>
                    <option value="deposit">Deposit / Withdrawal</option>
                    <option value="technical">Technical Issue</option>
                    <option value="compliance">Compliance</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: "#9090a8" }}>Message</label>
                  <textarea
                    name="message"
                    required
                    rows={6}
                    value={form.message}
                    onChange={handleChange}
                    style={{ ...inputStyle, resize: "vertical" }}
                    placeholder="Describe your enquiry…"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 text-sm font-bold tracking-wide transition-all"
                  style={{
                    background: submitting ? "#a07c10" : "#d4a017",
                    color: "#09090e",
                    cursor: submitting ? "wait" : "pointer",
                  }}
                >
                  {submitting ? "Sending…" : "Send Message"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
