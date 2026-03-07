import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.orgId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { id } = await params;

  const property = await db.property.findUnique({ where: { id } });
  if (!property || property.organizationId !== session.user.orgId) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  await db.property.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
