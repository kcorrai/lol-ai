import type { ReactNode } from "react";
import { PublicOnly } from "@/components/tools/PublicOnly";

interface ToolHeaderProps {
  title: string;
  subtitle: string;
  /** Right-hand block, usually a row of StatBlocks about the data behind the tool. */
  aside?: ReactNode;
}

/** The title block every free tool opens with — the tier list's header, shared. */
export function ToolHeader({ title, subtitle, aside }: ToolHeaderProps): React.ReactElement {
  return (
    <header className="mb-7 flex flex-wrap items-end justify-between gap-7">
      <div>
        <PublicOnly>
          <p className="mb-3 flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-label text-accent">
            <span className="h-1.5 w-1.5 bg-accent" aria-hidden />
            Free tool · no login required
          </p>
        </PublicOnly>
        <h1 className="font-display text-[34px] font-black uppercase leading-[0.98] tracking-[0.02em] text-text md:text-[44px]">
          {title}
        </h1>
        <p className="mt-3 max-w-[60ch] text-[15px] text-text-body">{subtitle}</p>
      </div>
      {aside && <div className="flex flex-wrap gap-7 pb-1">{aside}</div>}
    </header>
  );
}
