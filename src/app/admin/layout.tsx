import { requireSession } from "@/lib/session";
import { AdminShell } from "./AdminShell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();

  return (
    <AdminShell userLabel={session.user.login ?? session.user.name ?? ""}>
      {children}
    </AdminShell>
  );
}
