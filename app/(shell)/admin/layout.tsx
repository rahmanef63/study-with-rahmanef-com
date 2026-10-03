import { AdminAccess } from "@/components/admin/admin-access";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAccess>
      <div className="min-w-0 py-2 md:py-4">{children}</div>
    </AdminAccess>
  );
}
