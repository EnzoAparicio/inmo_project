"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Inicio" },
  { href: "/properties", label: "Propiedades" },
  { href: "/calendar", label: "Calendario" },
  { href: "/tenants", label: "Inquilinos" },
  { href: "/contracts", label: "Contratos" },
  { href: "/billing", label: "Billing" },
  { href: "/settings", label: "Configuración" },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <>
      {links.map(({ href, label }) => {
        const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition ${
              isActive
                ? "bg-blue-50 text-blue-700 font-medium"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </>
  );
}
