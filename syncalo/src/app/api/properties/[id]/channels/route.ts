import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { PLANS } from "@/lib/stripe";

const channelSchema = z.object({
  platform: z.enum(["AIRBNB", "BOOKING", "DIRECT"]),
  icalUrl: z.string().url(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.orgId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { id } = await params;

  const property = await db.property.findUnique({ where: { id } });
  if (!property || property.organizationId !== session.user.orgId) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const subscription = await db.subscription.findUnique({
    where: { organizationId: session.user.orgId },
  });

  const plan = PLANS[subscription?.plan ?? "FREE"];
  const channelCount = await db.channel.count({ where: { propertyId: id } });

  if (channelCount >= plan.maxChannelsPerProperty) {
    return NextResponse.json(
      {
        error: `Tu plan ${plan.name} permite máximo ${plan.maxChannelsPerProperty} canal${plan.maxChannelsPerProperty === 1 ? "" : "es"} por propiedad. Actualizá tu plan.`,
        limitReached: true,
      },
      { status: 403 }
    );
  }

  const body = await req.json();
  const parsed = channelSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const channel = await db.channel.create({
    data: { ...parsed.data, propertyId: id },
  });

  return NextResponse.json(channel, { status: 201 });
}
