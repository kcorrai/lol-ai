/** One numbered section of the booking request page. */
export function BookingStep({
  n,
  title,
  note,
  children,
}: {
  n: number;
  title: string;
  note?: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <section className="notch border border-border bg-surface p-5">
      <header className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-mono text-[12px] font-bold text-accent">
          {String(n).padStart(2, "0")}
        </span>
        <h2 className="font-display text-[16px] font-extrabold uppercase tracking-[0.03em] text-text">
          {title}
        </h2>
        {note && <span className="text-[12px] text-text-muted">{note}</span>}
      </header>
      {children}
    </section>
  );
}
