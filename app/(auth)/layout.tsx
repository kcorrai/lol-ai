export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="mb-8 text-center">
        <p className="font-display text-3xl font-bold text-accent">LoL AI Coach</p>
        <p className="mt-1 text-sm text-text-muted">Yapay Zeka Destekli LoL Koçu</p>
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
