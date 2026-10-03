// @vitest-environment node
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, expect, test, vi } from "vitest";
import type { Id } from "@convex/_generated/dataModel";
import { McpAccessView } from "./mcp-access-view";
import { McpRevokeDialog, McpTokenTable } from "./token-table";
import { McpTokenSetup } from "./token-setup";
import { mcpConfiguration, mcpError, type TokenRow } from "./model";
import { useMcpActions } from "./use-mcp-actions";

const state = vi.hoisted(() => ({ authenticated: false, loading: false, admin: false }));
const rawIssue = vi.hoisted(() => vi.fn());
const rawRevoke = vi.hoisted(() => vi.fn());
const rawList = vi.hoisted(() => vi.fn<(...args: unknown[]) => unknown[]>(() => []));
vi.mock("convex/react", () => ({ useAction: () => rawIssue, useMutation: () => rawRevoke, useQuery: (...args: unknown[]) => rawList(...args) }));
vi.mock("next/link", () => ({ default: ({ children, ...props }: React.ComponentProps<"a">) => <a {...props}>{children}</a> }));
vi.mock("@/features/profiles", () => ({ useCurrentProfile: () => ({
  isAuthenticated: state.authenticated, isLoading: state.loading,
  profile: state.authenticated ? { _id: "profile", isPlatformAdmin: state.admin } : null,
}) }));
vi.mock("@/features/responsive-dialog", () => ({
  ResponsiveDialog: "div", ResponsiveDialogBody: "div", ResponsiveDialogFooter: "div",
  ResponsiveDialogHeader: "div", ResponsiveDialogTitle: "h2",
}));
afterEach(() => { vi.clearAllMocks(); state.authenticated = false; state.loading = false; state.admin = false; });

const row: TokenRow = {
  tokenId: "token" as Id<"mcpTokens">, label: "Cursor laptop", scope: "user",
  createdAt: Date.parse("2026-10-02T17:00:00Z"), expiresAt: Date.parse("2026-11-01T17:00:00Z"), lastUsedAt: null, expired: false,
};

test("signed-out and unresolved auth never subscribe to the private list", () => {
  expect(renderToStaticMarkup(<McpAccessView scope="user" />)).toContain("Masuk untuk mengelola token");
  state.loading = true;
  expect(renderToStaticMarkup(<McpAccessView scope="user" />)).toContain("Memeriksa akses MCP");
  expect(rawList).not.toHaveBeenCalled();
});

test("community member has user scope only; platform flag permits admin presentation without giving frontend authority", () => {
  state.authenticated = true;
  expect(renderToStaticMarkup(<McpAccessView scope="admin" />)).toContain("tidak memiliki akses MCP admin");
  expect(rawList).not.toHaveBeenCalled();
  expect(renderToStaticMarkup(<McpAccessView scope="user" />)).toContain("Buat token user");
  expect(rawList).toHaveBeenCalledTimes(1);
  state.admin = true;
  const html = renderToStaticMarkup(<McpAccessView scope="admin" />);
  expect(html).toContain("Buat token admin");
  expect(html).not.toContain("<h1");
});

test("configuration is token-free, scoped and never claims OAuth/static-key bypass", () => {
  for (const scope of ["user", "admin"] as const) {
    const config = JSON.parse(mcpConfiguration(scope));
    expect(config.mcpServers["study-with-rahman"]).toEqual({ url: `https://study-with.rahmanef.com/api/mcp/${scope}`, headers: { Authorization: "Bearer TOKEN_BARU_ANDA" } });
    const html = renderToStaticMarkup(<McpTokenSetup scope={scope} fresh={null} onHide={() => {}} />);
    expect(html).not.toContain("mcp-new-token");
    expect(html).not.toContain("OAuth");
    expect(html).not.toContain("MCP_API_KEY");
    expect(html).toContain("muat ulang daftar tools");
  }
});

test("safe token table separates status, expiry and scope without plaintext", () => {
  const html = renderToStaticMarkup(<McpTokenTable rows={[row, { ...row, tokenId: "expired" as Id<"mcpTokens">, expired: true }]} pending={false} onRevoke={() => {}} />);
  expect(html).toContain("Kedaluwarsa");
  expect(html).toContain("Aktif");
  expect(html).toContain("3 Okt 2026");
  expect(html).toContain("Belum digunakan");
  expect(html).toContain("Cabut token Cursor laptop");
  expect(html).not.toContain("Bearer");
});

test.each([true, false])("revoke dialog closes only after successful operation (%s)", async success => {
  const close = vi.fn();
  const dialog = McpRevokeDialog({ target: row, pending: false, onClose: close, onConfirm: async () => success });
  const props = dialog.props as { children: ReactElement[] };
  const footer = props.children[2] as ReactElement<{ children: ReactElement<{ onClick: () => Promise<void> }>[] }>;
  await footer.props.children[1].props.onClick();
  expect(close).toHaveBeenCalledTimes(success ? 1 : 0);
});

test("pending revoke blocks confirmation and dismiss, and failure is visible inside the dialog", async () => {
  const close = vi.fn();
  const confirm = vi.fn();
  const dialog = McpRevokeDialog({ target: row, pending: true, error: "Permintaan gagal", onClose: close, onConfirm: confirm });
  const props = dialog.props as { onOpenChange: (open: boolean) => void; children: ReactElement[] };
  props.onOpenChange(false);
  const footer = props.children[2] as ReactElement<{ children: ReactElement<{ onClick: () => Promise<void> }>[] }>;
  await footer.props.children[1].props.onClick();
  expect(close).not.toHaveBeenCalled();
  expect(confirm).not.toHaveBeenCalled();
  const body = props.children[1] as ReactElement;
  expect(renderToStaticMarkup(body)).toContain("Permintaan gagal");
});

test("single mutation lock covers issue and revoke and releases after failure", async () => {
  let actions!: ReturnType<typeof useMcpActions>;
  function Probe() { actions = useMcpActions("user"); return null; }
  renderToStaticMarkup(<Probe />);
  let reject!: (error: Error) => void;
  rawIssue.mockImplementationOnce(() => new Promise((_, fail) => { reject = fail; }));
  const first = actions.issue(" Cursor laptop ", 7);
  expect(await actions.issue("Duplicate", 7)).toBeNull();
  expect(await actions.revoke(row.tokenId)).toBe(false);
  expect(rawIssue).toHaveBeenCalledTimes(1);
  expect(rawRevoke).not.toHaveBeenCalled();
  expect(rawIssue).toHaveBeenCalledWith({ label: "Cursor laptop", scope: "user", ttlDays: 7 });
  reject(new Error("Unreachable"));
  expect(await first).toBeNull();
  rawRevoke.mockResolvedValueOnce({ revoked: true });
  expect(await actions.revoke(row.tokenId)).toBe(true);
  expect(rawRevoke).toHaveBeenCalledTimes(1);
});

test("errors use localized codes and never echo unknown backend text or credentials", () => {
  expect(mcpError({ data: { code: "NOT_AUTHORIZED", message: "secret token" } })).toContain("tidak memiliki akses MCP admin");
  expect(mcpError(new Error("secret token"))).not.toContain("secret token");
});
