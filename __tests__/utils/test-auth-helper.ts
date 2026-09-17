/**
 * Authentication Helper for E2E API Tests
 *
 * Provides utilities to create authenticated requests for testing protected endpoints.
 * Uses the same authentication flow as the actual application.
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { encode } from "next-auth/jwt";

export interface TestUser {
  id: string;
  username: string;
  email: string;
  displayName: string;
  role: "ADMIN" | "MEMBER";
  password: string; // Plain text password for testing
}

export interface AuthToken {
  token: string;
  user: TestUser;
}

/**
 * Creates a test user in the database with hashed password
 */
export async function createTestUser(
  db: PrismaClient,
  overrides?: Partial<TestUser>
): Promise<TestUser> {
  const plainPassword = overrides?.password || "testPassword123";
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  const userData = {
    username: overrides?.username || `testuser_${Date.now()}`,
    email: overrides?.email || `test_${Date.now()}@example.com`,
    displayName: overrides?.displayName || "Test User",
    role: overrides?.role || "MEMBER",
    password: hashedPassword,
  };

  const user = await db.user.create({
    data: userData,
  });

  return {
    id: user.id,
    username: user.username,
    email: user.email || "",
    displayName: user.displayName || user.username,
    role: user.role as "ADMIN" | "MEMBER",
    password: plainPassword, // Return plain password for tests
  };
}

/**
 * Creates an admin test user
 */
export async function createTestAdmin(
  db: PrismaClient,
  overrides?: Partial<TestUser>
): Promise<TestUser> {
  return createTestUser(db, { ...overrides, role: "ADMIN" });
}

/**
 * Generates a JWT token for a test user (simulates NextAuth token)
 */
export async function generateAuthToken(user: TestUser): Promise<string> {
  const secret = process.env.NEXTAUTH_SECRET || "test-secret-key-for-testing";

  const token = await encode({
    token: {
      sub: user.id,
      id: user.id,
      name: user.displayName,
      email: user.username,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 hours
    },
    secret,
  });

  return token;
}

/**
 * Creates a complete auth context for testing: user + token
 */
export async function createAuthContext(
  db: PrismaClient,
  overrides?: Partial<TestUser>
): Promise<AuthToken> {
  const user = await createTestUser(db, overrides);
  const token = await generateAuthToken(user);

  return { token, user };
}

/**
 * Creates an admin auth context for testing
 */
export async function createAdminAuthContext(
  db: PrismaClient,
  overrides?: Partial<TestUser>
): Promise<AuthToken> {
  const user = await createTestAdmin(db, overrides);
  const token = await generateAuthToken(user);

  return { token, user };
}

/**
 * Adds authentication headers to a request
 *
 * @example
 * const headers = addAuthHeaders(authToken.token);
 * const request = new NextRequest("http://localhost/api/users", {
 *   headers
 * });
 */
export function addAuthHeaders(token: string): Headers {
  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  headers.set("Cookie", `next-auth.session-token=${token}`);
  return headers;
}

/**
 * Mock NextAuth getServerSession for testing
 * Use this in tests to bypass middleware authentication
 *
 * @example
 * jest.mock("next-auth", () => ({
 *   ...jest.requireActual("next-auth"),
 *   getServerSession: () => mockNextAuthSession(authContext.user)
 * }));
 */
export function mockNextAuthSession(user: TestUser) {
  return Promise.resolve({
    user: {
      id: user.id,
      name: user.displayName,
      email: user.username,
      role: user.role,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  });
}

/**
 * Creates request options with authentication
 *
 * @example
 * const request = new NextRequest(
 *   "http://localhost/api/users",
 *   createAuthenticatedRequest(authToken.token, {
 *     method: "POST",
 *     body: JSON.stringify({ username: "newuser" })
 *   })
 * );
 */
export function createAuthenticatedRequest(
  token: string,
  options?: RequestInit
): RequestInit {
  const headers = addAuthHeaders(token);

  // Merge with existing headers if provided
  if (options?.headers) {
    const existingHeaders = new Headers(options.headers);
    existingHeaders.forEach((value, key) => {
      if (
        key.toLowerCase() !== "cookie" &&
        key.toLowerCase() !== "content-type"
      ) {
        headers.set(key, value);
      }
    });
  }

  // Filter out signal: null to avoid type issues
  const { signal, ...restOptions } = options || {};

  return {
    ...restOptions,
    headers,
    ...(signal !== null && signal !== undefined ? { signal } : {}),
  };
}
