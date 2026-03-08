import { NextResponse } from "next/server";

export function GET() {
  return new NextResponse(
    `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /dashboard\nDisallow: /properties\nDisallow: /contracts\nDisallow: /tenants\nDisallow: /calendar\nDisallow: /settings\nDisallow: /billing`,
    { headers: { "Content-Type": "text/plain" } }
  );
}
