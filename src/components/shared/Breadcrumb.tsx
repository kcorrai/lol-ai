import Link from "next/link";
import { jsonLdProps } from "@/lib/security/jsonLd";

export interface Crumb {
  name: string;
  href: string;
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://lolaicoach.gg";

/**
 * Breadcrumb trail plus its `BreadcrumbList` JSON-LD. The last crumb is the
 * current page and is rendered as text rather than a link.
 *
 * One primitive for the whole site. The free tools and the esports section each
 * grew their own copy of this, which meant the visible trail and the structured
 * data behind it could drift apart per section — and the trail is what tells a
 * crawler how the two clusters relate (ADR-017 §6).
 */
export function Breadcrumb({ items }: { items: Crumb[] }): React.ReactElement {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((crumb, index) => ({
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
        dangerouslySetInnerHTML={jsonLdProps(jsonLd)}
      />
      {items.map((crumb, index) => {
        const last = index === items.length - 1;
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
