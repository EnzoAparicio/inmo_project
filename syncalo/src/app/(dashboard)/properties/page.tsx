import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import PropertiesClient from "./PropertiesClient";

export default async function PropertiesPage() {
  const session = await auth();
  if (!session?.user?.id || !session?.user?.orgId) redirect("/login");

  const properties = await db.property.findMany({
    where: { organizationId: session.user.orgId },
    include: {
      channels: { orderBy: { createdAt: "asc" } },
      _count: { select: { bookings: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Propiedades</h1>
          <p className="text-gray-500 text-sm mt-1">
            Gestioná tus propiedades y conectá tus calendarios
          </p>
        </div>
      </div>
      <PropertiesClient properties={properties} />
    </div>
  );
}
