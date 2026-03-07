"use client";

import { useState } from "react";
import type { Plan } from "@prisma/client";
import { PLANS } from "@/lib/stripe";

const FEATURES: Record<keyof typeof PLANS, string[]> = {
  FREE: ["1 propiedad", "2 canales por propiedad", "Sync manual"],
  STARTER: [
    "Hasta 5 propiedades",
    "3 canales por propiedad",
    "Sync automático cada hora",
    "Alertas de conflictos",
  ],
  PRO: [
    "Propiedades ilimitadas",
    "3 canales por propiedad",
    "Sync automático cada hora",
    "Alertas de conflictos",
    "Soporte prioritario",
  ],
};

export default function BillingClient({
  currentPlan,
  hasStripeCustomer,
  isAdmin,
}: {
  currentPlan: Plan;
  hasStripeCustomer: boolean;
  isAdmin: boolean;
}) {
  const [loading, setLoading] = useState<string | null>(null);

  async function handleUpgrade(plan: "STARTER" | "PRO") {
    setLoading(plan);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setLoading(null);
    }
  }

  async function handlePortal() {
    setLoading("portal");
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Planes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(["FREE", "STARTER", "PRO"] as const).map((plan) => {
          const config = PLANS[plan];
          const isCurrent = currentPlan === plan;
          const isHighlighted = plan === "STARTER";

          return (
            <div
              key={plan}
              className={`rounded-2xl border p-5 ${
                isHighlighted
                  ? "border-blue-500 bg-blue-600 text-white"
                  : "border-gray-200 bg-white"
              } ${isCurrent ? "ring-2 ring-offset-2 ring-blue-400" : ""}`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3
                  className={`font-bold ${isHighlighted ? "text-white" : "text-gray-900"}`}
                >
                  {config.name}
                </h3>
                {isCurrent && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      isHighlighted
                        ? "bg-white/20 text-white"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    Actual
                  </span>
                )}
              </div>

              <div className="mb-4">
                <span
                  className={`text-3xl font-bold ${isHighlighted ? "text-white" : "text-gray-900"}`}
                >
                  ${config.price}
                </span>
                <span
                  className={`text-sm ${isHighlighted ? "text-blue-200" : "text-gray-400"}`}
                >
                  /mes
                </span>
              </div>

              <ul className="space-y-1.5 mb-5">
                {FEATURES[plan].map((f) => (
                  <li
                    key={f}
                    className={`text-xs flex items-start gap-1.5 ${
                      isHighlighted ? "text-blue-50" : "text-gray-600"
                    }`}
                  >
                    <span
                      className={isHighlighted ? "text-blue-200" : "text-blue-500"}
                    >
                      ✓
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              {isAdmin && plan !== "FREE" && !isCurrent && (
                <button
                  onClick={() => handleUpgrade(plan)}
                  disabled={!!loading}
                  className={`w-full py-2 rounded-xl text-sm font-semibold transition disabled:opacity-50 ${
                    isHighlighted
                      ? "bg-white text-blue-600 hover:bg-blue-50"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {loading === plan ? "Redirigiendo..." : `Cambiar a ${config.name}`}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Manage subscription */}
      {isAdmin && hasStripeCustomer && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h3 className="font-medium text-gray-900 mb-1">
            Gestionar suscripción
          </h3>
          <p className="text-sm text-gray-500 mb-3">
            Actualizá tu método de pago, descargá facturas o cancelá tu plan.
          </p>
          <button
            onClick={handlePortal}
            disabled={!!loading}
            className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition"
          >
            {loading === "portal" ? "Redirigiendo..." : "Abrir portal de Stripe"}
          </button>
        </div>
      )}

      {!isAdmin && (
        <p className="text-sm text-gray-400 text-center pt-2">
          Solo el administrador puede gestionar el plan.
        </p>
      )}
    </div>
  );
}
