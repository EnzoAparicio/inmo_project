import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.orgId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const bookings = await db.booking.findMany({
    where: { property: { organizationId: session.user.orgId } },
    include: { property: { select: { id: true, name: true } } },
    orderBy: { checkIn: "asc" },
  });

  return NextResponse.json(bookings);
}
