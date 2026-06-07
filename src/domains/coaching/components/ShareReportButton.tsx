"use client";

import { useState } from "react";
import { Share2, Copy, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useShareReport } from "@/hooks/useShareReport";

interface Props {
  reportId: string;
}

export function ShareReportButton({ reportId }: Props) {
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { mutate: generateShare, isPending } = useShareReport(reportId);

  function handleShare() {
    if (shareUrl) {
      copyToClipboard(shareUrl);
      return;
    }

    generateShare(undefined, {
      onSuccess: (result) => {
        setShareUrl(result.shareUrl);
        setErrorMsg(null);
        copyToClipboard(result.shareUrl);
      },
      onError: (err) => {
        const msg = err.message?.toLowerCase() ?? "";
        setErrorMsg(
          msg.includes("limit") || msg.includes("429")
            ? "Paylaşım limiti doldu. Lütfen daha sonra tekrar dene."
            : "Paylaşım linki oluşturulamadı. Tekrar dene."
        );
        setTimeout(() => setErrorMsg(null), 5000);
      },
    });
  }

  function copyToClipboard(url: string) {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="mt-6 rounded-lg border border-border bg-surface-2 p-4">
      <p className="mb-3 text-xs font-medium text-text-muted">
        Raporunu paylaş, arkadaşlarına meydan oku
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleShare}
          disabled={isPending}
          className="flex items-center gap-1.5"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-success" />
              Kopyalandı!
            </>
          ) : (
            <>
              {isPending ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border border-accent border-t-transparent" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              Paylaşım linkini kopyala
            </>
          )}
        </Button>

        {shareUrl && (
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent("LoL AI Coach'tan AI koçluk raporum hazır! Bir bak 👇")}&url=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-transparent px-3 py-1.5 text-xs font-medium text-text-muted transition-colors hover:border-accent/50 hover:text-text"
          >
            <Share2 className="h-3.5 w-3.5" />
            X&apos;te Paylaş
          </a>
        )}
      </div>

      {shareUrl && !errorMsg && (
        <p className="mt-2 truncate font-mono text-xs text-text-muted/60">{shareUrl}</p>
      )}

      {errorMsg && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-danger">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {errorMsg}
        </p>
      )}
    </div>
  );
}
