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
  onConfirm: () => void | Promise<void>;
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
    <ResponsiveDialog open={open} onOpenChange={onOpenChange} variant="alert" size="sm">
      <ResponsiveDialogHeader>
        <ResponsiveDialogTitle>{copy.deleteConfirmTitle}</ResponsiveDialogTitle>
      </ResponsiveDialogHeader>
      <ResponsiveDialogBody>
        <p className="text-sm text-muted-foreground">{copy.deleteConfirmBody}</p>
      </ResponsiveDialogBody>
      <ResponsiveDialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          {copy.cancel}
        </Button>
        <Button
          type="button"
          variant="destructive"
          disabled={pending}
          onClick={async () => {
            await onConfirm();
            onOpenChange(false);
          }}
        >
          {copy.deleteConfirm}
        </Button>
      </ResponsiveDialogFooter>
    </ResponsiveDialog>
  );
}
