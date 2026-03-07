import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import type { Plan, SubscriptionStatus } from "@prisma/client";
import type Stripe from "stripe";

// En la API clover de Stripe, current_period_end fue removido.
// Aproximamos la fecha de vencimiento a 30 días desde el billing_cycle_anchor.
function getPeriodEnd(sub: Stripe.Subscription): Date | null {
  if (sub.billing_cycle_anchor) {
    const anchor = new Date(sub.billing_cycle_anchor * 1000);
    const now = new Date();
    // Avanzar el anchor al próximo mes que sea > now
    const next = new Date(anchor);
    while (next <= now) {
      next.setMonth(next.getMonth() + 1);
    }
    return next;
  }
  return null;
}

function getSubIdFromInvoice(invoice: Stripe.Invoice): string | null {
  const subDetails = invoice.parent?.subscription_details;
  if (!subDetails?.subscription) return null;
  return typeof subDetails.subscription === "string"
    ? subDetails.subscription
    : subDetails.subscription.id;
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const getOrgId = (metadata: Stripe.Metadata | null) =>
    metadata?.organizationId ?? null;

  const getPlan = (metadata: Stripe.Metadata | null): Plan =>
    (metadata?.plan as Plan) ?? "FREE";

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orgId = getOrgId(session.metadata);
      if (!orgId || !session.subscription) break;

      const stripeSubscription = await stripe.subscriptions.retrieve(
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription.id
      );

      await db.subscription.update({
        where: { organizationId: orgId },
        data: {
          stripeSubscriptionId: stripeSubscription.id,
          plan: getPlan(session.metadata),
          status: "ACTIVE",
          currentPeriodEnd: getPeriodEnd(stripeSubscription),
        },
      });
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      const stripeSubId = getSubIdFromInvoice(invoice);
      if (!stripeSubId) break;

      const sub = await db.subscription.findUnique({
        where: { stripeSubscriptionId: stripeSubId },
      });
      if (!sub) break;

      const stripeSub = await stripe.subscriptions.retrieve(stripeSubId);
      await db.subscription.update({
        where: { stripeSubscriptionId: stripeSubId },
        data: {
          status: "ACTIVE",
          currentPeriodEnd: getPeriodEnd(stripeSub),
        },
      });
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const stripeSubId = getSubIdFromInvoice(invoice);
      if (!stripeSubId) break;

      await db.subscription.updateMany({
        where: { stripeSubscriptionId: stripeSubId },
        data: { status: "PAST_DUE" },
      });
      break;
    }

    case "customer.subscription.updated": {
      const stripeSub = event.data.object as Stripe.Subscription;
      const orgId = getOrgId(stripeSub.metadata);
      if (!orgId) break;

      const statusMap: Record<string, SubscriptionStatus> = {
        active: "ACTIVE",
        past_due: "PAST_DUE",
        canceled: "CANCELLED",
        trialing: "TRIAL",
      };

      await db.subscription.update({
        where: { organizationId: orgId },
        data: {
          status: statusMap[stripeSub.status] ?? "ACTIVE",
          plan: getPlan(stripeSub.metadata),
          currentPeriodEnd: getPeriodEnd(stripeSub),
        },
      });
      break;
    }

    case "customer.subscription.deleted": {
      const stripeSub = event.data.object as Stripe.Subscription;
      const orgId = getOrgId(stripeSub.metadata);
      if (!orgId) break;

      await db.subscription.update({
        where: { organizationId: orgId },
        data: { plan: "FREE", status: "CANCELLED", stripeSubscriptionId: null },
      });
      break;
    }
  }

  return NextResponse.json({ received: true });
}
