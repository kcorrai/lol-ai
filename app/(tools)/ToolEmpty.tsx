import type { ReactNode } from "react";

/** A tool's "nothing to show yet" panel: one headline, one line of help, optional content under. */
export function ToolEmpty({
  title,
  body,
  children,
}: {
  title: string;
  body?: ReactNode;
  children?: ReactNode;
}): React.ReactElement {
  return (
    <section className="notch border border-border bg-surface px-5 py-9 text-center">
      <p className="font-display text-base font-bold uppercase tracking-[0.04em] text-text">
        {title}
      </p>
      {body && <p className="mx-auto mt-2 max-w-[56ch] text-sm text-text-muted">{body}</p>}
      {children && <div className="mt-6">{children}</div>}
    </section>
  );
}
