"use client";

// Hidden <input type="file"> behind an imperative `open()` handle.
//
// Supplied by the HOST, not by the vendored slice: `slices/notion-app` imports
// `@/shared/ui/FilePicker` but the rr lift does not ship it (same gap the
// appshell lift left behind `@/shared/agentic`). Keeping the shim outside the
// slice leaves the slice byte-identical to upstream, so `rr update notion-app`
// never conflicts here.
//
// No visual surface of its own — the input is `hidden`, so there is nothing to
// style and nothing to keep in sync with the Arcade Cabinet tokens.

import { useImperativeHandle, useRef, type Ref } from "react";

export interface FilePickerHandle {
  /** Open the native file dialog. */
  open: () => void;
}

export interface FilePickerProps {
  ref?: Ref<FilePickerHandle>;
  /** Native `accept` attribute, e.g. "image/*". */
  accept?: string;
  multiple?: boolean;
  "aria-label"?: string;
  onFiles: (files: File[]) => void;
}

export function FilePicker({
  ref,
  accept,
  multiple = false,
  onFiles,
  "aria-label": ariaLabel,
}: FilePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({ open: () => inputRef.current?.click() }), []);

  return (
    <input
      ref={inputRef}
      type="file"
      hidden
      accept={accept}
      multiple={multiple}
      aria-label={ariaLabel}
      onChange={(e) => {
        const files = Array.from(e.target.files ?? []);
        // Reset so picking the SAME file twice in a row still fires `change`.
        e.target.value = "";
        if (files.length > 0) onFiles(files);
      }}
    />
  );
}
