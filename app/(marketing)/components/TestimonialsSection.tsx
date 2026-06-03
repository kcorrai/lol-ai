const TESTIMONIALS = [
  {
    quote:
      "Finally know exactly what I'm doing wrong. The AI pinpointed my vision score issues in the first report. Went from Gold II to Plat IV in two weeks.",
    author: "ShadowBlade99",
    rank: "Platinum IV",
  },
  {
    quote:
      "The match deep dive is insane. I didn't realize I was dying to the same champion at the 15-minute mark every single game until I saw it laid out.",
    author: "RiftWalker_KR",
    rank: "Gold I",
  },
  {
    quote:
      "Best free tool I've used for LoL improvement. The AI coaching report is more honest than any human coach I've had.",
    author: "SilverToPlat",
    rank: "Platinum II",
  },
] as const;

export function TestimonialsSection() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 text-center">
          <h2 className="font-display text-3xl font-bold text-text md:text-4xl">
            Players Who Climbed
          </h2>
          <p className="mt-3 text-text-muted">Real feedback from beta users.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map(({ quote, author, rank }) => (
            <div
              key={author}
              className="rounded-xl border border-border bg-surface p-6"
            >
              <p className="mb-5 text-sm leading-relaxed text-text-muted">
                &ldquo;{quote}&rdquo;
              </p>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-xs font-bold text-accent">
                  {author[0]}
                </div>
                <div>
                  <p className="text-xs font-medium text-text">{author}</p>
                  <p className="text-xs text-text-muted">{rank}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
