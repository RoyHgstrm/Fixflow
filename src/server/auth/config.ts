import { type DefaultSession, type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "~/server/db";
import bcrypt from "bcryptjs";
import { type UserRole } from "~/lib/types";

// Define the expected user type from Prisma
interface PrismaUserWithRole {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  password: string | null;
  role: UserRole;
}

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession["user"];
  }

  interface User {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role: UserRole;
  }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  debug: true,
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user?.password) {
          return null;
        }

        const isValidPassword = await bcrypt.compare(credentials.password as string, user.password);

        if (!isValidPassword) {
          return null;
        }

        // Cast to our interface that includes the role property (using unknown first for type safety)
        const userWithRole = user as unknown as PrismaUserWithRole;
        
        return {
          id: userWithRole.id,
          name: userWithRole.name,
          email: userWithRole.email,
          image: userWithRole.image,
          role: userWithRole.role,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    signOut: "/login",
  },
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.role = user.role;
      }
      return token;
    },
    session: ({ session, token }) => {
      const newSession = {
        ...session,
        user: {
          ...session.user,
          id: token.sub!,
          name: token.name!,
          email: token.email!,
          role: token.role as UserRole,
        },
      };
      return newSession;
    },
  },
} satisfies NextAuthConfig;
