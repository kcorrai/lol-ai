import { buildJsonLd, type EsportsSchema } from "@/domains/esports/jsonLd";
import { jsonLdProps } from "@/lib/security/jsonLd";

/**
 * Emits a page's structured data. Every esports page type states what it is
 * through this one component; the mapping to schema.org lives in `jsonLd.ts`.
 */
export function EsportsJsonLd({ schema }: { schema: EsportsSchema }): React.ReactElement | null {
  const data = buildJsonLd(schema);
  if (!data) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={jsonLdProps(data)}
    />
  );
}
