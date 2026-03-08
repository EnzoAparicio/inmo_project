import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { addDays } from "date-fns";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  orgName: z.string().min(2).optional(),
});

function generateSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "") +
    "-" +
    Math.random().toString(36).slice(2, 7)
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const { name, email, password, orgName } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "El email ya está registrado" },
      { status: 409 }
    );
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await db.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: { name, email, password: hashedPassword },
    });

    const resolvedOrgName = orgName ?? name;
    await tx.organization.create({
      data: {
        name: resolvedOrgName,
        slug: generateSlug(resolvedOrgName),
        members: {
          create: { userId: newUser.id, role: "ADMIN" },
        },
        subscription: {
          create: {
            plan: "FREE",
            status: "TRIAL",
            trialEndsAt: addDays(new Date(), 14),
          },
        },
      },
    });

    return newUser;
  });

  return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
}
