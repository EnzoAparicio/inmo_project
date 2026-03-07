import { Platform, BookingStatus, Plan, SubscriptionStatus } from "@prisma/client";

export type { Platform, BookingStatus, Plan, SubscriptionStatus };

export type PropertyWithChannels = {
  id: string;
  name: string;
  address: string | null;
  channels: {
    id: string;
    platform: Platform;
    lastSyncAt: Date | null;
  }[];
};

export type BookingWithProperty = {
  id: string;
  externalId: string | null;
  platform: Platform;
  guestName: string | null;
  summary: string | null;
  checkIn: Date;
  checkOut: Date;
  status: BookingStatus;
  property: {
    id: string;
    name: string;
  };
};
