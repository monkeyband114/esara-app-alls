import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getUserByEmail } from "@/lib/repository";
import type { Role } from "@/lib/types";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const demoPasswords: Record<string, string> = {
  "admin@esara.edu": "Admin123@",
  "ict@esara.edu": "ICT123@",
  "arnold.ojugo@esara.edu": "Staff123@",
  "maureen.akazwe@esara.edu": "Staff123@",
  "patrick.ejeh@esara.edu": "Staff123@"
};

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  logger: {
    error(code, metadata) {
      if (code === "JWT_SESSION_ERROR") {
        console.warn("[next-auth][warn][JWT_SESSION_ERROR]", metadata);
        return;
      }
      console.error("[next-auth][error]", code, metadata);
    }
  },
  providers: [
    CredentialsProvider({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const user = await getUserByEmail(parsed.data.email);
        if (!user || user.suspended) return null;
        const matches = user.passwordHash
          ? await bcrypt.compare(parsed.data.password, user.passwordHash)
          : parsed.data.password === demoPasswords[user.email.toLowerCase()];
        if (!matches) return null;
        return { id: user.id, name: user.fullName, email: user.email, role: user.role };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = (user as { role?: Role }).role;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = token.role as Role;
      }
      return session;
    }
  }
};
