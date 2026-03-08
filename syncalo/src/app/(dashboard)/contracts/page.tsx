import type { Metadata } from "next";
import { auth } from "@/lib/auth";

export const metadata: Metadata = { title: "Contratos" };
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import ContractsClient from "./ContractsClient";

export default async function ContractsPage() {
  const session = await auth();
  if (!session?.user?.orgId) redirect("/login");

  const [contractsRaw, properties, tenants] = await Promise.all([
    db.contract.findMany({
      where: { organizationId: session.user.orgId },
      include: {
        property: { select: { id: true, name: true } },
        tenant: { select: { id: true, name: true } },
        payments: { orderBy: { dueDate: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.property.findMany({
      where: { organizationId: session.user.orgId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.tenant.findMany({
      where: { organizationId: session.user.orgId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const contracts = contractsRaw.map((c) => ({
    ...c,
    startDate: c.startDate.toISOString(),
    endDate: c.endDate?.toISOString() ?? null,
    payments: c.payments.map((p) => ({
      ...p,
      dueDate: p.dueDate.toISOString(),
      paidAt: p.paidAt?.toISOString() ?? null,
    })),
  }));

  return <ContractsClient contracts={contracts} properties={properties} tenants={tenants} />;
}
