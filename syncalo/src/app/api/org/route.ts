import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.orgId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const org = await db.organization.findUnique({
    where: { id: session.user.orgId },
    include: { subscription: true },
  });

  return NextResponse.json(org);
}

const updateSchema = z.object({
  name: z.string().min(2),
});

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.orgId || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const org = await db.organization.update({
    where: { id: session.user.orgId },
    data: { name: parsed.data.name },
  });

  return NextResponse.json(org);
}
