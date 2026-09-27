import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  signedIn: boolean;
  ready: boolean;
  pending: boolean;
  onSubmit: () => void;
  onSignIn: (path: "/login" | "/register") => void;
}

/**
 * The request page's buttons. Signed out, they lead to an account instead of
 * sending — after the student has written the request, never before it.
 */
export function SubmitButtons({
  signedIn,
  ready,
  pending,
  onSubmit,
  onSignIn,
}: Props): React.ReactElement {
  if (signedIn) {
    return (
      <Button onClick={onSubmit} disabled={!ready || pending} className="w-full">
        {pending ? "Sending…" : "Send request"}
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Button>
    );
  }

  return (
    <>
      <Button onClick={() => onSignIn("/login")} disabled={!ready} className="w-full">
        Sign in to send request
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Button>
      <button
        type="button"
        onClick={() => onSignIn("/register")}
        disabled={!ready}
        className="text-center text-[12.5px] text-text-muted underline-offset-4 hover:text-accent hover:underline disabled:opacity-50"
      >
        New here? Create a free account — your request is kept
      </button>
    </>
  );
}
