import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

const schema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  document: z.string().optional(),
  notes: z.string().optional(),
});

async function authorize(orgId: string, id: string) {
  const tenant = await db.tenant.findUnique({ where: { id } });
  return tenant?.organizationId === orgId ? tenant : null;
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.orgId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await params;
  if (!await authorize(session.user.orgId, id)) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const tenant = await db.tenant.update({ where: { id }, data: parsed.data });
  return NextResponse.json(tenant);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.orgId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await params;
  if (!await authorize(session.user.orgId, id)) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  await db.tenant.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
