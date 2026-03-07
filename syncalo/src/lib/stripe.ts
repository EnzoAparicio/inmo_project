import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

export const PLANS = {
  FREE: {
    name: "Free",
    priceId: null,
    maxProperties: 1,
    maxChannelsPerProperty: 2 as number,
    autoSync: false,
    price: 0,
  },
  STARTER: {
    name: "Starter",
    priceId: process.env.STRIPE_STARTER_PRICE_ID!,
    maxProperties: 5 as number,
    maxChannelsPerProperty: 3 as number,
    autoSync: true,
    price: 9,
  },
  PRO: {
    name: "Pro",
    priceId: process.env.STRIPE_PRO_PRICE_ID!,
    maxProperties: Infinity as number,
    maxChannelsPerProperty: 3 as number,
    autoSync: true,
    price: 29,
  },
} as const;
