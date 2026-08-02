"use client";

import { useEffect, useState } from "react";
import type {
  ChatMessage,
  QuickLinks,
  SearchHit,
  ShellCapabilities,
  SystemStats,
} from "../registry/capabilities";

// ════════════════════════════════════════════════════════════════════════
//  THE CAPABILITIES SWITCH (appshell analogue of file-explorer's lib/backend).
//  Inject `mockCapabilities` as `manifest.capabilities` to make EVERY bundled
//  shell feature show realistic data with NO backend — search results, live-ish
//  system widgets (CPU/mem/disk), a server toggle, an echoing AI inspector.
//  To go live, swap this one object for your real capabilities; the shell and
//  its features never change.
// ════════════════════════════════════════════════════════════════════════

// Search hits the palette can render + filter. `run` is a no-op in the mock
// (real consumers open a window / navigate). Identity is stable (module-level).
const MOCK_HITS: SearchHit[] = [
  { id: "h-report", label: "Quarterly report.pdf", hint: "Documents", run: () => {} },
  { id: "h-tokens", label: "Design tokens.fig", hint: "Projects", run: () => {} },
  { id: "h-budget", label: "budget.csv", hint: "Documents", run: () => {} },
  { id: "h-dark", label: "Toggle dark mode", hint: "Appearance", run: () => {} },
  { id: "h-wifi", label: "Network settings", hint: "System", run: () => {} },
  { id: "h-trash", label: "Empty Trash", hint: "Files", run: () => {} },
];

const mockSearch = async (query: string): Promise<SearchHit[]> => {
  const q = query.trim().toLowerCase();
  if (!q) return MOCK_HITS;
  return MOCK_HITS.filter((h) => `${h.label} ${h.hint ?? ""}`.toLowerCase().includes(q));
};

// Stable hook identity; the VALUE ticks via internal state (allowed — only the
// hook reference must be stable across renders, which a module-level fn is).
function useMockSystemStats(): SystemStats | null {
  const [s, setS] = useState<SystemStats | null>(null);
  useEffect(() => {
    const GiB = 1024 ** 3;
    const sample = (): SystemStats => ({
      cpu: { pct: 12 + Math.round(Math.random() * 46), cores: 8 },
      mem: { used: (6 + Math.random() * 5) * GiB, total: 16 * GiB },
      disk: { used: 289 * GiB, total: 460 * GiB },
    });
    setS(sample());
    const t = setInterval(() => setS(sample()), 2000);
    return () => clearInterval(t);
  }, []);
  return s;
}

function useMockCpuPercent(): number | null {
  const stats = useMockSystemStats();
  return stats ? stats.cpu.pct : null;
}

// Word-by-word echo so the inspector's streaming UI has something to render.
async function* mockChatStream(messages: ChatMessage[]): AsyncGenerator<string> {
  const last = messages[messages.length - 1]?.text ?? "";
  const reply = `Mock AI here. You said: "${last}". Wire useChat to your model to go live.`;
  for (const word of reply.split(" ")) {
    yield word + " ";
    await new Promise((r) => setTimeout(r, 45));
  }
}
const mockChat = () => mockChatStream;

// Static values hoisted to module scope so their object identity is STABLE
// across renders — capability hooks returning a fresh literal each call can spin
// a setState-in-effect loop in consumers that read them as effect deps.
const APPEARANCE = { theme: "light" as const, setTheme: () => {}, device: "auto" as const, wallpaper: "aurora" };
const SERVER_TOGGLE = { live: false, label: "Mock server", locked: false, toggle: () => {} };
// Website shortcuts for the dock / Launchpad / mobile grid (QuicklinkIcon).
// `open` is a real new-tab open so the demo links work; favicons via Google s2.
const QUICK_LINKS: QuickLinks = {
  items: [
    { id: "ql-gh", title: "GitHub", url: "https://github.com" },
    { id: "ql-mdn", title: "MDN", url: "https://developer.mozilla.org" },
  ],
  open: (link) => window.open(link.url, "_blank", "noopener"),
  faviconUrl: (url) => {
    try {
      return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`;
    } catch {
      return null;
    }
  },
};

// The full pack. Drop into a manifest: `capabilities: mockCapabilities`.
export const mockCapabilities: ShellCapabilities = {
  useAppearance: () => APPEARANCE,
  useCpuPercent: useMockCpuPercent,
  useSearch: () => mockSearch,
  useSystemStats: useMockSystemStats,
  useChat: mockChat,
  useServerToggle: () => SERVER_TOGGLE,
  useQuickLinks: () => QUICK_LINKS,
};
