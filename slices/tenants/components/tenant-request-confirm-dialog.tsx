"use client";

// tenants slice — approve/reject confirmation on the mandatory dialog primitive
// (ResponsiveDialog, alert variant — rr UI rule: no raw dialogs). Approve is the
// default action; reject is styled destructive.
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/features/responsive-dialog";
import { Button } from "@/components/ui/button";

export type TenantRequestConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive?: boolean;
  isPending?: boolean;
  onConfirm: () => void | Promise<void>;
};

export function TenantRequestConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  destructive,
  isPending,
  onConfirm,
}: TenantRequestConfirmDialogProps) {
  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange} variant="alert" size="sm">
      <ResponsiveDialogHeader>
        <ResponsiveDialogTitle>{title}</ResponsiveDialogTitle>
      </ResponsiveDialogHeader>
      <ResponsiveDialogBody>
        <p className="text-muted-foreground text-sm">{description}</p>
      </ResponsiveDialogBody>
      <ResponsiveDialogFooter>
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => onOpenChange(false)}
        >
          {cancelLabel}
        </Button>
        <Button
          type="button"
          variant={destructive ? "destructive" : "default"}
          disabled={isPending}
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
