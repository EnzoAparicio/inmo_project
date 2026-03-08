"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type Channel = {
  id: string;
  platform: string;
  icalUrl: string;
  lastSyncAt: Date | null;
};

type Payment = {
  id: string;
  amount: number;
  dueDate: string;
  paidAt: string | null;
  status: string;
};

type Contract = {
  id: string;
  status: string;
  monthlyRent: number;
  deposit: number | null;
  startDate: string;
  endDate: string | null;
  notes: string | null;
  tenant: { id: string; name: string; email: string | null; phone: string | null };
  payments: Payment[];
};

type Property = {
  id: string;
  name: string;
  address: string | null;
  channels: Channel[];
  contracts: Contract[];
};

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  ENDED: "bg-gray-100 text-gray-600",
  CANCELLED: "bg-red-100 text-red-600",
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Activo",
  ENDED: "Finalizado",
  CANCELLED: "Cancelado",
};

const PAY_STATUS_COLOR: Record<string, string> = {
  PENDING: "text-yellow-600",
  PAID: "text-green-600",
  LATE: "text-red-600",
  WAIVED: "text-gray-400",
};

const PAY_STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendiente",
  PAID: "Pagado",
  LATE: "Atrasado",
  WAIVED: "Perdonado",
};

export default function PropertyDetailClient({ property }: { property: Property }) {
  const [markingPaid, setMarkingPaid] = useState<string | null>(null);
  const [contracts, setContracts] = useState(property.contracts);

  const activeContract = contracts.find((c) => c.status === "ACTIVE");

  const fmtDate = (d: string | null | Date) =>
    d ? format(new Date(d as string), "dd MMM yyyy", { locale: es }) : "—";

  const fmtMoney = (n: number) =>
    new Intl.NumberFormat("es-UY", { style: "currency", currency: "UYU", minimumFractionDigits: 0 }).format(n);

  async function handleMarkPaid(contractId: string, paymentId: string) {
    setMarkingPaid(paymentId);
    try {
      const res = await fetch(`/api/contracts/${contractId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId }),
      });
      if (!res.ok) throw new Error();
      // Reload to get updated payments list
      window.location.reload();
    } catch {
      alert("Error al marcar pago");
      setMarkingPaid(null);
    }
  }

  async function handleContractStatus(contractId: string, status: string) {
    try {
      const res = await fetch(`/api/contracts/${contractId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setContracts((prev) =>
        prev.map((c) => (c.id === contractId ? { ...c, status: updated.status } : c))
      );
    } catch {
      alert("Error al actualizar contrato");
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{property.name}</h1>
        {property.address && <p className="text-gray-500 text-sm mt-1">{property.address}</p>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contrato activo */}
        <div className="lg:col-span-2 space-y-6">
          {activeContract ? (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Contrato activo</h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  Activo
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">Inquilino</p>
                  <p className="font-medium text-gray-900">{activeContract.tenant.name}</p>
                  {activeContract.tenant.email && (
                    <p className="text-gray-400 text-xs">{activeContract.tenant.email}</p>
                  )}
                  {activeContract.tenant.phone && (
                    <p className="text-gray-400 text-xs">{activeContract.tenant.phone}</p>
                  )}
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">Renta mensual</p>
                  <p className="font-semibold text-gray-900 text-lg">{fmtMoney(activeContract.monthlyRent)}</p>
                  {activeContract.deposit && (
                    <p className="text-gray-400 text-xs">Depósito: {fmtMoney(activeContract.deposit)}</p>
                  )}
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">Inicio</p>
                  <p>{fmtDate(activeContract.startDate)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">Fin</p>
                  <p>{activeContract.endDate ? fmtDate(activeContract.endDate) : "Indefinido"}</p>
                </div>
              </div>

              {activeContract.notes && (
                <p className="text-xs text-gray-400 mb-4 border-t border-gray-100 pt-3">
                  {activeContract.notes}
                </p>
              )}

              {/* Pagos */}
              <div className="border-t border-gray-100 pt-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Últimos pagos
                </h3>
                <div className="space-y-2">
                  {activeContract.payments.length === 0 ? (
                    <p className="text-xs text-gray-400">Sin pagos registrados</p>
                  ) : (
                    activeContract.payments.map((p) => (
                      <div key={p.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                          {format(new Date(p.dueDate), "MMMM yyyy", { locale: es })} — {fmtMoney(p.amount)}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs ${PAY_STATUS_COLOR[p.status]}`}>
                            {PAY_STATUS_LABEL[p.status]}
                          </span>
                          {(p.status === "PENDING" || p.status === "LATE") && (
                            <button
                              onClick={() => handleMarkPaid(activeContract.id, p.id)}
                              disabled={markingPaid === p.id}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
                            >
                              {markingPaid === p.id ? "..." : "Cobrar"}
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleContractStatus(activeContract.id, "ENDED")}
                  className="text-xs border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition"
                >
                  Finalizar contrato
                </button>
                <button
                  onClick={() => handleContractStatus(activeContract.id, "CANCELLED")}
                  className="text-xs border border-red-200 text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50 transition"
                >
                  Cancelar contrato
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 p-8 text-center">
              <p className="text-gray-500 font-medium">Sin contrato activo</p>
              <p className="text-gray-400 text-sm mt-1">
                Ve a{" "}
                <a href="/contracts" className="text-blue-600 hover:underline">
                  Contratos
                </a>{" "}
                para asignar un inquilino
              </p>
            </div>
          )}

          {/* Historial contratos */}
          {contracts.filter((c) => c.status !== "ACTIVE").length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-3">Historial de contratos</h2>
              <div className="space-y-2">
                {contracts
                  .filter((c) => c.status !== "ACTIVE")
                  .map((c) => (
                    <div key={c.id} className="flex items-center justify-between text-sm py-2 border-b border-gray-50 last:border-0">
                      <div>
                        <span className="font-medium text-gray-800">{c.tenant.name}</span>
                        <span className="text-gray-400 text-xs ml-2">
                          {fmtDate(c.startDate)} → {fmtDate(c.endDate)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">{fmtMoney(c.monthlyRent)}/mes</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLOR[c.status]}`}>
                          {STATUS_LABEL[c.status]}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Canales iCal */}
        <div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Canales de calendario</h2>
            {property.channels.length === 0 ? (
              <p className="text-sm text-gray-400">Sin canales conectados</p>
            ) : (
              <div className="space-y-3">
                {property.channels.map((ch) => (
                  <div key={ch.id} className="text-sm">
                    <p className="font-medium text-gray-800">{ch.platform}</p>
                    <p className="text-xs text-gray-400 truncate">{ch.icalUrl}</p>
                    {ch.lastSyncAt && (
                      <p className="text-xs text-gray-300 mt-0.5">
                        Sync: {format(new Date(ch.lastSyncAt), "dd/MM HH:mm")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
            <a
              href="/properties"
              className="mt-4 block text-xs text-blue-600 hover:text-blue-800 transition"
            >
              Gestionar canales →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
