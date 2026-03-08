import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { addMonths } from "date-fns";

const schema = z.object({
  propertyId: z.string(),
  tenantId: z.string(),
  startDate: z.string(),
  endDate: z.string().optional(),
  monthlyRent: z.number().positive(),
  deposit: z.number().optional(),
  notes: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.orgId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const contracts = await db.contract.findMany({
    where: { organizationId: session.user.orgId },
    include: {
      property: { select: { id: true, name: true } },
      tenant: { select: { id: true, name: true } },
      payments: { orderBy: { dueDate: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(contracts);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.orgId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const { startDate, endDate, ...rest } = parsed.data;

  const contract = await db.contract.create({
    data: {
      ...rest,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      organizationId: session.user.orgId,
    },
  });

  // Generar pagos automáticamente para los próximos 3 meses
  const start = new Date(startDate);
  const paymentsToCreate = [];
  for (let i = 0; i < 3; i++) {
    const dueDate = addMonths(start, i);
    dueDate.setDate(1); // Primer día del mes
    paymentsToCreate.push({ contractId: contract.id, amount: parsed.data.monthlyRent, dueDate });
  }
  await db.payment.createMany({ data: paymentsToCreate });

  return NextResponse.json(contract, { status: 201 });
}
