import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type Params = { params: Promise<{ memberId: string }> };

const updateSchema = z.object({
  role: z.enum(["ADMIN", "AGENT", "VIEWER"]),
});

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.orgId || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  }

  const { memberId } = await params;
  const member = await db.member.findUnique({ where: { id: memberId } });
  if (!member || member.organizationId !== session.user.orgId) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const updated = await db.member.update({
    where: { id: memberId },
    data: { role: parsed.data.role },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.orgId || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  }

  const { memberId } = await params;
  const member = await db.member.findUnique({ where: { id: memberId } });
  if (!member || member.organizationId !== session.user.orgId) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  // No permitir que el único admin se elimine a sí mismo
  if (member.userId === session.user.id) {
    const adminCount = await db.member.count({
      where: { organizationId: session.user.orgId, role: "ADMIN" },
    });
    if (adminCount <= 1) {
      return NextResponse.json(
        { error: "No podés eliminarte si sos el único administrador" },
        { status: 400 }
      );
    }
  }

  await db.member.delete({ where: { id: memberId } });
  return NextResponse.json({ ok: true });
}
