import { useState } from "react";
import { Gamepad2, Link2 } from "lucide-react";
import { profileIconUrl } from "@/lib/ddragon";
import { cn } from "@/lib/cn";
import type { PairingState } from "@/lib/usePairing";

/**
 * Whose data is on screen.
 *
 * The website's top bar carries `RiotAccountSelector` for this, and until now this window
 * carried nothing — every lifted screen showed one account's games with no way to see
 * which account, and the only screen that said so was Pairing. Same chip as the website's,
 * without the dropdown and the sync button: a browser session can hold several Riot
 * accounts and switch between them, and a machine holds exactly one pairing.
 *
 * It is a button rather than a label because every answer it can give has a next step, and
 * that step is the same one — the Pairing screen, which is where a machine's identity is
 * changed.
 */
export function AccountChip({
  state,
  onOpenPairing,
}: {
  state: PairingState;
  onOpenPairing: () => void;
}): React.ReactElement | null {
  // Nothing to say yet, and nothing worth reserving space for: this resolves in one round
  // trip and a chip that flickers in is worse than one that arrives.
  //
  // The three mid-exchange states go here too. In practice none of them reaches this chip
  // — a window in any of them is drawing setup, which has no top bar — but they are states
  // with no account to name, and that is the same reason `pairing` was already listed.
  if (
    state.status === "loading" ||
    state.status === "pairing" ||
    state.status === "opening" ||
    state.status === "approving"
  ) {
    return null;
  }
  // The browser preview has no core to ask. It cannot be paired, so it has no account to
  // name, and saying "not paired" there would be a guess dressed as a fact.
  if (state.status === "unavailable") return null;

  if (state.status === "unpaired") {
    return (
      <Chip onClick={onOpenPairing} title="Pair this machine with your account">
        <Link2 className="h-4 w-4 shrink-0 text-text-muted" aria-hidden />
        <Line top="Not paired" bottom="Pair this machine" />
      </Chip>
    );
  }

  // The credential store could not be asked, so there is no answer to give. Said as the
  // absence it is rather than rounded down to "not paired", which is what this used to do
  // and what left a paired machine being told to pair again.
  if (state.status === "unknown") {
    return (
      <Chip onClick={onOpenPairing} title={state.error}>
        <Link2 className="h-4 w-4 shrink-0 text-warning" aria-hidden />
        <Line top="Pairing unknown" bottom="Keychain unreadable" />
      </Chip>
    );
  }

  // A token is in the keychain and the website could not be reached to say whose it is.
  // Distinct from unpaired on purpose — an app opened on a train is not an app cut off.
  if (state.status === "offline") {
    return (
      <Chip onClick={onOpenPairing} title="The website could not be reached">
        <Gamepad2 className="h-4 w-4 shrink-0 text-warning" aria-hidden />
        <Line top="Paired" bottom="Website unreachable" />
      </Chip>
    );
  }

  const riot = state.pairing.account.riotAccount;

  if (!riot) {
    return (
      <Chip onClick={onOpenPairing} title="No Riot account is linked to this profile">
        <Gamepad2 className="h-4 w-4 shrink-0 text-text-muted" aria-hidden />
        <Line top="No Riot account" bottom="Link one on the website" />
      </Chip>
    );
  }

  return (
    <Chip onClick={onOpenPairing} title="This machine's pairing">
      <SummonerAvatar iconId={riot.profileIconId} />
      <Line
        top={
          <>
            {riot.gameName}
            <span className="text-text-muted">#{riot.tagLine}</span>
          </>
        }
        bottom={`${riot.region.toUpperCase()} · LV ${riot.summonerLevel}`}
      />
    </Chip>
  );
}

/**
 * The website's chamfered chip, at the height this window's 44px bar has for one.
 */
function Chip({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "tag-cut flex min-w-0 items-center gap-2 border border-line-2 bg-surface-dark py-0.5 pl-1.5 pr-2.5",
        "transition-colors hover:bg-surface-2"
      )}
    >
      {children}
    </button>
  );
}

function Line({ top, bottom }: { top: React.ReactNode; bottom: string }): React.ReactElement {
  return (
    <span className="grid min-w-0 gap-px text-left">
      <span className="truncate text-[12px] leading-tight text-text">{top}</span>
      <span className="truncate font-mono text-[9px] leading-tight tracking-[0.12em] text-text-muted">
        {bottom}
      </span>
    </span>
  );
}

/**
 * Falls back to a glyph rather than to a broken image.
 *
 * Data Dragon is reachable from this window — the content policy names it — but a companion
 * is expected to be open while the connection is busy carrying a game, so the icon failing
 * is a normal Tuesday and not a fault worth showing as one.
 */
function SummonerAvatar({ iconId }: { iconId: number }): React.ReactElement {
  const [failed, setFailed] = useState(false);

  if (failed) return <Gamepad2 className="h-5 w-5 shrink-0 text-accent" aria-hidden />;

  return (
    <img
      src={profileIconUrl(iconId)}
      alt=""
      width={20}
      height={20}
      className="h-5 w-5 shrink-0 rounded-full"
      onError={() => setFailed(true)}
    />
  );
}
