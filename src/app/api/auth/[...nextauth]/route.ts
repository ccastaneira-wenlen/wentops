import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        dni: { label: "DNI", type: "text" },
        password: { label: "Contraseña", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.dni || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.dni }
        });

        if (!user) {
          return null;
        }

        let isPasswordValid = false;

        // Support plain "wentop" for unseeded users or bcrypt-hashed passwords
        if (user.password === "wentop" && credentials.password === "wentop") {
          isPasswordValid = true;
        } else {
          try {
            isPasswordValid = await bcrypt.compare(credentials.password, user.password);
          } catch {
            isPasswordValid = false;
          }
        }

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          mustChangePassword: user.mustChangePassword
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.mustChangePassword = (user as any).mustChangePassword;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).mustChangePassword = token.mustChangePassword;
      }
      return session;
    }
  },
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
