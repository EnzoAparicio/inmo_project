import type { Metadata } from "next";
import { auth } from "@/lib/auth";

export const metadata: Metadata = { title: "Configuración" };
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id || !session?.user?.orgId) redirect("/login");

  const [org, members] = await Promise.all([
    db.organization.findUnique({
      where: { id: session.user.orgId },
      include: { subscription: true },
    }),
    db.member.findMany({
      where: { organizationId: session.user.orgId },
      include: { user: { select: { id: true, name: true, email: true, image: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  if (!org) redirect("/login");

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Configuración</h1>
      <p className="text-gray-500 text-sm mb-8">
        Gestioná tu organización y los miembros del equipo
      </p>
      <SettingsClient
        org={{ id: org.id, name: org.name, slug: org.slug }}
        members={members}
        currentUserId={session.user.id}
        currentRole={session.user.role}
      />
    </div>
  );
}
