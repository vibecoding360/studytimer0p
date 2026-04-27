import { useEffect, useState } from "react";
import { AlertTriangle, X, Eye, EyeOff } from "lucide-react";
import type { AuditFinding } from "@/lib/readability-audit";

/**
 * Floating dev-only badge that surfaces readability audit findings.
 * Hidden in production builds. Click to open a panel listing all findings;
 * each row highlights the offending element on hover.
 */
export default function ReadabilityAuditBadge() {
  const [findings, setFindings] = useState<AuditFinding[]>([]);
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<AuditFinding[]>).detail ?? [];
      setFindings(detail);
    };
    window.addEventListener("readability-audit", handler);
    return () => window.removeEventListener("readability-audit", handler);
  }, []);

  if (!import.meta.env.DEV) return null;
  if (hidden) return null;

  const counts = {
    invisible: findings.filter((f) => f.severity === "invisible").length,
    fail: findings.filter((f) => f.severity === "fail").length,
    warn: findings.filter((f) => f.severity === "warn").length,
  };
  const total = findings.length;
  const tone =
    counts.invisible > 0 ? "bg-destructive text-destructive-foreground"
    : counts.fail > 0 ? "bg-warning text-warning-foreground"
    : total > 0 ? "bg-accent text-accent-foreground"
    : "bg-success text-success-foreground";

  const highlight = (el: HTMLElement) => {
    const prevOutline = el.style.outline;
    const prevOffset = el.style.outlineOffset;
    el.style.outline = "3px dashed hsl(var(--destructive))";
    el.style.outlineOffset = "2px";
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => {
      el.style.outline = prevOutline;
      el.style.outlineOffset = prevOffset;
    }, 2500);
  };

  return (
    <div
      data-a11y-audit
      className="fixed z-[1000] bottom-3 right-3 md:bottom-4 md:right-4 select-none"
    >
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`flex items-center gap-2 ${tone} px-3 py-1.5 rounded-full shadow-lg text-xs font-bold uppercase tracking-wider hover:scale-105 transition-transform`}
          title="Open readability audit"
        >
          {total > 0 ? <AlertTriangle className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          <span>A11y · {total}</span>
        </button>
      )}

      {open && (
        <div className="w-[360px] max-w-[calc(100vw-1.5rem)] max-h-[70vh] flex flex-col rounded-md border border-border bg-card text-card-foreground shadow-2xl overflow-hidden">
          <header className={`flex items-center justify-between px-3 py-2 ${tone}`}>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
              <AlertTriangle className="w-3.5 h-3.5" />
              Readability Audit
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setHidden(true)}
                title="Hide for this session"
                className="p-1 rounded hover:bg-black/10"
              >
                <EyeOff className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                title="Collapse"
                className="p-1 rounded hover:bg-black/10"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </header>

          <div className="px-3 py-2 border-b border-border bg-secondary/40 text-[11px] flex items-center gap-3">
            <span className="text-destructive font-semibold">Invisible: {counts.invisible}</span>
            <span className="text-warning font-semibold">Fail: {counts.fail}</span>
            <span className="text-accent-foreground font-semibold">Warn: {counts.warn}</span>
          </div>

          <ul className="flex-1 overflow-auto divide-y divide-border text-xs">
            {findings.length === 0 && (
              <li className="p-4 text-center text-success font-semibold">
                ✓ No contrast issues found on this view.
              </li>
            )}
            {findings.slice(0, 100).map((f, i) => (
              <li
                key={i}
                onMouseEnter={() => highlight(f.el)}
                onClick={() => highlight(f.el)}
                className="p-2.5 hover:bg-accent/10 cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                      f.severity === "invisible" ? "bg-destructive text-destructive-foreground"
                      : f.severity === "fail" ? "bg-warning text-warning-foreground"
                      : "bg-accent text-accent-foreground"
                    }`}
                  >
                    {f.severity}
                  </span>
                  <code className="text-[10px] text-muted-foreground truncate flex-1">{f.selector}</code>
                  <span className="text-[10px] font-mono text-muted-foreground">{f.ratio}:1</span>
                </div>
                <p className="font-medium text-foreground truncate">"{f.text}"</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{f.reason}</p>
              </li>
            ))}
            {findings.length > 100 && (
              <li className="p-2 text-center text-[10px] text-muted-foreground italic">
                + {findings.length - 100} more. See console for full list.
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
