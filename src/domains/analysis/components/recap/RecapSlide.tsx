"use client";

import { cn } from "@/lib/utils";

interface Props {
  children: React.ReactNode;
  bgClass?: string;
  active?: boolean;
}

export function RecapSlide({ children, bgClass = "bg-background", active = true }: Props) {
  return (
    <div
      className={cn(
        "absolute inset-0 flex flex-col items-center justify-center px-8 py-10 text-center transition-opacity duration-500",
        bgClass,
        active ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
    >
      {children}
    </div>
  );
}
