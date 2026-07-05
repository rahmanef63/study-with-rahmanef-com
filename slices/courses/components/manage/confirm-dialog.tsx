"use client";
// courses slice — destructive-action confirm on the mandatory dialog
// primitive (ResponsiveDialog, alert variant — kitab rule: no raw dialogs).
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/features/responsive-dialog";
import { Button } from "@/components/ui/button";

export type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void | Promise<void>;
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange} variant="alert" size="sm">
      <ResponsiveDialogHeader>
        <ResponsiveDialogTitle>{title}</ResponsiveDialogTitle>
      </ResponsiveDialogHeader>
      <ResponsiveDialogBody>
        <p className="text-sm text-muted-foreground">{description}</p>
      </ResponsiveDialogBody>
      <ResponsiveDialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          {cancelLabel}
        </Button>
        <Button
          type="button"
          variant="destructive"
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
