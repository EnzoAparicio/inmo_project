import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { detectConflicts } from "@/lib/conflicts";
import CalendarClient from "./CalendarClient";

export default async function CalendarPage() {
  const session = await auth();
  if (!session?.user?.id || !session?.user?.orgId) redirect("/login");

  const bookings = await db.booking.findMany({
    where: { property: { organizationId: session.user.orgId } },
    include: { property: { select: { id: true, name: true } } },
    orderBy: { checkIn: "asc" },
  });

  const conflicts = detectConflicts(
    bookings.map((b) => ({
      id: b.id,
      checkIn: b.checkIn,
      checkOut: b.checkOut,
      platform: b.platform,
    }))
  );

  const conflictIds = new Set(conflicts.flatMap((c) => [c.a, c.b]));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendario</h1>
          <p className="text-gray-500 text-sm mt-1">
            Todas tus reservas en un solo lugar
          </p>
        </div>
        {conflicts.length > 0 && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-medium px-4 py-2 rounded-xl">
            {conflicts.length} conflicto{conflicts.length !== 1 ? "s" : ""}{" "}
            detectado{conflicts.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>
      <CalendarClient bookings={bookings} conflictIds={[...conflictIds]} />
    </div>
  );
}
