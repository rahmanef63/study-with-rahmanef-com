import { AdminAccess } from "@/components/admin/admin-access";
import { AdminNav } from "@/components/admin/admin-nav";
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminAccess><div className="min-w-0"><AdminNav /><div className="py-6 md:py-8">{children}</div></div></AdminAccess>;
}
