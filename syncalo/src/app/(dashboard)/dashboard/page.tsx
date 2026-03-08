import type { Metadata } from "next";
import { auth } from "@/lib/auth";

export const metadata: Metadata = { title: "Inicio" };
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import { es } from "date-fns/locale";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id || !session?.user?.orgId) redirect("/login");

  const orgId = session.user.orgId;
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [
    properties,
    upcomingBookings,
    subscription,
    activeContracts,
    pendingPayments,
    collectedThisMonth,
    lateTenants,
    monthlyRevenue,
  ] = await Promise.all([
    db.property.count({ where: { organizationId: orgId } }),
    db.booking.count({
      where: {
        property: { organizationId: orgId },
        checkIn: { gte: now },
        status: "CONFIRMED",
      },
    }),
    db.subscription.findUnique({ where: { organizationId: orgId } }),
    db.contract.count({ where: { organizationId: orgId, status: "ACTIVE" } }),
    db.payment.count({
      where: {
        contract: { organizationId: orgId },
        status: "PENDING",
        dueDate: { lte: now },
      },
    }),
    db.payment.aggregate({
      where: {
        contract: { organizationId: orgId },
        status: "PAID",
        paidAt: { gte: monthStart, lte: monthEnd },
      },
      _sum: { amount: true },
    }),
    db.payment.findMany({
      where: {
        contract: { organizationId: orgId },
        status: "PENDING",
        dueDate: { lt: now },
      },
      include: {
        contract: {
          include: {
            tenant: { select: { name: true } },
            property: { select: { name: true } },
          },
        },
      },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
    // Últimos 6 meses de recaudación
    Promise.all(
      Array.from({ length: 6 }, (_, i) => {
        const d = subMonths(now, 5 - i);
        const start = startOfMonth(d);
        const end = endOfMonth(d);
        return db.payment
          .aggregate({
            where: { contract: { organizationId: orgId }, status: "PAID", paidAt: { gte: start, lte: end } },
            _sum: { amount: true },
          })
          .then((r) => ({ month: format(d, "MMM", { locale: es }), amount: r._sum.amount ?? 0 }));
      })
    ),
  ]);

  const isTrialing = subscription?.status === "TRIAL";
  const trialDaysLeft = subscription?.trialEndsAt
    ? Math.max(0, Math.ceil((subscription.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const collected = collectedThisMonth._sum.amount ?? 0;

  const fmtMoney = (n: number) =>
    new Intl.NumberFormat("es-UY", { style: "currency", currency: "UYU", minimumFractionDigits: 0 }).format(n);

  return (
    <div>
      {isTrialing && trialDaysLeft <= 7 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-3 rounded-xl mb-6 flex items-center justify-between">
          <span>
            Tu período de prueba vence en <strong>{trialDaysLeft} días</strong>
          </span>
          <Link href="/billing" className="text-amber-900 font-semibold underline hover:no-underline">
            Elegir plan
          </Link>
        </div>
      )}

      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        Hola, {session.user?.name?.split(" ")[0]}
      </h1>
      <p className="text-gray-500 text-sm mb-8">Resumen de tu agencia</p>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Link href="/properties" className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-blue-200 transition">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Propiedades</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{properties}</p>
        </Link>
        <Link href="/contracts" className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-blue-200 transition">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Contratos activos</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{activeContracts}</p>
        </Link>
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Cobrado este mes</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{fmtMoney(collected)}</p>
        </div>
        <Link
          href="/contracts"
          className={`rounded-2xl border p-5 hover:border-red-200 transition ${
            pendingPayments > 0
              ? "bg-red-50 border-red-200"
              : "bg-white border-gray-200"
          }`}
        >
          <p className="text-xs text-gray-500 uppercase tracking-wide">Pagos atrasados</p>
          <p className={`text-3xl font-bold mt-1 ${pendingPayments > 0 ? "text-red-600" : "text-gray-900"}`}>
            {pendingPayments}
          </p>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pagos atrasados */}
        {lateTenants.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900">Pagos pendientes</h2>
              <Link href="/contracts" className="text-xs text-blue-600 hover:text-blue-800">
                Ver todos →
              </Link>
            </div>
            <div className="space-y-3">
              {lateTenants.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-gray-800">{p.contract.tenant.name}</p>
                    <p className="text-xs text-gray-400">{p.contract.property.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-red-600">{fmtMoney(p.amount)}</p>
                    <p className="text-xs text-gray-400">
                      Vence: {new Date(p.dueDate).toLocaleDateString("es-UY")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Próximas reservas / Accesos rápidos */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Accesos rápidos</h2>
          <div className="space-y-2">
            <Link
              href="/tenants"
              className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-blue-50 transition text-sm"
            >
              <span className="text-gray-700">Gestionar inquilinos</span>
              <span className="text-gray-400">→</span>
            </Link>
            <Link
              href="/contracts"
              className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-blue-50 transition text-sm"
            >
              <span className="text-gray-700">Ver contratos</span>
              <span className="text-gray-400">→</span>
            </Link>
            <Link
              href="/calendar"
              className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-blue-50 transition text-sm"
            >
              <span className="text-gray-700">Calendario de reservas</span>
              <span className="text-gray-400 flex items-center gap-1">
                {upcomingBookings > 0 && (
                  <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {upcomingBookings}
                  </span>
                )}
                →
              </span>
            </Link>
            <Link
              href="/properties"
              className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-blue-50 transition text-sm"
            >
              <span className="text-gray-700">Propiedades y canales iCal</span>
              <span className="text-gray-400">→</span>
            </Link>
          </div>
        </div>

        {/* Recaudación últimos 6 meses */}
        {monthlyRevenue.some((m) => m.amount > 0) && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Recaudación — últimos 6 meses</h2>
            <div className="flex items-end gap-2 h-28">
              {(() => {
                const max = Math.max(...monthlyRevenue.map((m) => m.amount), 1);
                return monthlyRevenue.map((m) => (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-gray-500">
                      {fmtMoney(m.amount).replace("UYU", "").trim()}
                    </span>
                    <div
                      className="w-full bg-blue-500 rounded-t-md"
                      style={{ height: `${Math.max((m.amount / max) * 80, m.amount > 0 ? 4 : 0)}px` }}
                    />
                    <span className="text-xs text-gray-400 capitalize">{m.month}</span>
                  </div>
                ));
              })()}
            </div>
          </div>
        )}

        {/* Onboarding si no hay propiedades */}
        {properties === 0 && (
          <div className="lg:col-span-2 bg-blue-50 border border-blue-100 rounded-2xl p-6 text-center">
            <p className="text-gray-700 font-medium mb-2">Todavía no tenés propiedades</p>
            <p className="text-gray-500 text-sm mb-4">
              Agregá tu primera propiedad para conectar calendarios y gestionar contratos.
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
    </div>
  );
}
