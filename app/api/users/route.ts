import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import bcrypt from "bcryptjs";
import { getSession } from "@/src/lib/api-auth";
import { logAdminAction } from "@/src/lib/auditLog";
import { EventType, EventStatus, Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    // Middleware ensures user is authenticated and is ADMIN
    const { searchParams } = new URL(request.url);

    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Build filter conditions
    const AND: Prisma.UserWhereInput[] = [];

    // Basic search
    const search = searchParams.get("search");
    if (search) {
      AND.push({
        OR: [
          { username: { contains: search } },
          { displayName: { contains: search } },
          { email: { contains: search } },
          { givenName: { contains: search } },
          { familyName: { contains: search } },
          { gender: { contains: search } },
          { birthCountry: { name: { contains: search } } },
          { residenceCountry: { name: { contains: search } } },
          { residenceRegion: { name: { contains: search } } },
          { bwbForumNickname: { contains: search } },
          { role: { contains: search } },
          { status: { contains: search } },
          { notes: { contains: search } },
        ],
      });
    }

    // Advanced filters
    const givenName = searchParams.get("givenName");
    if (givenName) {
      AND.push({ givenName: { contains: givenName } });
    }

    const familyName = searchParams.get("familyName");
    if (familyName) {
      AND.push({ familyName: { contains: familyName } });
    }

    const email = searchParams.get("email");
    if (email) {
      AND.push({ email: { contains: email } });
    }

    const gender = searchParams.get("gender");
    if (gender) {
      AND.push({ gender });
    }

    const birthYearMin = searchParams.get("birthYearMin");
    if (birthYearMin) {
      const minYear = parseInt(birthYearMin);
      if (!isNaN(minYear)) {
        AND.push({ birthYear: { gte: minYear } });
      }
    }

    const birthYearMax = searchParams.get("birthYearMax");
    if (birthYearMax) {
      const maxYear = parseInt(birthYearMax);
      if (!isNaN(maxYear)) {
        AND.push({ birthYear: { lte: maxYear } });
      }
    }

    // Birth country - support multiple selections
    const birthCountries = searchParams.getAll("birthCountry");
    if (birthCountries.length > 0) {
      AND.push({
        birthCountry: { code: { in: birthCountries } },
      });
    }

    // Residence country - support multiple selections
    const residenceCountries = searchParams.getAll("residenceCountry");
    if (residenceCountries.length > 0) {
      AND.push({
        residenceCountry: { code: { in: residenceCountries } },
      });
    }

    const role = searchParams.get("role");
    if (role) {
      AND.push({ role });
    }

    const status = searchParams.get("status");
    if (status) {
      AND.push({ status });
    }

    const forumNickname = searchParams.get("forumNickname");
    if (forumNickname) {
      AND.push({
        bwbForumNickname: { contains: forumNickname },
      });
    }

    const notes = searchParams.get("notes");
    if (notes) {
      AND.push({
        notes: { contains: notes },
      });
    }

    // Helper to validate and parse date safely
    const parseDate = (dateStr: string): Date | null => {
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? null : date;
    };

    const createdDateFrom = searchParams.get("createdDateFrom");
    if (createdDateFrom) {
      const fromDate = parseDate(createdDateFrom);
      if (fromDate) {
        AND.push({ createdAt: { gte: fromDate } });
      }
    }

    const createdDateTo = searchParams.get("createdDateTo");
    if (createdDateTo) {
      const toDate = parseDate(createdDateTo);
      if (toDate) {
        toDate.setHours(23, 59, 59, 999);
        AND.push({ createdAt: { lte: toDate } });
      }
    }

    const updatedDateFrom = searchParams.get("updatedDateFrom");
    if (updatedDateFrom) {
      const fromDate = parseDate(updatedDateFrom);
      if (fromDate) {
        AND.push({ updatedAt: { gte: fromDate } });
      }
    }

    const updatedDateTo = searchParams.get("updatedDateTo");
    if (updatedDateTo) {
      const toDate = parseDate(updatedDateTo);
      if (toDate) {
        toDate.setHours(23, 59, 59, 999);
        AND.push({ updatedAt: { lte: toDate } });
      }
    }

    // Show only retired members (retiredYear is not null)
    const showRetired = searchParams.get("showRetired");
    if (showRetired === "true") {
      AND.push({ retiredYear: { not: null } });
    }

    // Show only deceased members (deceasedYear is not null)
    const showDeceased = searchParams.get("showDeceased");
    if (showDeceased === "true") {
      AND.push({ deceasedYear: { not: null } });
    }

    // Show only verified users (emailVerified is not null)
    const verified = searchParams.get("verified");
    if (verified === "true") {
      AND.push({ emailVerified: { not: null } });
    }

    if (AND.length > 0) {
      var where: Prisma.UserWhereInput = { AND };
    } else {
      var where: Prisma.UserWhereInput = {};
    }

    // Get sorting parameters
    const sortBy = searchParams.get("sortBy");
    const sortOrder = searchParams.get("sortOrder") || "asc";

    // Build orderBy clause with multi-level sorting
    let orderBy: any[] = [];

    if (sortBy) {
      const validSortFields = [
        "givenName",
        "familyName",
        "email",
        "createdAt",
        "updatedAt",
        "residenceCountry",
        "forumJoinDate",
        "status",
      ];

      if (validSortFields.includes(sortBy)) {
        // Primary sort by the selected field
        // Handle relation sorting specially
        if (sortBy === "residenceCountry") {
          orderBy.push({ residenceCountry: { name: sortOrder } });
        } else {
          orderBy.push({ [sortBy]: sortOrder });
        }

        // Add secondary sorts based on primary sort field
        if (sortBy === "givenName") {
          // Given name -> family name -> created -> updated -> email
          orderBy.push(
            { familyName: sortOrder },
            { createdAt: sortOrder },
            { updatedAt: sortOrder },
            { email: sortOrder },
          );
        } else if (sortBy === "familyName") {
          // Family name -> given name -> created -> updated -> email
          orderBy.push(
            { givenName: sortOrder },
            { createdAt: sortOrder },
            { updatedAt: sortOrder },
            { email: sortOrder },
          );
        } else if (sortBy === "email") {
          // Email -> given name -> family name -> created -> updated
          orderBy.push(
            { givenName: sortOrder },
            { familyName: sortOrder },
            { createdAt: sortOrder },
            { updatedAt: sortOrder },
          );
        } else if (sortBy === "createdAt") {
          // Created -> given name -> family name -> updated -> email
          orderBy.push(
            { givenName: sortOrder },
            { familyName: sortOrder },
            { updatedAt: sortOrder },
            { email: sortOrder },
          );
        } else if (sortBy === "updatedAt") {
          // Updated -> given name -> family name -> created -> email
          orderBy.push(
            { givenName: sortOrder },
            { familyName: sortOrder },
            { createdAt: sortOrder },
            { email: sortOrder },
          );
        } else if (sortBy === "residenceCountry") {
          // Residence country -> given name -> family name -> created -> email
          orderBy.push(
            { givenName: sortOrder },
            { familyName: sortOrder },
            { createdAt: sortOrder },
            { email: sortOrder },
          );
        } else if (sortBy === "forumJoinDate") {
          // Forum join date -> given name -> family name -> created -> email
          orderBy.push(
            { givenName: sortOrder },
            { familyName: sortOrder },
            { createdAt: sortOrder },
            { email: sortOrder },
          );
        } else if (sortBy === "status") {
          // Status -> given name -> family name -> created -> email
          orderBy.push(
            { givenName: sortOrder },
            { familyName: sortOrder },
            { createdAt: sortOrder },
            { email: sortOrder },
          );
        }
      } else {
        // Default sorting if invalid field
        orderBy = [{ createdAt: "desc" }];
      }
    } else {
      // Default sorting when no sortBy is specified
      orderBy = [{ createdAt: "desc" }];
    }

    // Get total count for pagination
    const totalCount = await prisma.user.count({ where });

    // Get stats counts (always from entire database, not filtered)
    const [activeCount, adminCount] = await Promise.all([
      prisma.user.count({ where: { status: "ACTIVE" } }),
      prisma.user.count({ where: { role: "ADMIN" } }),
    ]);

    // Fetch users with filters and pagination (password excluded via select)
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        role: true,
        status: true,
        givenName: true,
        familyName: true,
        birthYear: true,
        gender: true,
        bwbForumNickname: true,
        createdAt: true,
        updatedAt: true,
        emailVerified: true,
        birthCountry: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        residenceCountry: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        residenceRegion: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
      orderBy,
      skip,
      take: limit,
    });

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: skip + users.length < totalCount,
      },
      stats: {
        activeCount,
        adminCount,
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Middleware ensures user is authenticated and is ADMIN
    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      username,
      // Legacy support for old form
      displayName,
      password: providedPassword,
      role,
    } = body;

    // Support both new minimal form and legacy form
    const isMinimalForm = firstName && lastName;
    let generatedPassword: string | null = null;

    // Validate required fields based on form type
    if (isMinimalForm) {
      if (!firstName || !lastName || !email || !username) {
        return NextResponse.json(
          {
            error:
              "Missing required fields (givenName, familyName, email, username)",
          },
          { status: 400 },
        );
      }
    } else {
      // Legacy form validation
      if (!username || !displayName || !providedPassword || !email) {
        return NextResponse.json(
          {
            error:
              "Missing required fields (username, displayName, password, email)",
          },
          { status: 400 },
        );
      }
    }

    // Validate email and trim whitespace
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const trimmedEmail = email.trim();
    if (!emailRegex.test(trimmedEmail)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 },
      );
    }

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email: trimmedEmail.toLowerCase() },
    });

    if (existingEmail) {
      return NextResponse.json(
        { error: "Email address is already registered" },
        { status: 400 },
      );
    }

    // Validate username (alphanumeric, underscore, hyphen, period, 3-30 chars)
    if (!/^[a-zA-Z0-9._-]{3,30}$/.test(username)) {
      return NextResponse.json(
        {
          error:
            "Username must be 3-30 characters (letters, numbers, underscore, hyphen, period only)",
        },
        { status: 400 },
      );
    }

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Username already exists" },
        { status: 400 },
      );
    }

    // Generate or validate password
    let passwordToHash: string;
    if (isMinimalForm) {
      // Generate random password for minimal form
      const crypto = await import("crypto");
      generatedPassword = crypto.randomBytes(12).toString("base64");
      passwordToHash = generatedPassword;
    } else {
      // Validate provided password for legacy form
      if (providedPassword.length < 8) {
        return NextResponse.json(
          { error: "Password must be at least 8 characters long" },
          { status: 400 },
        );
      }

      if (!/(?=.*[a-zA-Z])(?=.*[0-9])/.test(providedPassword)) {
        return NextResponse.json(
          {
            error: "Password must contain at least one letter and one number",
          },
          { status: 400 },
        );
      }
      passwordToHash = providedPassword;
    }

    // Validate role (default to USER for minimal form)
    const userRole = isMinimalForm ? "USER" : role || "USER";
    if (!["USER", "ADMIN"].includes(userRole)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(passwordToHash, 12);

    // Build display name and trim names
    const finalDisplayName = isMinimalForm
      ? `${firstName.trim()} ${lastName.trim()}`
      : displayName;

    // Create user with email already verified (admin-created users don't need email verification)
    const user = await prisma.user.create({
      data: {
        username: username.toLowerCase(),
        displayName: finalDisplayName,
        givenName: isMinimalForm ? firstName.trim() : undefined,
        familyName: isMinimalForm ? lastName.trim() : undefined,
        email: trimmedEmail.toLowerCase(),
        password: hashedPassword,
        role: userRole,
        emailVerified: new Date(), // Auto-verify admin-created users
        emailVerificationToken: null,
        emailVerificationExpires: null,
        emailVerificationResendCount: 0,
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        emailVerified: true,
        role: true,
        createdAt: true,
        // Never return password
        password: false,
      },
    });

    // Create default participation records for all active HOFs and Years
    const [activeHofs, activeYears] = await Promise.all([
      prisma.hallOfFame.findMany({
        where: { isActive: true },
        select: { id: true },
      }),
      prisma.year.findMany({
        where: { isActive: true },
        select: { id: true },
      }),
    ]);

    // Create HOF participation records (all enabled by default)
    if (activeHofs.length > 0) {
      await prisma.userHofParticipation.createMany({
        data: activeHofs.map((hof) => ({
          userId: user.id,
          hofId: hof.id,
          enabled: true,
        })),
      });
    }

    // Create Year participation records (all enabled, no country override)
    if (activeYears.length > 0) {
      await prisma.userYearParticipation.createMany({
        data: activeYears.map((year) => ({
          userId: user.id,
          yearId: year.id,
          enabled: true,
          countryId: null, // Use user's residence country by default
        })),
      });
    }

    // Log admin user creation
    const session = await getSession();
    if (session) {
      await logAdminAction(
        EventType.ADMIN_USER_CREATE,
        EventStatus.SUCCESS,
        request.headers,
        session.user.id,
        {
          resourceType: "User",
          resourceId: user.id,
          actionDetails: {
            username: user.username,
            email: user.email,
            role: user.role,
          },
        },
      );
    }

    // Return user data at top-level for contract compatibility, while keeping
    // legacy `data` wrapper for existing clients.
    const response: any = {
      ...user,
      data: user,
      message: "User created successfully. Email is verified and ready to use.",
    };

    if (generatedPassword) {
      response.generatedPassword = generatedPassword;
    }

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);

    // Log failed user creation
    try {
      const session = await getSession();
      if (session) {
        await logAdminAction(
          EventType.ADMIN_USER_CREATE,
          EventStatus.FAILURE,
          request.headers,
          session.user.id,
          {
            errorMessage: "Failed to create user",
          },
        );
      }
    } catch (logError) {
      console.error("Failed to log admin action:", logError);
    }

    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 },
    );
  }
}
