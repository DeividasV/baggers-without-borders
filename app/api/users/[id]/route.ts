import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/src/lib/api-auth";
import { prisma } from "@/src/lib/prisma";
import { logAdminAction, logUserAction } from "@/src/lib/auditLog";
import { EventType, EventStatus } from "@prisma/client";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Middleware ensures user is authenticated and is ADMIN
    const session = await getSession();
    const { id: userId } = await params;

    // Don't allow deleting yourself
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 },
      );
    }

    // Fetch user details before deletion for logging
    const userToDelete = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, username: true, role: true },
    });

    if (!userToDelete) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Don't allow deleting ADMIN or CLERK users
    if (userToDelete.role === "ADMIN" || userToDelete.role === "CLERK") {
      return NextResponse.json(
        {
          error: `Cannot delete user: User has ${userToDelete.role} role. Users with ADMIN or CLERK roles cannot be deleted for system security.`,
        },
        { status: 400 },
      );
    }

    // Check if user is assigned as HoF Meister in any HoF year configuration
    const hofMeisterAssignments = await prisma.hofYearConfig.findMany({
      where: { hofmeisterId: userId },
      include: {
        hof: { select: { title: true } },
        year: { select: { title: true } },
      },
    });

    if (hofMeisterAssignments.length > 0) {
      const assignments = hofMeisterAssignments
        .map((config) => `${config.hof.title} (${config.year.title})`)
        .join(", ");
      return NextResponse.json(
        {
          error: `Cannot delete member: They are assigned as HoF Meister for ${hofMeisterAssignments.length} HoF year configuration(s): ${assignments}. Please reassign the HoF Meister role first.`,
        },
        { status: 400 },
      );
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    // Log admin user deletion
    await logAdminAction(
      EventType.ADMIN_USER_DELETE,
      EventStatus.SUCCESS,
      request.headers,
      session.user.id,
      {
        resourceType: "User",
        resourceId: userId,
        actionDetails: {
          deletedUser: {
            email: userToDelete.email,
            username: userToDelete.username,
            role: userToDelete.role,
          },
        },
      },
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);

    // Log failed deletion
    try {
      const session = await getSession();
      const { id: userId } = await params;
      if (session) {
        await logAdminAction(
          EventType.ADMIN_USER_DELETE,
          EventStatus.FAILURE,
          request.headers,
          session.user.id,
          {
            resourceType: "User",
            resourceId: userId,
            errorMessage: "Failed to delete user",
          },
        );
      }
    } catch (logError) {
      console.error("Failed to log admin action:", logError);
    }

    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 },
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Middleware ensures user is authenticated
    const session = await getSession();
    const { id: userId } = await params;

    // Only allow admins or the user themselves to view profile
    if (session.user.role !== "ADMIN" && session.user.id !== userId) {
      return NextResponse.json(
        { error: "Forbidden: You can only view your own profile" },
        { status: 403 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
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
        birthCountry: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        userInterests: {
          select: {
            interestId: true,
            interest: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        userConsents: {
          select: {
            id: true,
            consentTypeId: true,
            dateGiven: true,
            consentMethod: true,
            isRequired: true,
            consentType: {
              select: {
                id: true,
                title: true,
                status: true,
              },
            },
          },
          orderBy: {
            consentType: {
              title: "asc",
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Middleware ensures user is authenticated
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (await params).id;

    // Allow both admins and users editing their own profile
    const isAdmin = session.user.role === "ADMIN";
    const isOwnProfile = session.user.id === userId;

    if (!isAdmin && !isOwnProfile) {
      return NextResponse.json(
        { error: "Forbidden: You can only edit your own profile" },
        { status: 403 },
      );
    }

    let data;
    try {
      data = await request.json();
    } catch (e) {
      console.error("Failed to parse JSON:", e);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 },
      );
    }

    // Users can only edit certain fields - restrict role and status changes to admins
    if (!isAdmin) {
      if (data.role !== undefined || data.status !== undefined) {
        return NextResponse.json(
          {
            error:
              "Forbidden: You cannot change role or status on your own profile",
          },
          { status: 403 },
        );
      }

      // Block non-admins from changing username
      if (data.username !== undefined) {
        return NextResponse.json(
          {
            error: "Forbidden: Only admins can change usernames",
          },
          { status: 403 },
        );
      }
    }

    // Validate username if provided (admin only)
    if (data.username !== undefined && data.username) {
      // Validate username format (match creation rules: letters/numbers plus ., _, -)
      if (
        data.username.length < 3 ||
        data.username.length > 30 ||
        !/^[a-zA-Z0-9._-]+$/.test(data.username)
      ) {
        return NextResponse.json(
          {
            error:
              "Username must be 3-30 characters (letters, numbers, underscore, hyphen, period only)",
          },
          { status: 400 },
        );
      }

      // Check for duplicate username (exclude current user)
      const existingUsername = await prisma.user.findUnique({
        where: { username: data.username.toLowerCase() },
      });

      if (existingUsername && existingUsername.id !== userId) {
        return NextResponse.json(
          { error: "Username is already taken" },
          { status: 400 },
        );
      }
    }

    // Validate role if provided (admin only)
    if (data.role !== undefined && !["USER", "ADMIN"].includes(data.role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Validate status if provided (admin only)
    if (
      data.status !== undefined &&
      !["NEW", "ACTIVE", "INACTIVE", "DECEASED", "ARCHIVED"].includes(
        data.status,
      )
    ) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Validate gender if provided
    if (
      data.gender !== undefined &&
      data.gender &&
      !["M", "F", "O", "N"].includes(data.gender)
    ) {
      return NextResponse.json({ error: "Invalid gender" }, { status: 400 });
    }

    // Validate birth year if provided
    if (
      data.birthYear !== undefined &&
      data.birthYear !== null &&
      data.birthYear !== ""
    ) {
      const year = parseInt(data.birthYear);
      const currentYear = new Date().getFullYear();
      if (isNaN(year) || year < 1900 || year > currentYear) {
        return NextResponse.json(
          {
            error: "Invalid birth year (must be between 1900 and current year)",
          },
          { status: 400 },
        );
      }
    }

    // Validate retired year if provided (admin only)
    if (
      data.retiredYear !== undefined &&
      data.retiredYear !== null &&
      data.retiredYear !== ""
    ) {
      const year = parseInt(data.retiredYear);
      const currentYear = new Date().getFullYear();
      if (isNaN(year) || year < 1900 || year > currentYear) {
        return NextResponse.json(
          {
            error:
              "Invalid retired year (must be between 1900 and current year)",
          },
          { status: 400 },
        );
      }
    }

    // Validate deceased year if provided (admin only)
    if (
      data.deceasedYear !== undefined &&
      data.deceasedYear !== null &&
      data.deceasedYear !== ""
    ) {
      const year = parseInt(data.deceasedYear);
      const currentYear = new Date().getFullYear();
      if (isNaN(year) || year < 1900 || year > currentYear) {
        return NextResponse.json(
          {
            error:
              "Invalid deceased year (must be between 1900 and current year)",
          },
          { status: 400 },
        );
      }
    }

    // Email is required by schema; allow leaving it unchanged by omitting it,
    // but reject attempts to explicitly clear it.
    if (
      data.email !== undefined &&
      (data.email === null || data.email === "")
    ) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Validate email format if provided
    if (data.email !== undefined && data.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        return NextResponse.json(
          { error: "Invalid email format" },
          { status: 400 },
        );
      }

      // Check for duplicate email (exclude current user)
      const existingEmail = await prisma.user.findUnique({
        where: { email: data.email.toLowerCase() },
      });

      if (existingEmail && existingEmail.id !== userId) {
        return NextResponse.json(
          { error: "Email address is already in use" },
          { status: 400 },
        );
      }
    }

    console.log("PATCH /api/users/[id] - Received data:", {
      residenceCountry: data.residenceCountry,
      residenceRegion: data.residenceRegion,
      birthCountry: data.birthCountry,
    });

    // Build update data object with only provided fields
    const updateData: any = {};

    if (data.role !== undefined) updateData.role = data.role;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.username !== undefined)
      updateData.username = data.username ? data.username.toLowerCase() : null;
    if (data.displayName !== undefined) {
      if (!data.displayName || data.displayName.trim().length === 0) {
        return NextResponse.json(
          { error: "Display name cannot be empty" },
          { status: 400 },
        );
      }
      if (data.displayName.trim().length > 255) {
        return NextResponse.json(
          { error: "Display name cannot exceed 255 characters" },
          { status: 400 },
        );
      }
      updateData.displayName = data.displayName.trim();
    }
    if (data.givenName !== undefined)
      updateData.givenName = data.givenName || null;
    if (data.familyName !== undefined)
      updateData.familyName = data.familyName || null;

    // Handle country/region relations - now accepting IDs directly
    if (data.residenceCountry !== undefined) {
      if (data.residenceCountry) {
        updateData.residenceCountry = {
          connect: { id: data.residenceCountry },
        };
      } else {
        updateData.residenceCountry = { disconnect: true };
      }
    }

    if (data.residenceRegion !== undefined) {
      if (data.residenceRegion) {
        updateData.residenceRegion = { connect: { id: data.residenceRegion } };
      } else {
        updateData.residenceRegion = { disconnect: true };
      }
    }

    if (data.birthCountry !== undefined) {
      if (data.birthCountry) {
        updateData.birthCountry = { connect: { id: data.birthCountry } };
      } else {
        updateData.birthCountry = { disconnect: true };
      }
    }

    if (data.birthYear !== undefined) {
      updateData.birthYear =
        data.birthYear === "" || data.birthYear === null
          ? null
          : parseInt(data.birthYear);
    }
    if (data.gender !== undefined) updateData.gender = data.gender || null;
    if (data.email !== undefined)
      updateData.email = data.email ? data.email.toLowerCase() : null;
    if (data.prHallConsent !== undefined)
      updateData.prHallConsent = data.prHallConsent
        ? new Date(data.prHallConsent)
        : null;
    if (data.pIndexConsent !== undefined)
      updateData.pIndexConsent = data.pIndexConsent
        ? new Date(data.pIndexConsent)
        : null;
    if (data.infoRetentionConsent !== undefined)
      updateData.infoRetentionConsent = data.infoRetentionConsent
        ? new Date(data.infoRetentionConsent)
        : null;
    if (data.publishTotalsConsent !== undefined)
      updateData.publishTotalsConsent = data.publishTotalsConsent
        ? new Date(data.publishTotalsConsent)
        : null;
    if (data.peakbaggerId !== undefined)
      updateData.peakbaggerId = data.peakbaggerId || null;
    if (data.peakbaggerAllAscents !== undefined)
      updateData.peakbaggerAllAscents = data.peakbaggerAllAscents;
    if (data.bwbForumNickname !== undefined)
      updateData.bwbForumNickname = data.bwbForumNickname || null;
    if (data.hillBaggingId !== undefined)
      updateData.hillBaggingId = data.hillBaggingId || null;
    if (data.forumJoinDate !== undefined)
      updateData.forumJoinDate = data.forumJoinDate
        ? new Date(data.forumJoinDate)
        : null;

    // Handle retired year (admin only, convert to integer)
    if (data.retiredYear !== undefined) {
      if (isAdmin) {
        updateData.retiredYear =
          data.retiredYear === "" || data.retiredYear === null
            ? null
            : parseInt(data.retiredYear);
      }
    }

    // Handle deceased year (admin only, convert to integer)
    if (data.deceasedYear !== undefined) {
      if (isAdmin) {
        updateData.deceasedYear =
          data.deceasedYear === "" || data.deceasedYear === null
            ? null
            : parseInt(data.deceasedYear);
      }
    }

    // Handle notes field with length validation
    if (data.notes !== undefined) {
      if (data.notes && data.notes.length > 5000) {
        return NextResponse.json(
          { error: "Notes cannot exceed 5000 characters" },
          { status: 400 },
        );
      }
      updateData.notes = data.notes || "";
    }

    // Handle allowManualEntry field (admin only)
    if (data.allowManualEntry !== undefined) {
      if (isAdmin) {
        updateData.allowManualEntry = data.allowManualEntry;
      }
    }

    // Handle interests array - update userInterests relation
    let shouldUpdateInterests = false;
    let newInterestIds: string[] = [];
    if (data.interests !== undefined && Array.isArray(data.interests)) {
      shouldUpdateInterests = true;
      newInterestIds = data.interests;
    }

    console.log("PATCH /api/users/[id] - Update data:", {
      residenceCountry: updateData.residenceCountry,
      residenceRegion: updateData.residenceRegion,
      birthCountry: updateData.birthCountry,
    });

    // Fetch old user data before update for logging
    const oldUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        status: true,
      },
    });

    // Update user profile
    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
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
        birthCountry: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        userInterests: {
          select: {
            interestId: true,
            interest: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Update interests if needed
    if (shouldUpdateInterests) {
      // Delete all existing interests for this user
      await prisma.userInterest.deleteMany({
        where: { userId },
      });

      // Create new interest associations
      if (newInterestIds.length > 0) {
        await prisma.userInterest.createMany({
          data: newInterestIds.map((interestId) => ({
            userId,
            interestId,
          })),
        });
      }
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    console.log("PATCH /api/users/[id] - Updated user:", {
      residenceCountry: user.residenceCountry,
      residenceRegion: user.residenceRegion,
      birthCountry: user.birthCountry,
    });

    // Log admin user update (if admin is performing the update)
    if (isAdmin && oldUser) {
      // Log email change specifically
      if (updateData.email && oldUser.email !== updateData.email) {
        await logAdminAction(
          EventType.ADMIN_USER_EMAIL_CHANGE,
          EventStatus.SUCCESS,
          request.headers,
          session.user.id,
          {
            resourceType: "User",
            resourceId: userId,
            actionDetails: {
              targetUserId: userId,
              targetUsername: oldUser.username,
              targetEmail: oldUser.email,
              oldEmail: oldUser.email,
              newEmail: updateData.email,
            },
          },
        );
      }

      // Log username change specifically
      if (updateData.username && oldUser.username !== updateData.username) {
        await logAdminAction(
          EventType.ADMIN_USER_USERNAME_CHANGE,
          EventStatus.SUCCESS,
          request.headers,
          session.user.id,
          {
            resourceType: "User",
            resourceId: userId,
            actionDetails: {
              targetUserId: userId,
              targetEmail: oldUser.email,
              oldUsername: oldUser.username,
              newUsername: updateData.username,
            },
          },
        );
      }

      // Detect role escalation
      const roleChanged = updateData.role && oldUser.role !== updateData.role;
      const isRoleEscalation =
        roleChanged && oldUser.role === "USER" && updateData.role === "ADMIN";

      // Log the update
      await logAdminAction(
        EventType.ADMIN_USER_UPDATE,
        EventStatus.SUCCESS,
        request.headers,
        session.user.id,
        {
          resourceType: "User",
          resourceId: userId,
          actionDetails: {
            targetUser: oldUser.email,
            changes: {
              before: {
                role: oldUser.role,
                status: oldUser.status,
                email: oldUser.email,
              },
              after: {
                role: updateData.role || oldUser.role,
                status: updateData.status || oldUser.status,
                email: updateData.email || oldUser.email,
              },
            },
          },
        },
      );

      // Log separate event for role escalation
      if (isRoleEscalation) {
        await logAdminAction(
          EventType.USER_ROLE_ESCALATION,
          EventStatus.SUCCESS,
          request.headers,
          session.user.id,
          {
            resourceType: "User",
            resourceId: userId,
            actionDetails: {
              targetUser: oldUser.email,
              from: "USER",
              to: "ADMIN",
            },
          },
        );
      }
    } else if (isOwnProfile) {
      // Log user updating their own profile
      await logUserAction(
        EventType.USER_PROFILE_UPDATE,
        EventStatus.SUCCESS,
        request.headers,
        userId,
        {
          actionDetails: {
            fieldsUpdated: Object.keys(data),
          },
        },
      );
    }

    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error("Error updating user:", error);

    // Log failed update
    try {
      const session = await getSession();
      const userId = (await params).id;
      if (session) {
        if (session.user.role === "ADMIN") {
          await logAdminAction(
            EventType.ADMIN_USER_UPDATE,
            EventStatus.FAILURE,
            request.headers,
            session.user.id,
            {
              resourceType: "User",
              resourceId: userId,
              errorMessage: "Failed to update user",
            },
          );
        } else if (session.user.id === userId) {
          // Log user's failed profile update
          await logUserAction(
            EventType.USER_PROFILE_UPDATE,
            EventStatus.FAILURE,
            request.headers,
            userId,
            {
              errorMessage: "Failed to update profile",
            },
          );
        }
      }
    } catch (logError) {
      console.error("Failed to log action:", logError);
    }

    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 },
    );
  }
}
