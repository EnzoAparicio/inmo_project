import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { PLANS } from "@/lib/stripe";

const propertySchema = z.object({
  name: z.string().min(2),
  address: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.orgId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const properties = await db.property.findMany({
    where: { organizationId: session.user.orgId },
    include: {
      channels: { select: { id: true, platform: true, lastSyncAt: true } },
      _count: { select: { bookings: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(properties);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.orgId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const subscription = await db.subscription.findUnique({
    where: { organizationId: session.user.orgId },
  });

  const plan = PLANS[subscription?.plan ?? "FREE"];
  const propertyCount = await db.property.count({
    where: { organizationId: session.user.orgId },
  });

  if (propertyCount >= plan.maxProperties) {
    return NextResponse.json(
      {
        error: `Tu plan ${plan.name} permite máximo ${plan.maxProperties} propiedad${plan.maxProperties === 1 ? "" : "es"}. Actualizá tu plan para agregar más.`,
        limitReached: true,
      },
      { status: 403 }
    );
  }

  const body = await req.json();
  const parsed = propertySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const property = await db.property.create({
    data: { ...parsed.data, organizationId: session.user.orgId },
  });

  return NextResponse.json(property, { status: 201 });
}
