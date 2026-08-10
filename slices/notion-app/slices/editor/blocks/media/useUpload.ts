import { useState } from "react";
import { toast } from "sonner";
import { useEditorAdapter } from "../../lib/adapterContext";
import { reportError } from "@notion/shared/lib/error";

export type MediaKind = "audio" | "video";

const SIZE_CAP: Record<MediaKind, number> = {
  audio: 25 * 1024 * 1024,    // 25 MB — typical podcast clip
  video: 100 * 1024 * 1024,   // 100 MB — short clip
};

const LABEL: Record<MediaKind, string> = {
  audio: "Audio",
  video: "Video",
};

/** Generic audio/video upload via the host's EditorAdapter
 *  (`page.uploadFile`). Mirrors `useImageUpload`, parameterised by `kind`
 *  (MIME prefix + size cap + label). Degrades gracefully when no upload
 *  capability is supplied. */
export function useMediaUpload(kind: MediaKind, onUrl: (url: string) => void) {
  const [uploading, setUploading] = useState(false);
  const uploadFile = useEditorAdapter().page?.uploadFile;

  const onUploadFile = async (file: File) => {
    if (uploading) return;
    if (!uploadFile) {
      toast.error("Uploads not configured");
      return;
    }
    if (!file.type.startsWith(`${kind}/`)) {
      toast.error(`Pick a${kind === "audio" ? "n" : ""} ${kind} file`);
      return;
    }
    if (file.size > SIZE_CAP[kind]) {
      toast.error(`${LABEL[kind]} too large (max ${Math.round(SIZE_CAP[kind] / 1024 / 1024)} MB)`);
      return;
    }
    setUploading(true);
    try {
      const url = await uploadFile(file);
      if (!url) throw new Error("Storage URL not available");
      onUrl(url);
      toast.success(`${LABEL[kind]} uploaded`);
    } catch (err) {
      const safe = reportError(`${LABEL[kind]}Block.upload`, err);
      toast.error(safe.message);
    } finally {
      setUploading(false);
    }
  };

  return { uploading, onUploadFile };
}
