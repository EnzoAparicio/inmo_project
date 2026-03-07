import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stripe, PLANS } from "@/lib/stripe";

const schema = z.object({
  plan: z.enum(["STARTER", "PRO"]),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.orgId || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Plan inválido" }, { status: 400 });
  }

  const { plan } = parsed.data;
  const planConfig = PLANS[plan];

  const subscription = await db.subscription.findUnique({
    where: { organizationId: session.user.orgId },
  });

  let customerId = subscription?.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session.user.email!,
      name: session.user.name ?? undefined,
      metadata: { organizationId: session.user.orgId },
    });
    customerId = customer.id;
    await db.subscription.update({
      where: { organizationId: session.user.orgId },
      data: { stripeCustomerId: customerId },
    });
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: planConfig.priceId, quantity: 1 }],
    success_url: `${process.env.AUTH_URL}/billing?success=true`,
    cancel_url: `${process.env.AUTH_URL}/billing`,
    metadata: { organizationId: session.user.orgId, plan },
    subscription_data: {
      metadata: { organizationId: session.user.orgId, plan },
    },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
