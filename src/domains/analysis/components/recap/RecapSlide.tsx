"use client";

import { cn } from "@/lib/utils";

interface Props {
  children: React.ReactNode;
  bgClass?: string;
  active?: boolean;
  noPadding?: boolean;
}

export function RecapSlide({ children, bgClass = "bg-background", active = true, noPadding = false }: Props) {
  return (
    <div
      className={cn(
        "absolute inset-0 overflow-hidden transition-opacity duration-500",
        bgClass,
        active ? "opacity-100" : "opacity-0 pointer-events-none",
        !noPadding && "flex flex-col items-center justify-center px-8 py-10 text-center"
      )}
    >
      {children}
    </div>
  );
}
