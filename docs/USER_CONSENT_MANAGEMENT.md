# User Consent Management System

## Overview

This document describes the comprehensive user consent management system implemented in the BwB (Baggers Without Borders) application. The system provides dynamic, flexible management of user consents with full attachment support.

## Features

✅ **Dynamic Consent Types** - Admins can create, update, and manage consent types
✅ **Status Management** - Consent types can be ACTIVE or INACTIVE
✅ **Per-User Configuration** - Each consent can be required or optional on a per-user basis
✅ **Comprehensive Tracking** - Track date given, consent method, and notes
✅ **Attachment Support** - Upload PDF and image files for consent documentation
✅ **Flexible Consent Methods** - Web, Email, Paper, or Other
✅ **Full CRUD API** - Complete REST API for all consent operations
✅ **Admin Controls** - Full administrative control over consent management
✅ **User View Access** - Users can view their own consent records

## Database Schema

### ConsentType

Master table of available consent types:

- `id` - Unique identifier
- `title` - Consent name (e.g., "PR Hall Consent")
- `description` - Detailed explanation of the consent
- `status` - "ACTIVE" or "INACTIVE"
- `dateIntroduced` - When this consent was first introduced
- `createdAt`, `updatedAt` - Audit timestamps

### UserConsent

Individual user consent records:

- `id` - Unique identifier
- `userId` - Foreign key to User
- `consentTypeId` - Foreign key to ConsentType
- `dateGiven` - When the user gave consent (nullable)
- `consentMethod` - How consent was obtained: "WEB", "EMAIL", "PAPER", "OTHER" (nullable)
- `note` - Additional notes about the consent (nullable)
- `isRequired` - Whether this consent is required for this specific user
- `createdAt`, `updatedAt` - Audit timestamps
- **Unique constraint**: (userId, consentTypeId)

### UserConsentAttachment

Files associated with consent records:

- `id` - Unique identifier
- `userConsentId` - Foreign key to UserConsent
- `filename` - Generated unique filename (UUID + extension)
- `originalName` - Original uploaded filename
- `mimeType` - File MIME type
- `size` - File size in bytes
- `path` - Relative path to the file
- `createdAt` - Upload timestamp

## File Storage

Attachments are stored in the filesystem:

- **Development**: `public/uploads/user-consents/`
- **Production**: `/srv/bwb/uploads/user-consents/`

Supported file types:

- **Images**: JPEG, JPG, PNG, GIF, WebP
- **Documents**: PDF

Max file size: 10MB

## API Endpoints

### Consent Types

#### List All Consent Types

```
GET /api/consent-types
Query params:
  - status (optional): Filter by "ACTIVE" or "INACTIVE"
Response: { consentTypes: ConsentType[] }
Auth: Any authenticated user
```

#### Get Single Consent Type

```
GET /api/consent-types/[id]
Response: ConsentType with user consent count
Auth: Any authenticated user
```

#### Create Consent Type

```
POST /api/consent-types
Body: {
  title: string (required)
  description: string (required)
  status?: string (default: "ACTIVE")
  dateIntroduced?: string (default: current date)
}
Response: Created ConsentType
Auth: Admin only
```

#### Update Consent Type

```
PATCH /api/consent-types/[id]
Body: {
  title?: string
  description?: string
  status?: string
  dateIntroduced?: string
}
Response: Updated ConsentType
Auth: Admin only
```

#### Delete Consent Type

```
DELETE /api/consent-types/[id]
Response: { message: string }
Auth: Admin only
Note: Cannot delete if user consents exist (set to INACTIVE instead)
```

### User Consents

#### List User Consents

```
GET /api/users/[id]/consents
Response: { consents: UserConsent[] }
Auth: User can view own consents, admin can view all
```

#### Create/Update User Consent

```
POST /api/users/[id]/consents
Body: {
  consentTypeId: string (required)
  dateGiven?: string
  consentMethod?: "WEB" | "EMAIL" | "PAPER" | "OTHER"
  note?: string
  isRequired?: boolean
}
Response: UserConsent
Auth: Admin only
Note: Upserts - creates if doesn't exist, updates if it does
```

#### Get Single User Consent

```
GET /api/users/[userId]/consents/[consentId]
Response: UserConsent with attachments
Auth: User can view own consents, admin can view all
```

#### Update User Consent

```
PATCH /api/users/[userId]/consents/[consentId]
Body: {
  dateGiven?: string | null
  consentMethod?: string | null
  note?: string | null
  isRequired?: boolean
}
Response: Updated UserConsent
Auth: Admin only
```

#### Delete User Consent

```
DELETE /api/users/[userId]/consents/[consentId]
Response: { message: string }
Auth: Admin only
```

### Consent Attachments

#### Upload Attachment

```
POST /api/users/[userId]/consents/[consentId]/attachments
Body: FormData with 'file' field
Response: UserConsentAttachment
Auth: Admin only
```

#### List Attachments

```
GET /api/users/[userId]/consents/[consentId]/attachments
Response: { attachments: UserConsentAttachment[] }
Auth: User can view own attachments, admin can view all
```

#### Delete Attachment

