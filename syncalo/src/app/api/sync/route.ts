import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { syncAllChannels, syncChannel } from "@/lib/ical";

// POST /api/sync — sincroniza un canal específico o todos los del usuario
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { channelId } = await req.json().catch(() => ({}));

  if (channelId) {
    const count = await syncChannel(channelId);
    return NextResponse.json({ synced: count });
  }

  const result = await syncAllChannels();
  return NextResponse.json(result);
}

// GET /api/sync — endpoint para cron job (Vercel Cron)
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const result = await syncAllChannels();
  return NextResponse.json(result);
}
