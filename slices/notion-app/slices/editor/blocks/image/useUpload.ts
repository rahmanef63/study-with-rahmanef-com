import { useState } from "react";
import { toast } from "sonner";
import { useEditorAdapter } from "../../lib/adapterContext";
import { reportError } from "@notion/shared/lib/error";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB

/** Image upload via the host's EditorAdapter (`page.uploadFile`). When no
 *  upload capability is supplied the affordance disables itself with a toast
 *  rather than throwing — graceful degradation per the adapter contract. */
export function useImageUpload(onUrl: (url: string) => void) {
  const [uploading, setUploading] = useState(false);
  const uploadFile = useEditorAdapter().page?.uploadFile;

  const onUploadFile = async (file: File) => {
    if (uploading) return;
    if (!uploadFile) {
      toast.error("Uploads not configured");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Pick an image file");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Image too large (max 10 MB)");
      return;
    }
    setUploading(true);
    try {
      const url = await uploadFile(file);
      if (!url) throw new Error("Storage URL not available");
      onUrl(url);
      toast.success("Image uploaded");
    } catch (err) {
      const safe = reportError("ImageBlock.upload", err);
      toast.error(safe.message);
    } finally {
      setUploading(false);
    }
  };

  return { uploading, onUploadFile };
}
