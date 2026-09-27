import { cn } from "@/lib/utils";

// The two building blocks of the match quiz: a titled question and one tappable answer.

export function Question({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <fieldset className="notch border border-border bg-surface p-5">
      <legend className="sr-only">{title}</legend>
      <p className="mb-3.5 flex flex-wrap items-baseline gap-x-3 font-display text-[15px] font-extrabold uppercase tracking-[0.03em] text-text">
        {title}
        {note && (
          <span className="font-sans text-[12px] normal-case tracking-normal text-accent">
            {note}
          </span>
        )}
      </p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

export function Choice({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={cn(
        "tag-cut flex h-10 items-center border px-3.5 text-[13.5px] transition-colors",
        on
          ? "border-accent bg-accent/10 text-accent"
          : "border-line-2 text-text-body hover:border-line-3 hover:text-text"
      )}
    >
      {children}
    </button>
  );
}
