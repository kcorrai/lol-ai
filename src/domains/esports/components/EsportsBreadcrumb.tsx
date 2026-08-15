import Link from "next/link";

export interface EsportsCrumb {
  name: string;
  href: string;
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://lolaicoach.gg";

/**
 * Breadcrumb trail plus its `BreadcrumbList` JSON-LD, rooted at the section hub
 * so every esports page links back up (ADR-017 §6). The last crumb is the
 * current page and is not a link.
 *
 * The free tools carry their own near-identical `ToolBreadcrumb`. Consolidating
 * the two into one shared primitive is listed in TASK-309 rather than done here
 * — that task already owns breadcrumbs across the section, and rewriting a
 * component the tool pages depend on is not this task's job.
 */
export function EsportsBreadcrumb({ items }: { items: EsportsCrumb[] }): React.ReactElement {
  const crumbs: EsportsCrumb[] = [{ name: "Esports", href: "/esports" }, ...items];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: `${BASE_URL}${crumb.href}`,
    })),
  };

  return (
    <nav aria-label="Breadcrumb" className="mb-6 text-xs text-text-muted">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {crumbs.map((crumb, index) => {
        const last = index === crumbs.length - 1;
        return (
          <span key={crumb.href}>
            {last ? (
              <span className="text-text">{crumb.name}</span>
            ) : (
              <>
                <Link href={crumb.href} className="hover:text-accent">
                  {crumb.name}
                </Link>
                <span className="mx-1.5">/</span>
              </>
            )}
          </span>
        );
      })}
    </nav>
  );
}
