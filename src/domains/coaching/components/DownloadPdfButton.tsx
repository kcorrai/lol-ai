"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CoachingReportDetail } from "@/types/coaching.frontend";

interface Props {
  report: CoachingReportDetail;
  isPro: boolean;
}

export function DownloadPdfButton({ report, isPro }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      // Dynamic import keeps the heavy react-pdf bundle out of the initial load.
      const [{ pdf }, { ReportPdfDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./ReportPdfDocument"),
      ]);

      const blob = await pdf(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- pdf() accepts ReactElement but types differ across versions
        ReportPdfDocument({ report, isPro }) as any
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `coaching-report-${report.id.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("[pdf] generation failed", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={handleDownload}
      disabled={loading}
      className="gap-1.5"
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Download className="h-3.5 w-3.5" />
      )}
      {loading ? "Hazırlanıyor…" : "PDF İndir"}
    </Button>
  );
}
