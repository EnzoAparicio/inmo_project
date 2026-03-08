import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  document: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.orgId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const tenants = await db.tenant.findMany({
    where: { organizationId: session.user.orgId },
    include: { contracts: { where: { status: "ACTIVE" }, select: { id: true, monthlyRent: true } } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(tenants);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.orgId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const tenant = await db.tenant.create({
    data: {
      ...parsed.data,
      email: parsed.data.email || null,
      organizationId: session.user.orgId,
    },
  });

  return NextResponse.json(tenant, { status: 201 });
}
