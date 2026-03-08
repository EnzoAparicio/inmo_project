import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { addDays, format } from "date-fns";
import { es } from "date-fns/locale";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "Syncalo <noreply@syncalo.app>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://syncalo.app";

// GET — cron diario: alerta cuando un contrato vence en 30 o 7 días
export async function GET(req: Request) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (secret !== process.env.CRON_SECRET)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const now = new Date();
  const alerts: number[] = [7, 30];
  let notified = 0;

  for (const days of alerts) {
    const targetDate = addDays(now, days);
    const dayStart = new Date(targetDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);

    const contracts = await db.contract.findMany({
      where: {
        status: "ACTIVE",
        endDate: { gte: dayStart, lte: dayEnd },
      },
      include: {
        tenant: { select: { name: true } },
        property: { select: { name: true } },
        organization: {
          include: {
            members: {
              where: { role: "ADMIN" },
              include: { user: { select: { email: true, name: true } } },
              take: 1,
            },
          },
        },
      },
    });

    for (const contract of contracts) {
      const admin = contract.organization.members[0]?.user;
      if (!admin?.email) continue;

      const endStr = format(contract.endDate!, "d 'de' MMMM yyyy", { locale: es });

      await resend.emails.send({
        from: FROM,
        to: admin.email,
        subject: `Contrato por vencer en ${days} días — ${contract.tenant.name}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <h2 style="color:#d97706">Contrato próximo a vencer</h2>
            <p>Hola${admin.name ? ` ${admin.name}` : ""},</p>
            <p>El contrato de <strong>${contract.tenant.name}</strong> en <strong>${contract.property.name}</strong> vence el <strong>${endStr}</strong> (en ${days} días).</p>
            <p>Recordá coordinar la renovación o el cierre del contrato con el inquilino.</p>
            <a href="${APP_URL}/contracts"
               style="display:inline-block;margin-top:16px;background:#2563eb;color:white;padding:10px 20px;border-radius:8px;text-decoration:none">
              Ver contratos
            </a>
          </div>
        `,
      }).catch(() => null);

      notified++;
    }
  }

  return NextResponse.json({ notified });
}
