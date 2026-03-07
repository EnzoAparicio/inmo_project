// Instancia liviana de NextAuth solo para el proxy (edge runtime)
// No importa db ni bcryptjs para no romper el middleware
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { auth } = NextAuth({
  providers: [Credentials({})],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token }) {
      return token;
    },
    async session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      if (token.orgId) session.user.orgId = token.orgId as string;
      if (token.role) session.user.role = token.role as import("@prisma/client").Role;
      return session;
    },
  },
});
