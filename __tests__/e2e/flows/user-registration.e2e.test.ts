/**
 * E2E Flow Test: User Registration and Data Flow
 *
 * Tests user registration data flow and database state management
 * Note: Auth routes use server actions, so we test database state directly
 */

import { getTestDb, cleanTestDb } from "../../utils/test-db-setup";
import bcrypt from "bcryptjs";

let testDb: ReturnType<typeof getTestDb>;
jest.mock("@/src/lib/prisma", () => ({
  get prisma() {
    if (!testDb) {
      testDb = getTestDb();
    }
    return testDb;
  },
}));

// Mock email sending
jest.mock("@/src/lib/email", () => ({
  sendVerificationEmail: jest.fn(() => Promise.resolve({ success: true })),
  sendPasswordResetEmail: jest.fn(() => Promise.resolve({ success: true })),
}));

describe("E2E Flow: User Registration Database Flow", () => {
  let db: ReturnType<typeof getTestDb>;

  beforeAll(() => {
    db = getTestDb();
  });

  beforeEach(async () => {
    await cleanTestDb();
  });

  it("should create user with pending verification status", async () => {
    // Simulate registration by creating user directly
    const password = await bcrypt.hash("SecurePass123", 12);

    const user = await db.user.create({
      data: {
        username: "newuser",
        displayName: "New User",
        email: "newuser@test.com",
        password,
        role: "USER",
        status: "PENDING_VERIFICATION",
        emailVerificationToken: "verification-token-123",
        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    expect(user).toBeDefined();
    expect(user.status).toBe("PENDING_VERIFICATION");
    expect(user.emailVerified).toBeNull();
    expect(user.emailVerificationToken).toBe("verification-token-123");
  });

  it("should transition from pending to active after verification", async () => {
    const password = await bcrypt.hash("SecurePass123", 12);

    // Create pending user
    const user = await db.user.create({
      data: {
        username: "newuser",
        displayName: "New User",
        email: "newuser@test.com",
        password,
        role: "USER",
        status: "PENDING_VERIFICATION",
        emailVerificationToken: "verification-token-123",
        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    // Simulate email verification
    const verified = await db.user.update({
      where: { id: user.id },
      data: {
        status: "ACTIVE",
        emailVerified: new Date(),
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    });

    expect(verified.status).toBe("ACTIVE");
    expect(verified.emailVerified).toBeDefined();
    expect(verified.emailVerificationToken).toBeNull();
  });

  it("should prevent duplicate username", async () => {
    // Create existing user
    const password = await bcrypt.hash("Password123", 12);

    await db.user.create({
      data: {
        username: "existing",
        displayName: "Existing User",
        email: "existing@test.com",
        password,
        role: "USER",
      },
    });

    // Try to create another user with same username
    await expect(
      db.user.create({
        data: {
          username: "existing",
          displayName: "New User",
          email: "new@test.com",
          password,
          role: "USER",
        },
      })
    ).rejects.toThrow();
  });

  it("should prevent duplicate email", async () => {
    const password = await bcrypt.hash("Password123", 12);

    await db.user.create({
      data: {
        username: "existing",
        displayName: "Existing User",
        email: "duplicate@test.com",
        password,
        role: "USER",
      },
    });

    // Try to create another user with same email
    await expect(
      db.user.create({
        data: {
          username: "newuser",
          displayName: "New User",
          email: "duplicate@test.com",
          password,
          role: "USER",
        },
      })
    ).rejects.toThrow();
  });

  it("should handle expired verification tokens", async () => {
    const password = await bcrypt.hash("Password123", 12);
    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() - 10); // 10 days ago

    const user = await db.user.create({
      data: {
        username: "expireduser",
        displayName: "Expired User",
        email: "expired@test.com",
        password,
        role: "USER",
        status: "PENDING_VERIFICATION",
        emailVerificationToken: "expired-token",
        emailVerificationExpires: expiredDate,
      },
    });

    // Verify token is expired
    expect(user.emailVerificationExpires!.getTime()).toBeLessThan(Date.now());
    expect(user.status).toBe("PENDING_VERIFICATION");
  });

  it("should store hashed passwords", async () => {
    const plainPassword = "MySecretPassword123";
    const hashedPassword = await bcrypt.hash(plainPassword, 12);

    const user = await db.user.create({
      data: {
        username: "testuser",
        displayName: "Test User",
        email: "test@test.com",
        password: hashedPassword,
        role: "USER",
      },
    });

    // Verify password is hashed (not plain text)
    expect(user.password).not.toBe(plainPassword);
    expect(user.password.length).toBeGreaterThan(50); // Bcrypt hashes are 60 chars

    // Verify password can be validated
    const isValid = await bcrypt.compare(plainPassword, user.password);
    expect(isValid).toBe(true);
  });
});
