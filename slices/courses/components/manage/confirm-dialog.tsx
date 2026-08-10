"use client";
// courses slice — confirm dialog on the mandatory dialog primitive
// (ResponsiveDialog, alert variant — kitab rule: no raw dialogs).
//
// `tone` exists because the materi model has TWO different "are you sure?"
// moments and they must not look alike (DECISIONS #37):
//   · "keluarkan dari kelas" only deletes a PLACEMENT — the materi stays in the
//     community library and every other course that teaches it is untouched.
//     Painting that button red teaches instructors to fear a reversible edit,
//     so it renders as a normal action ("reversible").
//   · deleting the materi itself is irreversible and stays red ("destructive",
//     the default so an un-annotated call site can never quietly downgrade).
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/features/responsive-dialog";
import { Button } from "@/components/ui/button";

export type ConfirmDialogTone = "destructive" | "reversible";

export type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void | Promise<void>;
  /** Defaults to "destructive" — opt IN to the softer framing. */
  tone?: ConfirmDialogTone;
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  tone = "destructive",
}: ConfirmDialogProps) {
  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange} variant="alert" size="sm">
      <ResponsiveDialogHeader>
        <ResponsiveDialogTitle>{title}</ResponsiveDialogTitle>
      </ResponsiveDialogHeader>
      <ResponsiveDialogBody>
        <p className="text-pretty text-sm text-muted-foreground">{description}</p>
      </ResponsiveDialogBody>
      <ResponsiveDialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          {cancelLabel}
        </Button>
        <Button
          type="button"
          variant={tone === "destructive" ? "destructive" : "default"}
          onClick={async () => {
            await onConfirm();
            onOpenChange(false);
          }}
        >
          {confirmLabel}
        </Button>
      </ResponsiveDialogFooter>
    </ResponsiveDialog>
  );
}
