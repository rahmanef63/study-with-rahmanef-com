"use client";
import { useRef, useState } from "react";
import { useAction, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { mcpError, type FreshToken, type McpScope, type TokenTtl } from "./model";

/** One synchronous lock covers issue and revoke; plaintext is returned to component memory only. */
export function useMcpActions(scope: McpScope) {
  const issueRaw = useAction(api.features.mcp.tokens.issue);
  const revokeRaw = useMutation(api.features.mcp.tokens.revoke);
  const lock = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function perform<T>(operation: () => Promise<T>): Promise<T | null> {
    if (lock.current) return null;
    lock.current = true;
    setPending(true);
    setError(null);
    try { return await operation(); }
    catch (failure) { setError(mcpError(failure)); return null; }
    finally { lock.current = false; setPending(false); }
  }
  return {
    pending, error, clearError: () => setError(null),
    issue: (label: string, ttlDays: TokenTtl): Promise<FreshToken | null> => perform(() => issueRaw({ label: label.trim(), scope, ttlDays })),
    revoke: async (tokenId: Id<"mcpTokens">): Promise<boolean> => (await perform(() => revokeRaw({ tokenId }))) !== null,
  };
}
