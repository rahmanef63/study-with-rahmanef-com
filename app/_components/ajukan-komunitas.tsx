"use client";

// "Ajukan komunitas" — the ONLY mount of RequestTenantForm in the product.
// It used to live in a dialog inside the OS komunitas app; without this island
// deleting the shell would silently retire the whole open-a-community flow
// (PRD R7 / DECISIONS #5) along with the Convex mutation behind it.
//
// The form self-contains its mutation, toasts and signed-out state, so this is
// just the trigger + the dialog.
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/features/responsive-dialog";
import { RequestTenantForm } from "@/features/tenants";

export function AjukanKomunitas() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" className="min-h-11 gap-1.5" onClick={() => setOpen(true)}>
        <Plus className="size-4" aria-hidden />
        Ajukan komunitas
      </Button>
      <ResponsiveDialog open={open} onOpenChange={setOpen} size="lg">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Ajukan komunitas baru</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Ceritakan komunitas yang ingin kamu buka. Pengajuan ditinjau admin dulu sebelum tayang.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody>
          <RequestTenantForm onSuccess={() => setOpen(false)} />
        </ResponsiveDialogBody>
      </ResponsiveDialog>
    </>
  );
}
