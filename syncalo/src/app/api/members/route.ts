import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.orgId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const members = await db.member.findMany({
    where: { organizationId: session.user.orgId },
    include: { user: { select: { id: true, name: true, email: true, image: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(members);
}

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["ADMIN", "AGENT", "VIEWER"]),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.orgId || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const { email, role } = parsed.data;

  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json(
      { error: "No existe un usuario con ese email. Primero debe registrarse." },
      { status: 404 }
    );
  }

  const existing = await db.member.findUnique({
    where: { userId_organizationId: { userId: user.id, organizationId: session.user.orgId } },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Este usuario ya es miembro de la organización" },
      { status: 409 }
    );
  }

  const member = await db.member.create({
    data: { userId: user.id, organizationId: session.user.orgId, role },
    include: { user: { select: { id: true, name: true, email: true, image: true } } },
  });

  return NextResponse.json(member, { status: 201 });
}
