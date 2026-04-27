/**
 * Global Readability Audit (dev-only)
 *
 * Scans the live DOM for text nodes whose computed color fails the
 * WCAG 2.1 contrast ratio against their effective background, and for
 * elements that render text invisibly (transparent / 0 alpha / same as bg).
 *
 * Findings are:
 *   - Logged to the console (grouped, with a click-to-inspect element ref)
 *   - Aggregated into `window.__a11yAudit` for programmatic access
 *   - Emitted via a custom `readability-audit` CustomEvent so the UI badge
 *     can subscribe and display a count.
 *
 * The audit is debounced and re-runs on route change + DOM mutations.
 * It is a no-op in production builds.
 */

export type Severity = "fail" | "warn" | "invisible";

export interface AuditFinding {
  el: HTMLElement;
  text: string;
  fg: string;        // rgba string of computed color
  bg: string;        // rgba string of resolved background
  ratio: number;     // contrast ratio (0 = invisible)
  required: number;  // WCAG required minimum for this text size
  severity: Severity;
  reason: string;
  selector: string;  // best-effort CSS selector
}

const WCAG_AA_NORMAL = 4.5;
const WCAG_AA_LARGE = 3.0;
const LARGE_TEXT_PX = 18.66; // 14pt bold / 18pt regular

// ---------- color utilities ----------

function parseColor(input: string): [number, number, number, number] | null {
  // Handles rgb(), rgba(), and the special "transparent" keyword
  if (!input || input === "transparent") return [0, 0, 0, 0];
  const m = input.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const parts = m[1].split(/[,\s/]+/).filter(Boolean).map(Number);
  if (parts.length < 3) return null;
  const [r, g, b] = parts;
  const a = parts.length >= 4 ? parts[3] : 1;
  return [r, g, b, a];
}

function relLuminance([r, g, b]: [number, number, number, number]): number {
  const norm = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * norm[0] + 0.7152 * norm[1] + 0.0722 * norm[2];
}

function contrastRatio(
  fg: [number, number, number, number],
  bg: [number, number, number, number],
): number {
  const L1 = relLuminance(fg);
  const L2 = relLuminance(bg);
  const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (hi + 0.05) / (lo + 0.05);
}

/** Composite fg over bg using fg's alpha (Porter–Duff "over") */
function compositeOver(
  fg: [number, number, number, number],
  bg: [number, number, number, number],
): [number, number, number, number] {
  const a = fg[3] + bg[3] * (1 - fg[3]);
  if (a === 0) return [0, 0, 0, 0];
  return [
    (fg[0] * fg[3] + bg[0] * bg[3] * (1 - fg[3])) / a,
    (fg[1] * fg[3] + bg[1] * bg[3] * (1 - fg[3])) / a,
    (fg[2] * fg[3] + bg[2] * bg[3] * (1 - fg[3])) / a,
    a,
  ];
}

/** Walk up parents until we find an element with an opaque background */
function resolveBackground(el: HTMLElement): [number, number, number, number] {
  let acc: [number, number, number, number] = [0, 0, 0, 0];
  let cur: HTMLElement | null = el;
  // Default page background as the ultimate fallback
  const bodyBg =
    parseColor(getComputedStyle(document.body).backgroundColor) ??
    [255, 255, 255, 1];
  while (cur) {
    const cs = getComputedStyle(cur);
    const c = parseColor(cs.backgroundColor);
    // Detect background-image / gradient — we cannot reliably sample it,
    // so we treat it as opaque mid-gray to avoid false positives.
    const hasBgImage = cs.backgroundImage && cs.backgroundImage !== "none";
    if (c && c[3] > 0) {
      acc = compositeOver(acc, c);
      if (acc[3] >= 0.999) return acc;
    }
    if (hasBgImage && acc[3] < 0.999) {
      // Stop walking — assume the gradient covers the rest. Use a neutral
      // sample so we don't flag everything on top of gradients.
      const sample: [number, number, number, number] = [128, 128, 128, 1];
      return compositeOver(acc, sample);
    }
    cur = cur.parentElement;
  }
  return compositeOver(acc, bodyBg);
}

// ---------- DOM scanning ----------

const SKIP_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "NOSCRIPT",
  "SVG",
  "PATH",
  "CANVAS",
  "IFRAME",
  "INPUT",
  "TEXTAREA",
  "SELECT",
  "OPTION",
  "META",
  "LINK",
  "HEAD",
  "TITLE",
]);

function isOffscreenOrHidden(el: HTMLElement): boolean {
  const cs = getComputedStyle(el);
  if (cs.display === "none" || cs.visibility === "hidden") return true;
  if (cs.opacity && parseFloat(cs.opacity) === 0) return true;
  const rect = el.getBoundingClientRect();
  if (rect.width < 2 || rect.height < 2) return true;
  // Skip elements positioned far off-screen (sr-only patterns)
  if (rect.right < 0 || rect.bottom < 0) return true;
  return false;
}

function isInsideAuditUI(el: HTMLElement): boolean {
  return !!el.closest("[data-a11y-audit]");
}

function bestSelector(el: HTMLElement): string {
  if (el.id) return `#${el.id}`;
  const cls = (el.className || "").toString().trim().split(/\s+/).slice(0, 2).join(".");
  return cls ? `${el.tagName.toLowerCase()}.${cls}` : el.tagName.toLowerCase();
}

function getDirectText(el: HTMLElement): string {
  let txt = "";
  for (const node of Array.from(el.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      txt += node.textContent ?? "";
    }
  }
  return txt.trim();
}

