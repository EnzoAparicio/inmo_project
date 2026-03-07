import type { Platform } from "@prisma/client";

export function detectConflicts(
  bookings: { checkIn: Date; checkOut: Date; platform: Platform; id: string }[]
) {
  const conflicts: { a: string; b: string }[] = [];

  for (let i = 0; i < bookings.length; i++) {
    for (let j = i + 1; j < bookings.length; j++) {
      const a = bookings[i];
      const b = bookings[j];
      if (a.platform === b.platform) continue;

      const overlap = a.checkIn < b.checkOut && b.checkIn < a.checkOut;
      if (overlap) conflicts.push({ a: a.id, b: b.id });
    }
  }

  return conflicts;
}
