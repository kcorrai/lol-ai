import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms and conditions for using LoL AI Coach.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-4xl font-bold text-text">Terms of Service</h1>
      <p className="mt-3 text-sm text-text-muted">Last updated: June 2026</p>

      <div className="mt-10 space-y-10 text-sm leading-relaxed text-text-muted">
        <section>
          <h2 className="mb-3 font-display text-xl font-semibold text-text">Service Description</h2>
          <p>
            LoL AI Coach (&quot;we&quot;, &quot;us&quot;, &quot;the Service&quot;) provides
            AI-generated coaching reports and performance analytics for League of Legends players.
            The Service is provided &quot;as is&quot; and is intended for personal, non-commercial
            use.
          </p>
          <p className="mt-3">
            By creating an account and using the Service, you agree to these Terms of Service. If
            you do not agree, do not use the Service.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-display text-xl font-semibold text-text">
            User Responsibilities
          </h2>
          <p>You agree to:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Provide accurate information when creating your account.</li>
            <li>Keep your login credentials secure and not share them with others.</li>
            <li>Use the Service in compliance with Riot Games&apos; Terms of Service.</li>
            <li>Not attempt to reverse-engineer, scrape, or abuse the Service.</li>
            <li>Not use the Service for any unlawful purpose.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 font-display text-xl font-semibold text-text">
            Riot Games Disclaimer
          </h2>
          <p>
            LoL AI Coach isn&apos;t endorsed by Riot Games and doesn&apos;t reflect the views or
            opinions of Riot Games or anyone officially involved in producing or managing Riot Games
            properties. League of Legends and Riot Games are trademarks or registered trademarks of
            Riot Games, Inc. League of Legends &copy; Riot Games, Inc.
          </p>
          <p className="mt-3">
            LoL AI Coach uses the Riot Games API in accordance with the{" "}
            <a
              href="https://developer.riotgames.com/policies/general"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline underline-offset-2 hover:opacity-80"
            >
              Riot Games Developer Policies
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-display text-xl font-semibold text-text">No Warranty</h2>
          <p>
            The Service is provided without warranty of any kind, express or implied. AI-generated
            coaching reports are for informational purposes only and do not guarantee improvement in
            rank or game performance. We do not warrant that the Service will be uninterrupted,
            error-free, or that defects will be corrected.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-display text-xl font-semibold text-text">
            Limitation of Liability
          </h2>
          <p>
            To the fullest extent permitted by applicable law, LoL AI Coach and its operators shall
            not be liable for any indirect, incidental, special, consequential, or punitive damages
            arising out of or related to your use of the Service, including but not limited to loss
            of data, loss of profits, or any other intangible losses.
          </p>
          <p className="mt-3">
            Our total liability for any claim arising from the use of the Service shall not exceed
            the amount you paid us in the 12 months preceding the claim.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-display text-xl font-semibold text-text">Contact</h2>
          <p>
            Questions about these Terms can be directed to{" "}
            <a
              href="mailto:legal@lolaicoach.gg"
              className="text-accent underline underline-offset-2 hover:opacity-80"
            >
              legal@lolaicoach.gg
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
