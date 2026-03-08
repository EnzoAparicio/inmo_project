import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { addMonths } from "date-fns";

type Params = { params: Promise<{ id: string }> };

const markPaidSchema = z.object({
  paymentId: z.string(),
  paidAt: z.string().optional(),
});

// POST — marcar pago como pagado y generar el siguiente
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.orgId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await params;
  const contract = await db.contract.findUnique({
    where: { id },
    include: { payments: { orderBy: { dueDate: "desc" }, take: 1 } },
  });

  if (!contract || contract.organizationId !== session.user.orgId)
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const parsed = markPaidSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const payment = await db.payment.update({
    where: { id: parsed.data.paymentId },
    data: {
      status: "PAID",
      paidAt: parsed.data.paidAt ? new Date(parsed.data.paidAt) : new Date(),
    },
  });

  // Generar el próximo pago si el contrato está activo
  if (contract.status === "ACTIVE" && contract.payments[0]) {
    const nextDue = addMonths(new Date(contract.payments[0].dueDate), 1);
    const endDate = contract.endDate ? new Date(contract.endDate) : null;
    if (!endDate || nextDue <= endDate) {
      await db.payment.create({
        data: { contractId: id, amount: contract.monthlyRent, dueDate: nextDue },
      });
    }
  }

  return NextResponse.json(payment);
}
