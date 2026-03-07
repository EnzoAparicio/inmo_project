import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { syncChannel } from "@/lib/ical";

type Params = { params: Promise<{ id: string; channelId: string }> };

async function authorizeChannel(orgId: string, propertyId: string, channelId: string) {
  const channel = await db.channel.findUnique({
    where: { id: channelId },
    include: { property: true },
  });
  if (
    !channel ||
    channel.propertyId !== propertyId ||
    channel.property.organizationId !== orgId
  ) {
    return null;
  }
  return channel;
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.orgId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { id, channelId } = await params;
  const channel = await authorizeChannel(session.user.orgId, id, channelId);
  if (!channel) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  await db.channel.delete({ where: { id: channelId } });
  return NextResponse.json({ ok: true });
}

export async function POST(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.orgId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { id, channelId } = await params;
  const channel = await authorizeChannel(session.user.orgId, id, channelId);
  if (!channel) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const count = await syncChannel(channelId);
  return NextResponse.json({ synced: count });
}
