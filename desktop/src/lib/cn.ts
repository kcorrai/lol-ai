/**
 * Conditional class names.
 *
 * Deliberately not `clsx` + `tailwind-merge` as the website uses. Those exist there to
 * reconcile classes arriving from props across ~300 shared components; this app has a
 * handful of screens that own their own markup, and a companion that runs beside a game
 * should not carry two dependencies to do a `join`.
 */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
