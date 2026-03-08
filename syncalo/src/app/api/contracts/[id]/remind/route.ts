import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendPaymentReminder } from "@/lib/email";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.orgId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await params;

  const contract = await db.contract.findUnique({
    where: { id },
    include: {
      tenant: true,
      property: { select: { name: true } },
      payments: {
        where: { status: { in: ["PENDING", "LATE"] } },
        orderBy: { dueDate: "asc" },
        take: 1,
      },
      organization: { select: { name: true } },
    },
  });

  if (!contract || contract.organizationId !== session.user.orgId)
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  if (!contract.tenant.email)
    return NextResponse.json({ error: "El inquilino no tiene email registrado" }, { status: 400 });

  const payment = contract.payments[0];
  if (!payment)
    return NextResponse.json({ error: "Sin pagos pendientes" }, { status: 400 });

  await sendPaymentReminder({
    to: contract.tenant.email,
    tenantName: contract.tenant.name,
    propertyName: contract.property.name,
    amount: payment.amount,
    dueDate: payment.dueDate,
    orgName: contract.organization.name,
  });

  return NextResponse.json({ ok: true });
}
