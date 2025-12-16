import { getSession } from "@/auth";
import { redirect } from "next/navigation";
import { Layout } from "@/providers/layout";
import { ModalFormProvider } from "@discovery-solutions/struct/client";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  const allowedRoles = ["admin", "operational", "commercial"];

  if (!allowedRoles.includes(session.user?.role))
    return redirect("/app");

  return <Layout>{children}</Layout>;
}