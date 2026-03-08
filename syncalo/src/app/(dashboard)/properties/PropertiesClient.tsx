"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import type { Channel, Property } from "@prisma/client";

type PropertyWithChannels = Property & {
  channels: Channel[];
  _count: { bookings: number };
};

const PLATFORM_LABEL: Record<string, string> = {
  AIRBNB: "Airbnb",
  BOOKING: "Booking.com",
  DIRECT: "Directo",
};

const PLATFORM_COLOR: Record<string, string> = {
  AIRBNB: "bg-rose-100 text-rose-700",
  BOOKING: "bg-blue-100 text-blue-700",
  DIRECT: "bg-green-100 text-green-700",
};

export default function PropertiesClient({
  properties,
}: {
  properties: PropertyWithChannels[];
}) {
  const router = useRouter();
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [addingProperty, setAddingProperty] = useState(false);
  const [propertyError, setPropertyError] = useState("");

  async function handleAddProperty(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAddingProperty(true);
    setPropertyError("");
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          address: form.get("address") || undefined,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setPropertyError(d.error ?? "Error al agregar propiedad");
      } else {
        setShowAddProperty(false);
        (e.target as HTMLFormElement).reset();
        router.refresh();
      }
    } catch {
      setPropertyError("Error de conexión");
    } finally {
      setAddingProperty(false);
    }
  }

  async function handleDeleteProperty(id: string) {
    if (!confirm("¿Eliminar esta propiedad y todos sus datos?")) return;
    await fetch(`/api/properties/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {/* Botón agregar propiedad */}
      <div>
        {!showAddProperty ? (
          <button
            onClick={() => setShowAddProperty(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            + Agregar propiedad
          </button>
        ) : (
          <form
            onSubmit={handleAddProperty}
            className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3 max-w-lg"
          >
            <h3 className="font-semibold text-gray-800">Nueva propiedad</h3>
            <input
              name="name"
              required
              placeholder="Nombre (ej: Apartamento Pocitos)"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              name="address"
              placeholder="Dirección (opcional)"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {propertyError && (
              <p className="text-red-500 text-sm">{propertyError}</p>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={addingProperty}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {addingProperty ? "Guardando..." : "Guardar"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddProperty(false);
                  setPropertyError("");
                }}
                className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Lista de propiedades */}
      {properties.length === 0 && !showAddProperty && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-8 text-center">
          <p className="text-gray-700 font-medium mb-1">
            No tenés propiedades todavía
          </p>
          <p className="text-gray-500 text-sm">
            Agregá tu primera propiedad para conectar tus calendarios.
          </p>
        </div>
      )}

      {properties.map((property) => (
        <PropertyCard
          key={property.id}
          property={property}
          onDelete={() => handleDeleteProperty(property.id)}
          onRefresh={() => router.refresh()}
        />
      ))}
    </div>
  );
}

function PropertyCard({
  property,
  onDelete,
  onRefresh,
}: {
  property: PropertyWithChannels;
  onDelete: () => void;
  onRefresh: () => void;
}) {
  const [showAddChannel, setShowAddChannel] = useState(false);
  const [addingChannel, setAddingChannel] = useState(false);
  const [channelError, setChannelError] = useState("");
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [syncResults, setSyncResults] = useState<Record<string, number>>({});

  async function handleAddChannel(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAddingChannel(true);
    setChannelError("");
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch(`/api/properties/${property.id}/channels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: form.get("platform"),
          icalUrl: form.get("icalUrl"),
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setChannelError(d.error ?? "Error al conectar canal");
      } else {
        setShowAddChannel(false);
        (e.target as HTMLFormElement).reset();
        onRefresh();
      }
    } catch {
      setChannelError("Error de conexión");
    } finally {
      setAddingChannel(false);
    }
  }

  async function handleDeleteChannel(channelId: string) {
    if (!confirm("¿Desconectar este canal?")) return;
    await fetch(`/api/properties/${property.id}/channels/${channelId}`, {
      method: "DELETE",
    });
    onRefresh();
  }

  async function handleSync(channelId: string) {
    setSyncingId(channelId);
    try {
      const res = await fetch(
        `/api/properties/${property.id}/channels/${channelId}`,
        { method: "POST" }
      );
      if (res.ok) {
        const data = await res.json();
        setSyncResults((prev) => ({ ...prev, [channelId]: data.synced }));
        onRefresh();
      }
    } finally {
      setSyncingId(null);
    }
  }

  const usedPlatforms = property.channels.map((c) => c.platform);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-gray-900 text-lg">
              {property.name}
            </h2>
            <Link
              href={`/properties/${property.id}`}
              className="text-xs text-blue-600 hover:text-blue-800 transition"
            >
              Ver detalle →
            </Link>
          </div>
          {property.address && (
            <p className="text-gray-500 text-sm mt-0.5">{property.address}</p>
          )}
          <p className="text-gray-400 text-xs mt-1">
            {property._count.bookings} reserva
            {property._count.bookings !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={onDelete}
          className="text-xs text-red-400 hover:text-red-600 transition"
        >
          Eliminar
        </button>
      </div>

      {/* Canales conectados */}
      <div className="space-y-2 mb-4">
        {property.channels.length === 0 && (
          <p className="text-sm text-gray-400">
            Sin canales conectados. Conectá un iCal de Airbnb o Booking.
          </p>
        )}
        {property.channels.map((channel) => (
          <div
            key={channel.id}
            className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${PLATFORM_COLOR[channel.platform]}`}
              >
                {PLATFORM_LABEL[channel.platform]}
              </span>
              <span className="text-xs text-gray-400 truncate max-w-[180px]">
                {channel.icalUrl}
              </span>
            </div>
            <div className="flex items-center gap-3 ml-2 shrink-0">
              {channel.lastSyncAt && (
                <span className="text-xs text-gray-400 hidden sm:block">
                  {format(new Date(channel.lastSyncAt), "d MMM HH:mm", {
                    locale: es,
                  })}
                </span>
              )}
              {syncResults[channel.id] !== undefined && (
                <span className="text-xs text-green-600">
                  {syncResults[channel.id]} reservas
                </span>
              )}
              <button
                onClick={() => handleSync(channel.id)}
                disabled={syncingId === channel.id}
                className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50 transition"
              >
                {syncingId === channel.id ? "Sincronizando..." : "Sincronizar"}
              </button>
              <button
                onClick={() => handleDeleteChannel(channel.id)}
                className="text-xs text-red-400 hover:text-red-600 transition"
              >
                Quitar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Agregar canal */}
      {!showAddChannel ? (
        <button
          onClick={() => setShowAddChannel(true)}
          disabled={usedPlatforms.length >= 3}
          className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed transition"
        >
          + Conectar canal iCal
        </button>
      ) : (
        <form onSubmit={handleAddChannel} className="space-y-2 mt-2">
          <div className="flex gap-2">
            <select
              name="platform"
              required
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {!usedPlatforms.includes("AIRBNB") && (
                <option value="AIRBNB">Airbnb</option>
              )}
              {!usedPlatforms.includes("BOOKING") && (
                <option value="BOOKING">Booking.com</option>
              )}
              {!usedPlatforms.includes("DIRECT") && (
                <option value="DIRECT">Directo</option>
              )}
            </select>
            <input
              name="icalUrl"
              required
              type="url"
              placeholder="URL del calendario iCal"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {channelError && (
            <p className="text-red-500 text-sm">{channelError}</p>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={addingChannel}
              className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {addingChannel ? "Conectando..." : "Conectar"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddChannel(false);
                setChannelError("");
              }}
              className="px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
