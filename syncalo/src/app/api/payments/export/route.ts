import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendiente",
  PAID: "Pagado",
  LATE: "Atrasado",
  WAIVED: "Perdonado",
};

export async function GET() {
  const session = await auth();
  if (!session?.user?.orgId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const payments = await db.payment.findMany({
    where: { contract: { organizationId: session.user.orgId } },
    include: {
      contract: {
        include: {
          tenant: { select: { name: true, document: true } },
          property: { select: { name: true } },
        },
      },
    },
    orderBy: { dueDate: "desc" },
  });

  const header = ["Propiedad", "Inquilino", "Documento", "Vencimiento", "Monto", "Estado", "Fecha de pago"];

  const rows = payments.map((p) => [
    p.contract.property.name,
    p.contract.tenant.name,
    p.contract.tenant.document ?? "",
    format(p.dueDate, "dd/MM/yyyy", { locale: es }),
    p.amount.toFixed(2),
    STATUS_LABEL[p.status] ?? p.status,
    p.paidAt ? format(p.paidAt, "dd/MM/yyyy", { locale: es }) : "",
  ]);

  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const csv = [header, ...rows].map((row) => row.map(escape).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pagos-${format(new Date(), "yyyy-MM")}.csv"`,
    },
  });
}
