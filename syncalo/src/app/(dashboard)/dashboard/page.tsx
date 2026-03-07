import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id || !session?.user?.orgId) redirect("/login");

  const [properties, bookings, subscription] = await Promise.all([
    db.property.count({ where: { organizationId: session.user.orgId } }),
    db.booking.count({
      where: {
        property: { organizationId: session.user.orgId },
        checkIn: { gte: new Date() },
        status: "CONFIRMED",
      },
    }),
    db.subscription.findUnique({
      where: { organizationId: session.user.orgId },
    }),
  ]);

  const isTrialing = subscription?.status === "TRIAL";
  const trialDaysLeft = subscription?.trialEndsAt
    ? Math.max(
        0,
        Math.ceil(
          (subscription.trialEndsAt.getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : 0;

  return (
    <div>
      {isTrialing && trialDaysLeft <= 7 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-3 rounded-xl mb-6 flex items-center justify-between">
          <span>
            Tu período de prueba vence en <strong>{trialDaysLeft} días</strong>
          </span>
          <Link
            href="/billing"
            className="text-amber-900 font-semibold underline hover:no-underline"
          >
            Elegir plan
          </Link>
        </div>
      )}

      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        Hola, {session.user?.name?.split(" ")[0]}
      </h1>
      <p className="text-gray-500 text-sm mb-8">Resumen de tus propiedades</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Propiedades</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{properties}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Reservas próximas</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{bookings}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Plan actual</p>
          <p className="text-3xl font-bold text-gray-900 mt-1 capitalize">
            {subscription?.plan?.toLowerCase() ?? "Free"}
          </p>
        </div>
      </div>

      {properties === 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 text-center">
          <p className="text-gray-700 font-medium mb-2">
            Todavía no tenés propiedades
          </p>
          <p className="text-gray-500 text-sm mb-4">
            Agregá tu primera propiedad y conectá tu calendario de Airbnb o
            Booking.
          </p>
          <Link
            href="/properties"
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            Agregar propiedad
          </Link>
        </div>
      )}
    </div>
  );
}
