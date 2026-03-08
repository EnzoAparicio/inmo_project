import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Syncalo", template: "%s · Syncalo" },
  description:
    "Plataforma de gestión para agencias inmobiliarias. Contratos, inquilinos, pagos y sincronización de calendarios Airbnb y Booking.",
  openGraph: {
    siteName: "Syncalo",
    locale: "es_UY",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${geist.variable} antialiased`}>{children}</body>
    </html>
  );
}
