import type { Metadata } from "next";
import { auth } from "@/lib/auth";

export const metadata: Metadata = { title: "Billing" };
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { PLANS } from "@/lib/stripe";
import BillingClient from "./BillingClient";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user?.id || !session?.user?.orgId) redirect("/login");

  const subscription = await db.subscription.findUnique({
    where: { organizationId: session.user.orgId },
  });

  if (!subscription) redirect("/dashboard");

  const trialDaysLeft = subscription.trialEndsAt
    ? Math.max(
        0,
        Math.ceil(
          (subscription.trialEndsAt.getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : null;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Billing</h1>
      <p className="text-gray-500 text-sm mb-8">
        Gestioná tu plan y suscripción
      </p>

      {/* Estado actual */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 max-w-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">Plan actual</p>
            <p className="text-2xl font-bold text-gray-900">
              {PLANS[subscription.plan].name}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {subscription.status === "TRIAL" &&
                trialDaysLeft !== null &&
                `Trial · ${trialDaysLeft} días restantes`}
              {subscription.status === "ACTIVE" &&
                subscription.currentPeriodEnd &&
                `Activo · Renueva el ${format(subscription.currentPeriodEnd, "d MMM yyyy", { locale: es })}`}
              {subscription.status === "CANCELLED" && "Cancelado"}
              {subscription.status === "PAST_DUE" && "Pago vencido"}
            </p>
          </div>
          <span
            className={`text-xs font-semibold px-3 py-1 rounded-full ${
              subscription.status === "ACTIVE"
                ? "bg-green-100 text-green-700"
                : subscription.status === "TRIAL"
                  ? "bg-blue-100 text-blue-700"
                  : subscription.status === "PAST_DUE"
                    ? "bg-red-100 text-red-700"
                    : "bg-gray-100 text-gray-600"
            }`}
          >
            {subscription.status === "ACTIVE"
              ? "Activo"
              : subscription.status === "TRIAL"
                ? "Trial"
                : subscription.status === "PAST_DUE"
                  ? "Pago vencido"
                  : "Cancelado"}
          </span>
        </div>
      </div>

      <BillingClient
        currentPlan={subscription.plan}
        hasStripeCustomer={!!subscription.stripeCustomerId}
        isAdmin={session.user.role === "ADMIN"}
      />
    </div>
  );
}
