"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

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
  property: { id: string; name: string };
  tenant: { id: string; name: string };
  payments: Payment[];
};

type SelectOption = { id: string; name: string };

type Props = {
  contracts: Contract[];
  properties: SelectOption[];
  tenants: SelectOption[];
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Activo",
  ENDED: "Finalizado",
  CANCELLED: "Cancelado",
};

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  ENDED: "bg-gray-100 text-gray-600",
  CANCELLED: "bg-red-100 text-red-600",
};

const PAY_STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendiente",
  PAID: "Pagado",
  LATE: "Atrasado",
  WAIVED: "Perdonado",
};

const PAY_STATUS_COLOR: Record<string, string> = {
  PENDING: "text-yellow-600",
  PAID: "text-green-600",
  LATE: "text-red-600",
  WAIVED: "text-gray-400",
};

const emptyForm = {
  propertyId: "",
  tenantId: "",
  startDate: "",
  endDate: "",
  monthlyRent: "",
  deposit: "",
  notes: "",
};

export default function ContractsClient({ contracts: initial, properties, tenants }: Props) {
  const [contracts, setContracts] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<Contract | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [markingPaid, setMarkingPaid] = useState<string | null>(null);
  const [reminding, setReminding] = useState(false);
  const [editingRent, setEditingRent] = useState(false);
  const [newRent, setNewRent] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ACTIVE");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return contracts.filter((c) => {
      const matchStatus = statusFilter === "ALL" || c.status === statusFilter;
      const matchSearch =
        !q ||
        c.tenant.name.toLowerCase().includes(q) ||
        c.property.name.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [contracts, search, statusFilter]);

  function openCreate() {
    setForm(emptyForm);
    setError("");
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const body = {
        propertyId: form.propertyId,
        tenantId: form.tenantId,
        startDate: form.startDate,
        endDate: form.endDate || undefined,
        monthlyRent: parseFloat(form.monthlyRent),
        deposit: form.deposit ? parseFloat(form.deposit) : undefined,
        notes: form.notes || undefined,
      };
      const res = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Error al crear contrato");
      // Reload page to get fresh data with relations
      window.location.reload();
    } catch {
      setError("Ocurrió un error. Intenta nuevamente.");
      setSaving(false);
    }
  }

  async function handleStatusChange(id: string, status: string) {
    try {
      const res = await fetch(`/api/contracts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setContracts((prev) => prev.map((c) => (c.id === id ? { ...c, status: updated.status } : c)));
      if (selected?.id === id) setSelected((s) => s ? { ...s, status: updated.status } : s);
    } catch {
      alert("Error al actualizar estado");
    }
  }

  async function handleMarkPaid(contractId: string, paymentId: string) {
    setMarkingPaid(paymentId);
    try {
      const res = await fetch(`/api/contracts/${contractId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId }),
      });
      if (!res.ok) throw new Error();
      window.location.reload();
    } catch {
      alert("Error al marcar pago");
      setMarkingPaid(null);
    }
  }

  async function handleRentUpdate(id: string) {
    const amount = parseFloat(newRent);
    if (!amount || amount <= 0) return;
    try {
      const res = await fetch(`/api/contracts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthlyRent: amount }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setContracts((prev) =>
        prev.map((c) => (c.id === id ? { ...c, monthlyRent: updated.monthlyRent } : c))
      );
      if (selected?.id === id) setSelected((s) => s ? { ...s, monthlyRent: updated.monthlyRent } : s);
      setEditingRent(false);
      setNewRent("");
    } catch {
      alert("Error al actualizar renta");
    }
  }

  async function handleRemind(id: string) {
    setReminding(true);
    try {
      const res = await fetch(`/api/contracts/${id}/remind`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) alert(data.error ?? "Error al enviar recordatorio");
      else alert("Recordatorio enviado al inquilino");
    } catch {
      alert("Error al enviar");
    } finally {
      setReminding(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este contrato y todos sus pagos?")) return;
    try {
      await fetch(`/api/contracts/${id}`, { method: "DELETE" });
      setContracts((prev) => prev.filter((c) => c.id !== id));
      if (selected?.id === id) setSelected(null);
    } catch {
      alert("Error al eliminar");
    }
  }

  const fmtDate = (d: string | null) =>
    d ? format(new Date(d), "dd MMM yyyy", { locale: es }) : "—";

  const fmtMoney = (n: number) =>
    new Intl.NumberFormat("es-UY", { style: "currency", currency: "UYU", minimumFractionDigits: 0 }).format(n);

  return (
    <div className="flex gap-6 h-full">
      {/* Lista */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Contratos</h1>
            <p className="text-sm text-gray-500 mt-1">{contracts.length} contratos</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar inquilino o propiedad..."
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-52"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ACTIVE">Activos</option>
              <option value="ENDED">Finalizados</option>
              <option value="CANCELLED">Cancelados</option>
              <option value="ALL">Todos</option>
            </select>
            <a
              href="/api/payments/export"
              className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
            >
              Exportar CSV
            </a>
            <button
              onClick={openCreate}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
            >
              + Nuevo contrato
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg font-medium">Sin contratos aún</p>
            <p className="text-sm mt-1">Crea tu primer contrato para empezar</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((c) => {
              const lastPayment = c.payments[0];
              return (
                <div
                  key={c.id}
                  onClick={() => setSelected(c)}
                  className={`bg-white rounded-xl border p-4 cursor-pointer hover:border-blue-300 transition ${
                    selected?.id === c.id ? "border-blue-500 ring-1 ring-blue-200" : "border-gray-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[c.status]}`}
                        >
                          {STATUS_LABEL[c.status]}
                        </span>
                      </div>
                      <p className="font-medium text-gray-900 truncate">{c.tenant.name}</p>
                      <p className="text-sm text-gray-500 truncate">{c.property.name}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-gray-900">{fmtMoney(c.monthlyRent)}/mes</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {fmtDate(c.startDate)} →{" "}
                        {c.endDate ? fmtDate(c.endDate) : "indefinido"}
                      </p>
                      {lastPayment && (
                        <p className={`text-xs mt-0.5 ${PAY_STATUS_COLOR[lastPayment.status]}`}>
                          Cuota: {PAY_STATUS_LABEL[lastPayment.status]}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detalle */}
      {selected && (
        <div className="w-80 shrink-0 bg-white rounded-xl border border-gray-200 p-5 self-start sticky top-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Detalle</h2>
            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">
              ×
            </button>
          </div>

          <div className="space-y-2 text-sm mb-4">
            <div className="flex justify-between">
              <span className="text-gray-500">Inquilino</span>
              <span className="font-medium">{selected.tenant.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Propiedad</span>
              <span className="font-medium truncate ml-2 text-right">{selected.property.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Renta</span>
              <div className="flex items-center gap-2">
                {editingRent ? (
                  <>
                    <input
                      type="number"
                      value={newRent}
                      onChange={(e) => setNewRent(e.target.value)}
                      placeholder={String(selected.monthlyRent)}
                      className="w-24 border border-gray-300 rounded px-2 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      autoFocus
                    />
                    <button onClick={() => handleRentUpdate(selected.id)} className="text-xs text-blue-600 font-medium">OK</button>
                    <button onClick={() => { setEditingRent(false); setNewRent(""); }} className="text-xs text-gray-400">✕</button>
                  </>
                ) : (
                  <>
                    <span className="font-medium">{fmtMoney(selected.monthlyRent)}/mes</span>
                    {selected.status === "ACTIVE" && (
                      <button onClick={() => { setEditingRent(true); setNewRent(String(selected.monthlyRent)); }} className="text-xs text-gray-400 hover:text-blue-600 transition">
                        ✏
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
            {selected.deposit && (
              <div className="flex justify-between">
                <span className="text-gray-500">Depósito</span>
                <span className="font-medium">{fmtMoney(selected.deposit)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Inicio</span>
              <span>{fmtDate(selected.startDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Fin</span>
              <span>{selected.endDate ? fmtDate(selected.endDate) : "Indefinido"}</span>
            </div>
            {selected.notes && (
              <div className="pt-1 text-gray-500 text-xs">{selected.notes}</div>
            )}
          </div>

          {/* Cambiar estado */}
          {selected.status === "ACTIVE" && (
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => handleStatusChange(selected.id, "ENDED")}
                className="flex-1 text-xs border border-gray-300 text-gray-600 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition"
              >
                Finalizar
              </button>
              <button
                onClick={() => handleStatusChange(selected.id, "CANCELLED")}
                className="flex-1 text-xs border border-red-200 text-red-500 px-2 py-1.5 rounded-lg hover:bg-red-50 transition"
              >
                Cancelar
              </button>
            </div>
          )}

          {/* Pagos */}
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Pagos</h3>
          <ContractPayments contractId={selected.id} onMarkPaid={handleMarkPaid} markingPaid={markingPaid} />

          {selected.status === "ACTIVE" && (
            <button
              onClick={() => handleRemind(selected.id)}
              disabled={reminding}
              className="mt-3 w-full text-xs border border-blue-200 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition disabled:opacity-50"
            >
              {reminding ? "Enviando..." : "Enviar recordatorio de pago"}
            </button>
          )}
          <button
            onClick={() => handleDelete(selected.id)}
            className="mt-2 w-full text-xs text-red-500 hover:text-red-700 transition"
          >
            Eliminar contrato
          </button>
        </div>
      )}

      {/* Modal nuevo contrato */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Nuevo contrato</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Propiedad *</label>
                  <select
                    value={form.propertyId}
                    onChange={(e) => setForm({ ...form, propertyId: e.target.value })}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar...</option>
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Inquilino *</label>
                  <select
                    value={form.tenantId}
                    onChange={(e) => setForm({ ...form, tenantId: e.target.value })}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar...</option>
                    {tenants.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Inicio *</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fin (opcional)</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Renta mensual *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.monthlyRent}
                    onChange={(e) => setForm({ ...form, monthlyRent: e.target.value })}
                    required
                    placeholder="0"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Depósito</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.deposit}
                    onChange={(e) => setForm({ ...form, deposit: e.target.value })}
                    placeholder="0"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {saving ? "Creando..." : "Crear contrato"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ContractPayments({
  contractId,
  onMarkPaid,
  markingPaid,
}: {
  contractId: string;
  onMarkPaid: (contractId: string, paymentId: string) => void;
  markingPaid: string | null;
}) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/contracts/${contractId}`);
      const data = await res.json();
      setPayments(data.payments ?? []);
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }

  if (!loaded) {
    return (
      <button
        onClick={load}
        disabled={loading}
        className="text-xs text-blue-600 hover:text-blue-800 underline"
      >
        {loading ? "Cargando..." : "Ver pagos"}
      </button>
    );
  }

  const fmtDate = (d: string) => format(new Date(d), "MMM yyyy", { locale: es });
  const fmtMoney = (n: number) =>
    new Intl.NumberFormat("es-UY", { style: "currency", currency: "UYU", minimumFractionDigits: 0 }).format(n);

  return (
    <div className="space-y-1.5 max-h-48 overflow-y-auto">
      {payments.length === 0 ? (
        <p className="text-xs text-gray-400">Sin pagos registrados</p>
      ) : (
        payments.map((p) => (
          <div key={p.id} className="flex items-center justify-between text-xs">
            <span className="text-gray-600">{fmtDate(p.dueDate)} — {fmtMoney(p.amount)}</span>
            {p.status === "PENDING" || p.status === "LATE" ? (
              <button
                onClick={() => onMarkPaid(contractId, p.id)}
                disabled={markingPaid === p.id}
                className="text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
              >
                {markingPaid === p.id ? "..." : "Cobrar"}
              </button>
            ) : (
              <span className={PAY_STATUS_COLOR[p.status]}>{PAY_STATUS_LABEL[p.status]}</span>
            )}
          </div>
        ))
      )}
    </div>
  );
}
