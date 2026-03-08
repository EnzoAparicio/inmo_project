import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { signOut } from "@/lib/auth";
import NavLinks from "./NavLinks";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrador",
  AGENT: "Agente",
  VIEWER: "Visualizador",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id || !session?.user?.orgId) redirect("/login");

  const org = await db.organization.findUnique({
    where: { id: session.user.orgId },
    select: { name: true },
  });

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-5 border-b border-gray-200">
          <span className="text-lg font-bold text-blue-600">Syncalo</span>
          {org && <p className="text-xs text-gray-400 mt-0.5 truncate">{org.name}</p>}
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <NavLinks />
        </nav>

        <div className="p-4 border-t border-gray-200">
          <p className="text-xs font-medium text-gray-700 truncate">{session.user.name}</p>
          <p className="text-xs text-gray-400 truncate mb-1">{session.user.email}</p>
          <p className="text-xs text-gray-400 mb-3">
            {ROLE_LABEL[session.user.role] ?? session.user.role}
          </p>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button type="submit" className="text-sm text-gray-500 hover:text-gray-700 transition">
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
