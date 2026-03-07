import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";

export async function POST() {
  const session = await auth();
  if (!session?.user?.orgId || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  }

  const subscription = await db.subscription.findUnique({
    where: { organizationId: session.user.orgId },
  });

  if (!subscription?.stripeCustomerId) {
    return NextResponse.json(
      { error: "No tenés una suscripción activa" },
      { status: 400 }
    );
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: `${process.env.AUTH_URL}/billing`,
  });

  return NextResponse.json({ url: portalSession.url });
}
