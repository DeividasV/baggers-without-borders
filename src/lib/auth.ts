import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { NextAuthOptions } from "next-auth";
import { verifyTurnstileToken, shouldBlockRequest } from "./turnstile";
import { logAuthEvent } from "./auditLog";
import { EventType, EventStatus } from "@prisma/client";
import { buildIdentifierWhereClause, parseIdentifier } from "./identifierUtils";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Email or Username", type: "text" },
        password: { label: "Password", type: "password" },
        turnstileToken: { label: "Turnstile Token", type: "text" },
      },
      async authorize(credentials, req) {
        console.log("[Auth] Login attempt:", {
          username: credentials?.username,
          hasPassword: !!credentials?.password,
          env: process.env.NODE_ENV,
        });

        if (!credentials?.username || !credentials?.password) {
          console.log("[Auth] Missing credentials");
          throw new Error("Email/username and password are required");
        }

        // Verify Turnstile token (bot protection)
        // Skip CAPTCHA in development mode
        if (process.env.NODE_ENV !== "development") {
          const turnstileResult = await verifyTurnstileToken(
            credentials.turnstileToken || "",
            undefined
          );

          if (shouldBlockRequest(turnstileResult)) {
            console.warn("Login blocked by Turnstile:", {
              username: credentials.username,
              errors: turnstileResult["error-codes"],
            });
            throw new Error(
              "CAPTCHA verification failed. Please refresh the page and try again."
            );
          }

          // Log if we failed open
          if (turnstileResult.failedOpen) {
            console.warn("Login allowed despite Turnstile timeout:", {
              username: credentials.username,
            });
          }
        }

        // Detect if input is email (contains @) or username
        const identifierInfo = parseIdentifier(credentials.username);

        let user;
        try {
          user = await prisma.user.findUnique({
            where: buildIdentifierWhereClause(credentials.username),
          });
        } catch (error) {
          console.error("[Auth] Database error during authentication", error);
          throw new Error("Database error during authentication");
        }

        if (!user) {
          // Log failed login attempt
          if (req?.headers) {
            await logAuthEvent(
              EventType.AUTH_LOGIN_FAILED,
              EventStatus.FAILURE,
              new Headers(req.headers as HeadersInit),
              {
                actionDetails: {
                  username: credentials.username,
                  reason: "User not found",
                },
                errorMessage: "Invalid email/username or password",
              }
            );
          }
          throw new Error("Invalid email/username or password");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          // Log failed login attempt
          if (req?.headers) {
            await logAuthEvent(
              EventType.AUTH_LOGIN_FAILED,
              EventStatus.FAILURE,
              new Headers(req.headers as HeadersInit),
              {
                userId: user.id,
                actionDetails: {
                  email: user.email,
                  reason: "Invalid password",
                },
                errorMessage: "Invalid email/username or password",
              }
            );
          }
          throw new Error("Invalid email/username or password");
        }

        // Check if email is verified
        if (!user.emailVerified) {
          // Log failed login attempt (email not verified)
          if (req?.headers) {
            await logAuthEvent(
              EventType.AUTH_LOGIN_FAILED,
              EventStatus.FAILURE,
              new Headers(req.headers as HeadersInit),
              {
                userId: user.id,
                actionDetails: {
                  email: user.email,
                  reason: "Email not verified",
                },
                errorMessage: "Email address not verified",
              }
            );
          }
          throw new Error(
            "Please verify your email address before logging in. Check your inbox for the verification link."
          );
        }

        // Log successful login
        if (req?.headers) {
          await logAuthEvent(
            EventType.AUTH_LOGIN_SUCCESS,
            EventStatus.SUCCESS,
            new Headers(req.headers as HeadersInit),
            {
              userId: user.id,
              actionDetails: {
                email: user.email,
              },
            }
          );
        }

        return {
          id: user.id,
          name: user.displayName,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
