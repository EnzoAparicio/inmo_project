import type { Metadata } from "next";
import { auth } from "@/lib/auth";

export const metadata: Metadata = { title: "Inquilinos" };
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import TenantsClient from "./TenantsClient";

export default async function TenantsPage() {
  const session = await auth();
  if (!session?.user?.orgId) redirect("/login");

  const tenants = await db.tenant.findMany({
    where: { organizationId: session.user.orgId },
    include: {
      contracts: {
        where: { status: "ACTIVE" },
        include: { property: { select: { name: true } } },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return <TenantsClient tenants={tenants} />;
}
