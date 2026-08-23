import type { Pairing } from "@/lib/pairing";

/**
 * What a paired machine knows about itself.
 *
 * Everything here came back from `/api/desktop/me`, which the core reached using the token
 * in the credential store — so seeing a name on this panel is itself the proof that the
 * token still works. The token is not among what came back.
 */
export function PairedDevice({
  pairing,
  onForget,
}: {
  pairing: Pairing;
  onForget: () => Promise<void>;
}): React.ReactElement {
  const { account, device } = pairing;
  const riot = account.riotAccount;

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-sm font-bold uppercase tracking-[0.08em] text-text">
            {device.label}
          </p>
          <p className="mt-0.5 text-sm text-text-body">
            Paired as {account.name ?? account.email ?? "your account"}.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void onForget()}
          className="tag-cut border border-line-2 bg-surface-dark px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-label text-text-muted transition-colors hover:border-danger/60 hover:text-danger"
        >
          Forget this device
        </button>
      </div>

      <div className="border-t border-line-1 pt-3">
        {riot ? (
          <p className="text-sm text-text-body">
            Reading{" "}
            <span className="font-mono text-accent">
              {riot.gameName}#{riot.tagLine}
            </span>{" "}
            · level {riot.summonerLevel} · {riot.region.toUpperCase()}
          </p>
        ) : (
          // A real state, not an error. Said plainly rather than shown as an empty panel
          // the player has to work out for themselves.
          <p className="text-sm text-text-muted">
            No Riot account is linked to this profile yet. Link one on the website and this
            app will read it.
          </p>
        )}
      </div>

      <p className="text-xs text-text-muted">
        Forgetting the device here clears the token from this machine only. To cut it off
        everywhere, revoke it in Settings on the website.
      </p>
    </div>
  );
}
