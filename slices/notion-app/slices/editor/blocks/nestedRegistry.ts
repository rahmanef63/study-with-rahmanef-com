import type { ComponentType } from "react";

/** The registered NestedBlock component. Its props stay untyped on purpose:
 *  NestedBlock's `Props` interface is private to NestedBlock.tsx, and
 *  re-declaring it here would re-couple the modules this registry exists
 *  to decouple (and drift silently when NestedBlock's props change). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- registry payload is intentionally untyped to break the NestedBlock import cycle
type NestedComponent = ComponentType<any>;

/** Module-level registry that breaks the import cycle between
 *  NestedBlock (top-down dispatcher) and recursive container blocks
 *  (ColumnBlockEditor, ToggleContent). NestedBlock writes itself here
 *  on first module load (via a side-effect import in BlockEditor.tsx);
 *  containers read it via `requireNested()` at render time. */
export const nestedRegistry: { Nested?: NestedComponent } = {};

/** Resolve the registered NestedBlock with a clear failure mode.
 *  Throws if the registry hasn't been populated — points to the missing
 *  side-effect import rather than surfacing React error #130. */
export function requireNested(): NestedComponent {
  if (!nestedRegistry.Nested) {
    throw new Error(
      "nestedRegistry.Nested is unregistered. " +
      "Ensure BlockEditor.tsx (or another root module of the editor) " +
      "has a side-effect import of './blocks/NestedBlock'.",
    );
  }
  return nestedRegistry.Nested;
}
