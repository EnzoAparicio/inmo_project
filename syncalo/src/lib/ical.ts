import ical, { VEvent } from "node-ical";
import { db } from "@/lib/db";
import { BookingStatus, Platform } from "@prisma/client";
import { detectConflicts } from "@/lib/conflicts";
import { sendConflictAlert } from "@/lib/email";

function toStr(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object" && "val" in (value as object)) {
    return String((value as { val: unknown }).val);
  }
  return String(value);
}

export async function syncChannel(channelId: string) {
  const channel = await db.channel.findUnique({
    where: { id: channelId },
    include: { property: { include: { organization: true } } },
  });

  if (!channel) throw new Error("Canal no encontrado");

  const events = await ical.async.fromURL(channel.icalUrl);

  const bookingsToUpsert = Object.values(events)
    .filter((event): event is VEvent => !!event && event.type === "VEVENT")
    .filter((e) => e.start && e.end)
    .map((e) => ({
      externalId: e.uid ?? null,
      platform: channel.platform,
      guestName: toStr(e.summary),
      summary: toStr(e.description),
      checkIn: new Date(e.start!),
      checkOut: new Date(e.end!),
      status: BookingStatus.CONFIRMED,
      propertyId: channel.propertyId,
    }));

  for (const booking of bookingsToUpsert) {
    if (!booking.externalId) continue;

    await db.booking.upsert({
      where: {
        externalId_platform_propertyId: {
          externalId: booking.externalId,
          platform: booking.platform,
          propertyId: booking.propertyId,
        },
      },
      update: {
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        guestName: booking.guestName,
        summary: booking.summary,
        status: booking.status,
      },
      create: booking,
    });
  }

  await db.channel.update({
    where: { id: channelId },
    data: { lastSyncAt: new Date() },
  });

  // Detectar conflictos tras sync y notificar al admin
  const allBookings = await db.booking.findMany({
    where: { propertyId: channel.propertyId, status: "CONFIRMED" },
  });

  const conflicts = detectConflicts(
    allBookings.map((b) => ({
      id: b.id,
      checkIn: b.checkIn,
      checkOut: b.checkOut,
      platform: b.platform,
    }))
  );

  if (conflicts.length > 0) {
    const conflictIds = new Set(conflicts.flatMap((c) => [c.a, c.b]));
    const conflictedBookings = allBookings.filter((b) => conflictIds.has(b.id));

    const adminMember = await db.member.findFirst({
      where: { organizationId: channel.property.organizationId, role: "ADMIN" },
      include: { user: true },
    });

    if (adminMember?.user.email) {
      await sendConflictAlert({
        to: adminMember.user.email,
        orgName: channel.property.organization.name,
        propertyName: channel.property.name,
        conflicts: conflictedBookings.map((b) => ({
          checkIn: b.checkIn,
          checkOut: b.checkOut,
          platform: b.platform,
        })),
      }).catch(console.error); // no bloquear el sync si el email falla
    }
  }

  return bookingsToUpsert.length;
}

export async function syncAllChannels() {
  // El cron solo sincroniza orgs con auto-sync habilitado (STARTER/PRO)
  const channels = await db.channel.findMany({
    where: {
      property: {
        organization: {
          subscription: { plan: { in: ["STARTER", "PRO"] } },
        },
      },
    },
  });

  const results = await Promise.allSettled(
    channels.map((ch) => syncChannel(ch.id))
  );

  const succeeded = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  return { succeeded, failed, total: channels.length };
}
