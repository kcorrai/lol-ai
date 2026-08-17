const FAQS: { q: string; a: string }[] = [
  {
    q: "Is my account safe?",
    a: "Match history is read through Riot's official API, read-only. We never ask for your password, and you can disconnect the account at any time.",
  },
  {
    q: "What happens if I cancel?",
    a: "You drop to Free at the end of the paid period. Your reports and improvement history stay readable.",
  },
  {
    q: "Can I switch between monthly and annual?",
    a: "Yes, from billing settings. The change applies at the start of the next period.",
  },
  {
    q: "Do the free tools ever go behind the paywall?",
    a: "No. Counter picker, tier lists, drafts and builds stay free and login-free.",
  },
];

/** The questions that decide a purchase, answered before the button. */
export function PricingFaq(): React.JSX.Element {
  return (
    <section className="mt-9">
      <div className="mb-3 flex items-center gap-3">
        <h2 className="font-mono text-[11px] uppercase tracking-label text-fg-1">Before you pay</h2>
        <span className="h-px flex-1 bg-line-1" />
      </div>
      <div className="notch border border-border bg-surface">
        {FAQS.map((faq) => (
          <div
            key={faq.q}
            className="grid gap-2 border-b border-line-1 px-5 py-4 last:border-b-0 md:grid-cols-[280px_minmax(0,1fr)] md:gap-6"
          >
            <span className="font-display text-sm font-bold uppercase tracking-wide text-fg-1">
              {faq.q}
            </span>
            <span className="text-sm text-fg-2">{faq.a}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
