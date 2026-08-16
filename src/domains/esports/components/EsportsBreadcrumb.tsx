import { Breadcrumb, type Crumb } from "@/components/shared/Breadcrumb";

export type EsportsCrumb = Crumb;

/**
 * The shared breadcrumb, rooted at the section hub.
 *
 * The markup and the JSON-LD live in `Breadcrumb`; this exists only so that no
 * esports page has to remember to prepend the root crumb. Forgetting it on one
 * page is invisible in the UI and orphans that page in the structured data,
 * which is exactly the failure this section cannot afford (ADR-017 §6).
 */
export function EsportsBreadcrumb({ items }: { items: EsportsCrumb[] }): React.ReactElement {
  return <Breadcrumb items={[{ name: "Esports", href: "/esports" }, ...items]} />;
}
