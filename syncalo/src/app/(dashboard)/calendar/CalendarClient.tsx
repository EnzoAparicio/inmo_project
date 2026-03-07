"use client";

import { useState, useMemo } from "react";
import { format, isSameMonth, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameDay, isWithinInterval } from "date-fns";
import { es } from "date-fns/locale";
import type { Booking, Platform } from "@prisma/client";

type BookingWithProperty = Booking & {
  property: { id: string; name: string };
};

const PLATFORM_COLOR: Record<Platform, string> = {
  AIRBNB: "bg-rose-500",
  BOOKING: "bg-blue-500",
  DIRECT: "bg-green-500",
};

const PLATFORM_LABEL: Record<Platform, string> = {
  AIRBNB: "Airbnb",
  BOOKING: "Booking.com",
  DIRECT: "Directo",
};

const STATUS_LABEL: Record<string, string> = {
  CONFIRMED: "Confirmada",
  CANCELLED: "Cancelada",
  BLOCKED: "Bloqueada",
};

export default function CalendarClient({
  bookings,
  conflictIds,
}: {
  bookings: BookingWithProperty[];
  conflictIds: string[];
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [selectedBooking, setSelectedBooking] = useState<BookingWithProperty | null>(null);
  const [filterProperty, setFilterProperty] = useState<string>("all");

  const properties = useMemo(() => {
    const map = new Map<string, string>();
    bookings.forEach((b) => map.set(b.property.id, b.property.name));
    return [...map.entries()];
  }, [bookings]);

  const filteredBookings = useMemo(
    () =>
      filterProperty === "all"
        ? bookings
        : bookings.filter((b) => b.property.id === filterProperty),
    [bookings, filterProperty]
  );

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  function bookingsForDay(day: Date) {
    return filteredBookings.filter((b) =>
      isWithinInterval(day, {
        start: new Date(b.checkIn),
        end: new Date(b.checkOut),
      })
    );
  }

  function prevMonth() {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }

  function nextMonth() {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  const upcomingBookings = filteredBookings.filter(
    (b) => new Date(b.checkIn) >= new Date()
  );

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Filtro por propiedad */}
        {properties.length > 1 && (
          <select
            value={filterProperty}
            onChange={(e) => setFilterProperty(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todas las propiedades</option>
            {properties.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        )}

        {/* Toggle vista */}
        <div className="flex rounded-lg border border-gray-300 overflow-hidden ml-auto">
          <button
            onClick={() => setView("calendar")}
            className={`px-3 py-1.5 text-sm transition ${view === "calendar" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}
          >
            Calendario
          </button>
          <button
            onClick={() => setView("list")}
            className={`px-3 py-1.5 text-sm transition ${view === "list" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}
          >
            Lista
          </button>
        </div>
      </div>

      {view === "calendar" ? (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          {/* Navegación mes */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <button
              onClick={prevMonth}
              className="p-1 hover:bg-gray-100 rounded-lg transition text-gray-600"
            >
              ‹
            </button>
            <h2 className="font-semibold text-gray-900 capitalize">
              {format(currentDate, "MMMM yyyy", { locale: es })}
            </h2>
            <button
              onClick={nextMonth}
              className="p-1 hover:bg-gray-100 rounded-lg transition text-gray-600"
            >
              ›
            </button>
          </div>

          {/* Días de la semana */}
          <div className="grid grid-cols-7 border-b border-gray-100">
            {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
              <div
                key={d}
                className="text-center text-xs font-medium text-gray-400 py-2"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Grilla días */}
          <div className="grid grid-cols-7">
            {days.map((day, i) => {
              const dayBookings = bookingsForDay(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={i}
                  className={`min-h-[80px] p-1.5 border-b border-r border-gray-100 ${!isCurrentMonth ? "bg-gray-50" : ""}`}
                >
                  <span
                    className={`text-xs font-medium inline-flex items-center justify-center w-6 h-6 rounded-full mb-1 ${
                      isToday
                        ? "bg-blue-600 text-white"
                        : isCurrentMonth
                          ? "text-gray-700"
                          : "text-gray-300"
                    }`}
                  >
                    {format(day, "d")}
                  </span>
                  <div className="space-y-0.5">
                    {dayBookings.slice(0, 3).map((b) => (
                      <button
                        key={b.id}
                        onClick={() => setSelectedBooking(b)}
                        className={`w-full text-left text-xs text-white px-1.5 py-0.5 rounded truncate ${PLATFORM_COLOR[b.platform]} ${
                          conflictIds.includes(b.id)
                            ? "ring-2 ring-red-500 ring-offset-1"
                            : ""
                        }`}
                      >
                        {b.guestName ?? b.property.name}
                      </button>
                    ))}
                    {dayBookings.length > 3 && (
                      <p className="text-xs text-gray-400 pl-1">
                        +{dayBookings.length - 3} más
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Leyenda */}
          <div className="flex gap-4 px-5 py-3 border-t border-gray-100">
            {Object.entries(PLATFORM_LABEL).map(([p, label]) => (
              <div key={p} className="flex items-center gap-1.5">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${PLATFORM_COLOR[p as Platform]}`}
                />
                <span className="text-xs text-gray-500">{label}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5 ml-auto">
              <div className="w-2.5 h-2.5 rounded-full bg-gray-200 ring-2 ring-red-500" />
              <span className="text-xs text-gray-500">Conflicto</span>
            </div>
          </div>
        </div>
      ) : (
        /* Vista lista */
        <div className="space-y-2">
          {upcomingBookings.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
              <p className="text-gray-500 text-sm">No hay reservas próximas</p>
            </div>
          ) : (
            upcomingBookings.map((b) => (
              <button
                key={b.id}
                onClick={() => setSelectedBooking(b)}
                className={`w-full text-left bg-white border rounded-xl px-4 py-3 hover:border-blue-300 transition ${
                  conflictIds.includes(b.id)
                    ? "border-red-300 bg-red-50"
                    : "border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${PLATFORM_COLOR[b.platform]}`}
                    />
                    <span className="font-medium text-sm text-gray-900">
                      {b.guestName ?? "Sin nombre"}
                    </span>
                    {conflictIds.includes(b.id) && (
                      <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                        Conflicto
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">{b.property.name}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1 ml-4">
                  {format(new Date(b.checkIn), "d MMM", { locale: es })} →{" "}
                  {format(new Date(b.checkOut), "d MMM yyyy", { locale: es })}
                </p>
              </button>
            ))
          )}
        </div>
      )}

      {/* Modal detalle reserva */}
      {selectedBooking && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedBooking(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <span
                className={`text-xs font-medium text-white px-2.5 py-1 rounded-full ${PLATFORM_COLOR[selectedBooking.platform]}`}
              >
                {PLATFORM_LABEL[selectedBooking.platform]}
              </span>
              <button
                onClick={() => setSelectedBooking(null)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                ✕
              </button>
            </div>

            <h3 className="font-bold text-gray-900 text-lg mb-1">
              {selectedBooking.guestName ?? "Sin nombre"}
            </h3>
            <p className="text-gray-500 text-sm mb-4">
              {selectedBooking.property.name}
            </p>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Check-in</span>
                <span className="font-medium">
                  {format(new Date(selectedBooking.checkIn), "d MMM yyyy", {
                    locale: es,
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Check-out</span>
                <span className="font-medium">
                  {format(new Date(selectedBooking.checkOut), "d MMM yyyy", {
                    locale: es,
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Estado</span>
                <span className="font-medium">
                  {STATUS_LABEL[selectedBooking.status]}
                </span>
              </div>
              {selectedBooking.summary && (
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-gray-500 mb-1">Descripción</p>
                  <p className="text-gray-700">{selectedBooking.summary}</p>
                </div>
              )}
              {conflictIds.includes(selectedBooking.id) && (
                <div className="pt-2 border-t border-red-100 bg-red-50 rounded-lg p-2">
                  <p className="text-red-600 text-xs font-medium">
                    Esta reserva tiene un conflicto de fechas con otra reserva en la misma propiedad.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
