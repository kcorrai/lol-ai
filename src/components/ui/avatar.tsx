import { cn } from "@/lib/utils";

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "?";
}

interface AvatarProps {
  name: string;
  size?: "sm" | "md";
  className?: string;
}

export function Avatar({ name, size = "md", className }: AvatarProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-accent font-display font-bold text-background",
        size === "sm" ? "h-7 w-7 text-xs" : "h-9 w-9 text-sm",
        className
      )}
    >
      {getInitials(name)}
    </div>
  );
}
