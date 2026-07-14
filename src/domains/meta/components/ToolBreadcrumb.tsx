import Link from "next/link";

export interface Crumb {
  name: string;
  href: string;
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://lolaicoach.gg";

// Breadcrumb nav + BreadcrumbList JSON-LD. The last crumb is rendered as the
// current page (not a link).
export function ToolBreadcrumb({ items }: { items: Crumb[] }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: `${BASE_URL}${c.href}`,
    })),
  };

  return (
    <nav aria-label="Breadcrumb" className="mb-6 text-xs text-text-muted">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {items.map((crumb, i) => {
        const last = i === items.length - 1;
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
