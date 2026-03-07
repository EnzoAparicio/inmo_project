"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Role } from "@prisma/client";

type Member = {
  id: string;
  role: Role;
  createdAt: Date;
  user: { id: string; name: string | null; email: string; image: string | null };
};

type Org = { id: string; name: string; slug: string };

const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Administrador",
  AGENT: "Agente",
  VIEWER: "Visualizador",
};

const ROLE_COLOR: Record<Role, string> = {
  ADMIN: "bg-purple-100 text-purple-700",
  AGENT: "bg-blue-100 text-blue-700",
  VIEWER: "bg-gray-100 text-gray-600",
};

export default function SettingsClient({
  org,
  members,
  currentUserId,
  currentRole,
}: {
  org: Org;
  members: Member[];
  currentUserId: string;
  currentRole: Role;
}) {
  const router = useRouter();
  const isAdmin = currentRole === "ADMIN";

  // Org name
  const [orgName, setOrgName] = useState(org.name);
  const [savingOrg, setSavingOrg] = useState(false);
  const [orgError, setOrgError] = useState("");

  // Invite
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("AGENT");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");

  async function handleSaveOrg(e: React.FormEvent) {
    e.preventDefault();
    setSavingOrg(true);
    setOrgError("");
    try {
      const res = await fetch("/api/org", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: orgName }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setOrgError(d.error ?? "Error al guardar");
      } else {
        router.refresh();
      }
    } catch {
      setOrgError("Error de conexión");
    } finally {
      setSavingOrg(false);
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    setInviteError("");
    setInviteSuccess("");
    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setInviteError(d.error ?? "Error al agregar miembro");
      } else {
        setInviteSuccess(`${d.user.name ?? d.user.email} fue agregado como ${ROLE_LABEL[inviteRole]}`);
        setInviteEmail("");
        router.refresh();
      }
    } catch {
      setInviteError("Error de conexión");
    } finally {
      setInviting(false);
    }
  }

  async function handleChangeRole(memberId: string, role: Role) {
    await fetch(`/api/members/${memberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    router.refresh();
  }

  async function handleRemove(memberId: string, name: string) {
    if (!confirm(`¿Eliminar a ${name} de la organización?`)) return;
    const res = await fetch(`/api/members/${memberId}`, { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(d.error ?? "Error al eliminar");
    } else {
      router.refresh();
    }
  }

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Organización */}
      <section className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Organización</h2>
        <form onSubmit={handleSaveOrg} className="space-y-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Nombre de la organización
            </label>
            <input
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              disabled={!isAdmin}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Slug</label>
            <input
              value={org.slug}
              disabled
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400"
            />
          </div>
          {orgError && <p className="text-red-500 text-sm">{orgError}</p>}
          {isAdmin && (
            <button
              type="submit"
              disabled={savingOrg || orgName === org.name}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {savingOrg ? "Guardando..." : "Guardar cambios"}
            </button>
          )}
        </form>
      </section>

      {/* Miembros */}
      <section className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="font-semibold text-gray-900 mb-4">
          Miembros del equipo
        </h2>

        <div className="space-y-2 mb-6">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-semibold shrink-0">
                  {(member.user.name ?? member.user.email)[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {member.user.name ?? "Sin nombre"}
                    {member.user.id === currentUserId && (
                      <span className="ml-1 text-xs text-gray-400">(vos)</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400">{member.user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isAdmin && member.user.id !== currentUserId ? (
                  <select
                    value={member.role}
                    onChange={(e) =>
                      handleChangeRole(member.id, e.target.value as Role)
                    }
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ADMIN">Administrador</option>
                    <option value="AGENT">Agente</option>
                    <option value="VIEWER">Visualizador</option>
                  </select>
                ) : (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLOR[member.role]}`}
                  >
                    {ROLE_LABEL[member.role]}
                  </span>
                )}

                {isAdmin && member.user.id !== currentUserId && (
                  <button
                    onClick={() =>
                      handleRemove(member.id, member.user.name ?? member.user.email)
                    }
                    className="text-xs text-red-400 hover:text-red-600 transition ml-1"
                  >
                    Quitar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Agregar miembro */}
        {isAdmin && (
          <form onSubmit={handleInvite} className="space-y-3 pt-4 border-t border-gray-100">
            <h3 className="text-sm font-medium text-gray-700">
              Agregar miembro
            </h3>
            <div className="flex gap-2">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                placeholder="Email del usuario"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as Role)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ADMIN">Administrador</option>
                <option value="AGENT">Agente</option>
                <option value="VIEWER">Visualizador</option>
              </select>
              <button
                type="submit"
                disabled={inviting}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {inviting ? "..." : "Agregar"}
              </button>
            </div>
            {inviteError && (
              <p className="text-red-500 text-sm">{inviteError}</p>
            )}
            {inviteSuccess && (
              <p className="text-green-600 text-sm">{inviteSuccess}</p>
            )}
            <p className="text-xs text-gray-400">
              El usuario debe tener una cuenta en Syncalo para ser agregado.
            </p>
          </form>
        )}
      </section>
    </div>
  );
}
