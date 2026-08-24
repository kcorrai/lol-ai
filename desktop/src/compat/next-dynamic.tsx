import { Suspense, lazy } from "react";
import type { ComponentType, ReactNode } from "react";

/**
 * `next/dynamic`, for the two website components that use it (ADR-043).
 *
 * `React.lazy` behind the caller's own `loading` element. Next's version also skips the
 * server render when told `ssr: false`; there is no server render here, so that option is
 * accepted and ignored rather than refused — the dashboard passes it, and it means exactly
 * nothing in this process.
 */
interface DynamicOptions {
  loading?: () => ReactNode;
  ssr?: boolean;
}

export default function dynamic<P extends object>(
  load: () => Promise<ComponentType<P> | { default: ComponentType<P> }>,
  options: DynamicOptions = {}
): ComponentType<P> {
  // `lazy` types its result as taking `PropsWithRef<P>`, which an unconstrained `P` cannot
  // be shown to satisfy. The cast is to the type the caller already declared — this is
  // TypeScript being unable to see through the generic, not a claim about the props.
  const Lazy = lazy(async () => {
    const loaded = await load();
    // The website calls this both ways — `import("./x").then(m => m.X)` returns the
    // component itself, a bare `import()` returns the module.
    return "default" in loaded ? loaded : { default: loaded };
  }) as unknown as ComponentType<P>;

  const fallback = options.loading?.() ?? null;

  return function Dynamic(props: P): React.ReactElement {
    return (
      <Suspense fallback={fallback}>
        <Lazy {...props} />
      </Suspense>
    );
  };
}
