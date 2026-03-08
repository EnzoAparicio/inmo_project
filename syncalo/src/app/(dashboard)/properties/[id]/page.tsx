import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import PropertyDetailClient from "./PropertyDetailClient";

type Props = { params: Promise<{ id: string }> };

export default async function PropertyDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.orgId) redirect("/login");

  const { id } = await params;

  const property = await db.property.findUnique({
    where: { id },
    include: {
      channels: { orderBy: { createdAt: "asc" } },
      contracts: {
        include: {
          tenant: { select: { id: true, name: true, email: true, phone: true } },
          payments: { orderBy: { dueDate: "desc" }, take: 6 },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!property || property.organizationId !== session.user.orgId) notFound();

  const serialized = {
    id: property.id,
    name: property.name,
    address: property.address ?? null,
    channels: property.channels,
    contracts: property.contracts.map((c) => ({
      ...c,
      startDate: c.startDate.toISOString(),
      endDate: c.endDate?.toISOString() ?? null,
      payments: c.payments.map((p) => ({
        ...p,
        dueDate: p.dueDate.toISOString(),
        paidAt: p.paidAt?.toISOString() ?? null,
      })),
    })),
  };

  return (
    <div>
      <div className="mb-6">
        <Link href="/properties" className="text-sm text-gray-400 hover:text-gray-600 transition">
          ← Propiedades
        </Link>
      </div>
      <PropertyDetailClient property={serialized} />
    </div>
  );
}
