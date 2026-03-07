import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendTrialEndingAlert } from "@/lib/email";

// GET /api/cron/trials — Vercel Cron, corre 1x/día
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const now = new Date();
  const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Orgs en trial con vencimiento en 3 o 7 días
  const expiringTrials = await db.subscription.findMany({
    where: {
      status: "TRIAL",
      trialEndsAt: {
        gte: now,
        lte: in7Days,
      },
    },
    include: {
      organization: {
        include: {
          members: {
            where: { role: "ADMIN" },
            include: { user: { select: { email: true } } },
            take: 1,
          },
        },
      },
    },
  });

  let sent = 0;
  for (const sub of expiringTrials) {
    if (!sub.trialEndsAt) continue;
    const daysLeft = Math.ceil(
      (sub.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Solo notificar exactamente en 7 y 3 días
    if (daysLeft !== 7 && daysLeft !== 3) continue;

    const adminEmail = sub.organization.members[0]?.user.email;
    if (!adminEmail) continue;

    await sendTrialEndingAlert({
      to: adminEmail,
      orgName: sub.organization.name,
      daysLeft,
    }).catch(console.error);

    sent++;
  }

  return NextResponse.json({ sent, checked: expiringTrials.length });
}
