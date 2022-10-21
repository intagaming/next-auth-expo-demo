import { nativeProviders, providerPairs } from "@acme/constants";
import { prisma } from "@acme/db";
import { env } from "../../../apps/nextjs/src/env/server.mjs";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";

const prismaAdapter = PrismaAdapter(prisma);

export const isValidProvider = (k: string): k is keyof typeof providerPairs => {
  return k in providerPairs;
};

export const authOptions: NextAuthOptions = {
  // Configure one or more authentication providers
  adapter: prismaAdapter,
  providers: [
    GithubProvider({
      clientId: env.GITHUB_EXPO_PROXY_CLIENT_ID,
      clientSecret: env.GITHUB_EXPO_PROXY_CLIENT_SECRET,
    }),
    {
      ...GithubProvider({
        name: "Github Expo Proxy",
        clientId: env.GITHUB_EXPO_PROXY_CLIENT_ID,
        clientSecret: env.GITHUB_EXPO_PROXY_CLIENT_SECRET,
        checks: ["state", "pkce"],
        token: {
          async request(context) {
            const tokens = await context.client.oauthCallback(
              undefined,
              context.params,
              context.checks
            );
            return { tokens };
          },
        },
      }),
      id: nativeProviders.github,
    },
  ],
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
    async signIn({ account }) {
      if (!account) return false;

      const userByAccount = await prismaAdapter.getUserByAccount({
        providerAccountId: account.providerAccountId,
        provider: account.provider,
      });
      // If registering
      if (!userByAccount) {
        const provider = account.provider;
        if (isValidProvider(provider)) {
          const counterpart = providerPairs[provider];
          const userByAccount = await prismaAdapter.getUserByAccount({
            providerAccountId: account.providerAccountId,
            provider: counterpart,
          });
          // If exists the account in the counterpart provider
          if (userByAccount) {
            // Link the account to the user
            await prismaAdapter.linkAccount({
              ...account,
              userId: userByAccount.id,
            });
          }
        }
      }
      return true;
    },
  },
};
