"use client";
// comments slice — destructive-action confirm on the mandatory dialog
// primitive (ResponsiveDialog, alert variant — kitab rule: no raw dialogs).
// Pattern: slices/courses/components/manage/confirm-dialog.tsx.
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/features/responsive-dialog";
import { Button } from "@/components/ui/button";
import type { CommentsCopy } from "../config/copy";

export type DeleteCommentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => boolean | void | Promise<boolean | void>;
  pending: boolean;
  copy: CommentsCopy;
};

export function DeleteCommentDialog({
  open,
  onOpenChange,
  onConfirm,
  pending,
  copy,
}: DeleteCommentDialogProps) {
  return (
    <ResponsiveDialog open={open} onOpenChange={(nextOpen) => { if (!pending) onOpenChange(nextOpen); }} variant="alert" size="sm">
      <ResponsiveDialogHeader>
        <ResponsiveDialogTitle>{copy.deleteConfirmTitle}</ResponsiveDialogTitle>
      </ResponsiveDialogHeader>
      <ResponsiveDialogBody>
        <p className="text-sm text-muted-foreground">{copy.deleteConfirmBody}</p>
      </ResponsiveDialogBody>
      <ResponsiveDialogFooter>
        <Button type="button" variant="outline" className="min-h-11" disabled={pending} onClick={() => onOpenChange(false)}>
          {copy.cancel}
        </Button>
        <Button
          type="button"
          variant="destructive"
          className="min-h-11"
          disabled={pending}
          aria-busy={pending}
          onClick={async () => {
            if (pending) return;
            if (await onConfirm() !== false) onOpenChange(false);
          }}
        >
          {copy.deleteConfirm}
        </Button>
      </ResponsiveDialogFooter>
    </ResponsiveDialog>
  );
}
