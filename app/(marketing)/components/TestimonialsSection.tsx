import Link from "next/link";

export function TestimonialsSection() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-2xl px-6 text-center">
        <h2 className="font-display text-3xl font-bold text-text md:text-4xl">
          Be Among the First
        </h2>
        <p className="mt-4 text-text-muted">
          We&apos;re in early beta. Join now and help shape the product — free while we build.
        </p>
        <Link
          href="/register"
          className="mt-8 inline-block rounded-md bg-accent px-8 py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90"
        >
          Join the Beta — It&apos;s Free
        </Link>
      </div>
    </section>
  );
}
