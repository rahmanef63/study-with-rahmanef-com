import { useRef, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FilePicker, type FilePickerHandle } from "@/shared/ui/FilePicker";
import type { MediaKind } from "./useUpload";

interface Props {
  kind: MediaKind;
  uploading: boolean;
  onFile: (f: File) => void;
  onUrl: (url: string) => void;
}

const ACCEPT: Record<MediaKind, string> = {
  audio: "audio/*",
  video: "video/*",
};

const LABEL: Record<MediaKind, string> = {
  audio: "audio file",
  video: "video file",
};

/** Generic file-or-URL dropzone for audio + video. Mirrors image's
 *  `UploadDropzone` shape — drop / click-upload / paste-URL. */
export function MediaDropzone({ kind, uploading, onFile, onUrl }: Props) {
  const [urlInput, setUrlInput] = useState("");
  const [dropTarget, setDropTarget] = useState(false);
  const pickerRef = useRef<FilePickerHandle>(null);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDropTarget(true); }}
      onDragLeave={() => setDropTarget(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDropTarget(false);
        const f = e.dataTransfer.files?.[0];
        if (f) onFile(f);
      }}
      className={cn(
        "rounded-md border border-dashed p-4 text-center transition",
        dropTarget ? "border-brand bg-brand/5" : "border-border",
      )}
    >
      <FilePicker
        ref={pickerRef}
        accept={ACCEPT[kind]}
        aria-label={`Upload ${LABEL[kind]}`}
        onFiles={(files) => { if (files[0]) onFile(files[0]); }}
      />
      <div className="mb-2 flex items-center justify-center gap-2 text-sm text-muted-foreground">
        {uploading ? (
          <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading…</>
        ) : (
          <>Drop a {LABEL[kind]} here, paste a URL, or
            <Button
              variant="link"
              type="button"
              onClick={() => pickerRef.current?.open()}
              className="inline-flex h-auto items-center gap-1 p-0 text-sm font-normal text-muted-foreground underline-offset-2 hover:underline [&_svg]:size-3"
            >
              <Upload className="h-3 w-3" /> upload
            </Button>
          </>
        )}
      </div>
      <form
        onSubmit={(e) => { e.preventDefault(); if (urlInput.trim()) onUrl(urlInput.trim()); }}
        className="mx-auto flex max-w-sm gap-2"
      >
        <Input
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="https://…"
          disabled={uploading}
          className="flex-1"
        />
        <Button type="submit" disabled={uploading || !urlInput.trim()} className="h-auto px-3 py-1.5">
          Embed
        </Button>
      </form>
    </div>
  );
}