```
DELETE /api/users/[userId]/consents/[consentId]/attachments/[attachmentId]
Response: { message: string }
Auth: Admin only
```

## UI Components

### UserConsents Component

Located: `app/components/features/UserConsents.tsx`

**Features:**

- Displays all consent types for a user
- Shows consent status, description, and introduction date
- Edit mode for admin users
- Date picker for consent date
- Dropdown for consent method
- Text area for notes
- Required checkbox toggle
- File upload with drag-and-drop
- Attachment list with preview icons
- Download and delete attachment actions
- Visual indicators for required/inactive consents
- Warning for missing required consents

**Props:**

- `userId: string` - The user ID
- `isEditing: boolean` - Whether in edit mode

**Usage:**

```tsx
<UserConsents userId={user.id} isEditing={isAdminEditing} />
```

### Integration in UserProfile

The UserConsents component is integrated into the UserProfile page, replacing the old hardcoded consent date fields. It appears in a dedicated "Privacy Consents" card section.

## Initial Setup

Four default consent types are seeded:

1. **PR Hall Consent**
   - Introduced: October 21, 2025
   - Consent to include user in the PR Hall (Prominence Rankings Hall of Fame)

2. **P-Index Consent**
   - Introduced: October 21, 2025
   - Consent to calculate and display user's P-Index (Prominence Index score)

3. **Info Retention Consent**
   - Introduced: October 21, 2025
   - Consent to retain and store user information for platform functionality

4. **Publish Totals Consent**
   - Introduced: October 25, 2025
   - Consent to publish user's climbing totals and statistics publicly

All consent types are initially set to ACTIVE status and are required for all users by default.

## Admin Workflow

### Adding a New Consent Type

1. Admin creates new consent type via API
2. System automatically creates UserConsent records for all existing users
3. Admin can set whether it's required per user
4. Users are notified of new consent requirements

### Managing User Consents

1. Navigate to user profile
2. Click "Edit" button
3. Scroll to "Privacy Consents" section
4. For each consent:
   - Set date when consent was given
   - Select consent method (Web, Email, Paper, Other)
   - Add any relevant notes
   - Toggle required/optional status
   - Upload supporting documents (signed forms, email screenshots, etc.)
5. Click "Save Changes" for each consent

### Deactivating a Consent

1. Change consent type status to "INACTIVE"
2. Existing user consent records remain but consent is marked as inactive
3. No new users will receive this consent requirement

## User Experience

### View Mode

Users and admins can view:

- Consent title and description
- When consent was introduced
- Date consent was given (or "Not provided")
- Method used to provide consent
- Any notes about the consent
- Attached documents
- Required/optional status
- Warning indicators for missing required consents

### Edit Mode (Admin Only)

Admins can:

- Update all consent information
- Upload supporting documents
- Download/delete attachments
- Toggle required status per user
- Add detailed notes

## Migration from Old System

The old system had four hardcoded DateTime fields on the User model:

- `prHallConsent`
- `pIndexConsent`
- `infoRetentionConsent`
- `publishTotalsConsent`

These fields are preserved for backward compatibility but are no longer used in the UI. The new system provides:

- Dynamic consent management
- Attachment support
- Detailed tracking
- Flexible configuration

### Future Migration Steps

To fully migrate old data:

1. Create a migration script to copy old consent dates to UserConsent records
2. Update any external systems that reference the old fields
3. Remove the old fields from the schema in a future release

## Security Considerations

1. **Access Control**: Only admins can create/update/delete consent types and user consents
2. **User Privacy**: Users can only view their own consent records
3. **File Validation**: Strict validation on file types and sizes
4. **Unique Filenames**: UUID-based filenames prevent collisions and information leakage
5. **Cascade Deletion**: Deleting a consent automatically removes all attachments
6. **Audit Trail**: CreatedAt/UpdatedAt timestamps on all records

## Future Enhancements

Potential improvements:

- Email notifications when new consents are added
- Bulk consent management for multiple users
- Consent templates
- Digital signature support
- Consent expiration dates and renewal reminders
- Export consent records to PDF
- Consent history/versioning
- Multi-language support for consent descriptions
- Consent withdrawal tracking
- Integration with external consent management platforms

## Testing Checklist

- [x] Create new consent type (admin)
- [ ] Update consent type status
- [ ] View user consents
- [ ] Update user consent details
- [ ] Upload attachment to consent
- [ ] Download attachment
- [ ] Delete attachment
- [ ] Toggle required/optional status
- [ ] Test access controls (user vs admin)
- [ ] Test file type validation
- [ ] Test file size limits
- [ ] Test with multiple users
- [ ] Test with inactive consent types
- [ ] Test missing required consent warnings

## Support

For questions or issues:

1. Check the code documentation in the respective files
2. Review the API endpoint implementations
3. Test with the seeded demo users (`demo-admin`, `demo-user`, `demo-member`)
4. Check the Prisma schema for data structure

## Version History

- **v1.0** (October 24, 2025) - Initial implementation
  - Dynamic consent type management
  - User consent tracking with attachments
  - Full CRUD APIs
  - UI components integrated into UserProfile
  - Four default consent types seeded