function classifyText(el: HTMLElement, cs: CSSStyleDeclaration) {
  const sizePx = parseFloat(cs.fontSize);
  const weight = parseInt(cs.fontWeight, 10) || 400;
  const isLarge = sizePx >= 24 || (sizePx >= LARGE_TEXT_PX && weight >= 700);
  return { sizePx, weight, isLarge };
}

/** Scan the document and return all readability findings */
export function runAudit(root: ParentNode = document.body): AuditFinding[] {
  const findings: AuditFinding[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, {
    acceptNode(node) {
      const el = node as HTMLElement;
      if (SKIP_TAGS.has(el.tagName)) return NodeFilter.FILTER_REJECT;
      if (isInsideAuditUI(el)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  let cur = walker.nextNode() as HTMLElement | null;
  while (cur) {
    const direct = getDirectText(cur);
    if (direct && !isOffscreenOrHidden(cur)) {
      const cs = getComputedStyle(cur);
      const fg = parseColor(cs.color);
      // Account for inherited / parent opacity by collapsing into the bg
      // (we treat opacity as an additional alpha multiplier on fg).
      const opacity = parseFloat(cs.opacity || "1");
      if (fg) {
        const fgEffective: [number, number, number, number] = [
          fg[0],
          fg[1],
          fg[2],
          fg[3] * opacity,
        ];
        const bg = resolveBackground(cur);
        const composited = compositeOver(fgEffective, bg);
        const ratio = contrastRatio(composited, bg);
        const { isLarge, sizePx } = classifyText(cur, cs);
        const required = isLarge ? WCAG_AA_LARGE : WCAG_AA_NORMAL;

        let severity: Severity | null = null;
        let reason = "";
        if (fgEffective[3] === 0) {
          severity = "invisible";
          reason = "Text is fully transparent (alpha = 0).";
        } else if (ratio < 1.2) {
          severity = "invisible";
          reason = `Text colour ≈ background (ratio ${ratio.toFixed(2)}:1).`;
        } else if (ratio < required) {
          severity = ratio < required * 0.7 ? "fail" : "warn";
          reason = `Contrast ${ratio.toFixed(2)}:1 below WCAG AA ${required}:1 for ${sizePx.toFixed(0)}px text.`;
        }

        if (severity) {
          findings.push({
            el: cur,
            text: direct.length > 60 ? direct.slice(0, 57) + "…" : direct,
            fg: cs.color,
            bg: `rgba(${bg.map((v, i) => (i === 3 ? v.toFixed(2) : Math.round(v))).join(", ")})`,
            ratio: Number(ratio.toFixed(2)),
            required,
            severity,
            reason,
            selector: bestSelector(cur),
          });
        }
      }
    }
    cur = walker.nextNode() as HTMLElement | null;
  }
  return findings;
}

// ---------- runtime wiring ----------

declare global {
  interface Window {
    __a11yAudit?: {
      findings: AuditFinding[];
      run: () => AuditFinding[];
    };
  }
}

let scheduled = false;
let lastFindings: AuditFinding[] = [];

function logFindings(findings: AuditFinding[]) {
  if (findings.length === 0) {
    // eslint-disable-next-line no-console
    console.info("%c✓ Readability audit: no contrast issues found", "color: #16a34a; font-weight: 600");
    return;
  }
  // eslint-disable-next-line no-console
  console.groupCollapsed(
    `%c⚠ Readability audit: ${findings.length} issue${findings.length === 1 ? "" : "s"}`,
    "color: #d97706; font-weight: 700",
  );
  for (const f of findings) {
    const colour =
      f.severity === "invisible" ? "#dc2626" :
      f.severity === "fail" ? "#ea580c" :
      "#ca8a04";
    // eslint-disable-next-line no-console
    console.log(
      `%c[${f.severity.toUpperCase()}] %c${f.selector} %c"${f.text}"\n  ${f.reason}\n  fg: ${f.fg}  bg: ${f.bg}`,
      `color: ${colour}; font-weight: 700`,
      "color: #6b7280",
      "color: inherit",
      f.el,
    );
  }
  // eslint-disable-next-line no-console
  console.groupEnd();
}

export function scheduleAudit(delay = 800) {
  if (scheduled) return;
  scheduled = true;
  window.setTimeout(() => {
    scheduled = false;
    try {
      lastFindings = runAudit();
      logFindings(lastFindings);
      window.__a11yAudit = { findings: lastFindings, run: () => runAudit() };
      window.dispatchEvent(
        new CustomEvent("readability-audit", { detail: lastFindings }),
      );
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("Readability audit failed:", e);
    }
  }, delay);
}

export function startReadabilityAudit() {
  if (typeof window === "undefined") return;
  if (!import.meta.env.DEV) return;

  // Initial run after first paint
  if (document.readyState === "complete") {
    scheduleAudit(400);
  } else {
    window.addEventListener("load", () => scheduleAudit(400), { once: true });
  }

  // Re-run on SPA route changes
  const triggerOnNav = () => scheduleAudit(600);
  window.addEventListener("popstate", triggerOnNav);
  const origPush = history.pushState;
  const origReplace = history.replaceState;
  history.pushState = function (...args) {
    const ret = origPush.apply(this, args);
    triggerOnNav();
    return ret;
  };
  history.replaceState = function (...args) {
    const ret = origReplace.apply(this, args);
    triggerOnNav();
    return ret;
  };

  // Re-run when the DOM changes substantially
  const mo = new MutationObserver(() => scheduleAudit(1200));
  mo.observe(document.body, { childList: true, subtree: true, characterData: true });

  // Re-run on theme toggle (class changes on <html>)
  const themeObserver = new MutationObserver(() => scheduleAudit(400));
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
}

export function getLastFindings(): AuditFinding[] {
  return lastFindings;
}
