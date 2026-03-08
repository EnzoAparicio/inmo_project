import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "Syncalo <noreply@syncalo.app>";

export async function GET(req: Request) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const now = new Date();

  // Marcar como LATE los que vencieron
  const result = await db.payment.updateMany({
    where: { status: "PENDING", dueDate: { lt: now } },
    data: { status: "LATE" },
  });

  // Notificar a los admins con pagos atrasados (agrupado por org)
  if (result.count > 0) {
    const lateByOrg = await db.payment.groupBy({
      by: ["contractId"],
      where: { status: "LATE" },
      _count: { id: true },
    });

    // Obtener orgs únicas con pagos atrasados
    const orgIds = await db.contract.findMany({
      where: { id: { in: lateByOrg.map((r) => r.contractId) } },
      select: { organizationId: true },
      distinct: ["organizationId"],
    });

    for (const { organizationId } of orgIds) {
      const admin = await db.member.findFirst({
        where: { organizationId, role: "ADMIN" },
        include: { user: { select: { email: true, name: true } } },
      });

      if (!admin?.user?.email) continue;

      const count = await db.payment.count({
        where: { status: "LATE", contract: { organizationId } },
      });

      await resend.emails.send({
        from: FROM,
        to: admin.user.email,
        subject: `${count} pago${count !== 1 ? "s" : ""} atrasado${count !== 1 ? "s" : ""} en tu cartera`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <h2 style="color:#dc2626">Pagos atrasados</h2>
            <p>Hola${admin.user.name ? ` ${admin.user.name}` : ""},</p>
            <p>Hay <strong>${count} pago${count !== 1 ? "s" : ""} atrasado${count !== 1 ? "s" : ""}</strong> en tu cartera que requieren atención.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://syncalo.app"}/contracts"
               style="display:inline-block;margin-top:16px;background:#2563eb;color:white;padding:10px 20px;border-radius:8px;text-decoration:none">
              Ver contratos
            </a>
          </div>
        `,
      }).catch(() => null); // No fallar si Resend no está configurado
    }
  }

  return NextResponse.json({ updated: result.count });
}
