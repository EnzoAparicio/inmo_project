import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

async function authorize(orgId: string, id: string) {
  const contract = await db.contract.findUnique({ where: { id } });
  return contract?.organizationId === orgId ? contract : null;
}

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.orgId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await params;
  const contract = await db.contract.findUnique({
    where: { id },
    include: {
      property: { select: { id: true, name: true, address: true } },
      tenant: true,
      payments: { orderBy: { dueDate: "asc" } },
    },
  });

  if (!contract || contract.organizationId !== session.user.orgId)
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  return NextResponse.json(contract);
}

const updateSchema = z.object({
  status: z.enum(["ACTIVE", "ENDED", "CANCELLED"]).optional(),
  endDate: z.string().optional(),
  monthlyRent: z.number().positive().optional(),
  notes: z.string().optional(),
});

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.orgId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await params;
  if (!await authorize(session.user.orgId, id)) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const { endDate, ...rest } = parsed.data;
  const contract = await db.contract.update({
    where: { id },
    data: { ...rest, ...(endDate ? { endDate: new Date(endDate) } : {}) },
  });

  return NextResponse.json(contract);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.orgId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await params;
  if (!await authorize(session.user.orgId, id)) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  await db.contract.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
