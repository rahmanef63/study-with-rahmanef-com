"use client";

// OPTIONAL agentic entry — the ONLY appshell file that touches @/shared/agentic.
// Kept OUT of the core barrel (index.ts) so a consumer without a @/shared/agentic
// module can import @/features/appshell and compile (the appshell shell is
// brand- AND agent-free). A consumer that DOES run an agent (rr) imports from
// here:
//
//   import { AppshellAgentMount } from "@/features/appshell/agentic";
//   const manifest: ShellManifest = { ..., agentMount: AppshellAgentMount };
//
// AppshellAgentMount renders null; it exists only to self-register the shell's
// ToolCollection on the global host (via useAgentTools) at a stable mount point
// inside <AppShell>, exactly as the old inline `useAgentTools(appshellTools, {})`
// did — so rr's assistant keeps seeing the `appshell` tool namespace live.

import { useAgentTools } from "@/shared/agentic";
import { appshellTools } from "./lib/tools";

export { appshellTools } from "./lib/tools";
export type { AppshellCtx } from "./lib/tools";

/** Mount inside <AppShell> via `manifest.agentMount` to register appshellTools. */
export function AppshellAgentMount(): null {
  useAgentTools(appshellTools, {});
  return null;
}
