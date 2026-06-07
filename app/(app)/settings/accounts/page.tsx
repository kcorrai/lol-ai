import type { Metadata } from "next";
import { AccountConnectionForm } from "@/domains/riot/components/AccountConnectionForm";
import { ConnectedAccountsList } from "@/domains/riot/components/ConnectedAccountsList";
import { PageHeader } from "@/components/layout/PageHeader";

export const metadata: Metadata = { title: "Bağlı Hesaplar" };

export default function AccountsSettingsPage() {
  return (
    <div className="mx-auto max-w-lg p-8">
      <PageHeader
        title="Bağlı Hesaplar"
        subtitle="Riot hesaplarını yönet ve maç verilerini senkronize et."
      />

      <div className="space-y-8">
        <section className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-widest text-text-muted">
            Hesaplarım
          </p>
          <ConnectedAccountsList />
        </section>

        <section className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-widest text-text-muted">
            Hesap Ekle
          </p>
          <AccountConnectionForm />
        </section>
      </div>
    </div>
  );
}
