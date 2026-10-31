import { DrizzleAdapter } from "@auth/drizzle-adapter";
import compare from "bcryptjs";
import { eq } from "drizzle-orm";
import NextAuth, { type DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { env } from "~/env";
import { db } from "~/server/db";
import {
	accounts,
	sessions,
	users,
	verificationTokens,
} from "~/server/db/schema";

declare module "next-auth" {
	interface Session extends DefaultSession {
		user: {
			id: string;
			systemRole: "SUPER_ADMIN" | "USER";
			organizationId: string;
		} & DefaultSession["user"];
	}

	interface User {
		systemRole?: "SUPER_ADMIN" | "USER";
	}
}

export const { handlers, auth, signIn, signOut } = NextAuth({
	adapter: DrizzleAdapter(db, {
		usersTable: users,
		accountsTable: accounts,
		sessionsTable: sessions,
		verificationTokensTable: verificationTokens,
	}),
	session: { strategy: "jwt" },
	secret: env.AUTH_SECRET,
	providers: [
		...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
			? [
					GitHubProvider({
						clientId: process.env.GITHUB_CLIENT_ID,
						clientSecret: process.env.GITHUB_CLIENT_SECRET,
					}),
				]
			: []),
		...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
			? [
					GoogleProvider({
						clientId: process.env.GOOGLE_CLIENT_ID,
						clientSecret: process.env.GOOGLE_CLIENT_SECRET,
					}),
				]
			: []),
		CredentialsProvider({
			name: "Credentials",
			credentials: {
				identifier: { label: "Email or Phone", type: "text" },
				password: { label: "Password", type: "password" },
			},
			async authorize(credentials) {
				if (!credentials?.identifier || !credentials?.password) return null;

				const identifier = String(credentials.identifier).trim();
				const password = String(credentials.password);

				const existingUser = await db.query.users.findFirst({
					where: (u, { eq, or }) =>
						or(eq(u.email, identifier), eq(u.phone, identifier)),
				});

				if (!existingUser || !existingUser.passwordHash) return null;

				const isValid = await compare.compare(
					password,
					existingUser.passwordHash,
				);
				if (!isValid) return null;

				return {
					id: existingUser.id,
					name: existingUser.name,
					email: existingUser.email,
					image: existingUser.image,
					systemRole: existingUser.systemRole,
				};
			},
		}),
	],
	callbacks: {
		jwt({ token, user }) {
			if (user) {
				token.id = user.id;
				token.systemRole = user.systemRole ?? "USER";
			}
			return token;
		},
		session({ session, token }) {
			if (session.user && token.id) {
				session.user.id = token.id as string;
				session.user.systemRole =
					(token.systemRole as "SUPER_ADMIN" | "USER") ?? "USER";
			}
			return session;
		},
	},
});
