# 📎 Change Request Attachment Storage Strategy

## Overview

Change request attachments (images, PDFs, documents) are stored in a **persistent location outside the application directory** to ensure they survive deployments and updates.

---

## Storage Locations

### Development

```
public/uploads/change-requests/
```

- Files stored in the local `public` directory
- Accessible via `/uploads/change-requests/` URL path
- Automatically served by Next.js static file server

### Production

```
/srv/bwb/uploads/change-requests/
```

- Files stored **outside** the application directory (`/srv/bwb/app/`)
- **Persists across deployments** - not affected by app updates or rollbacks
- Served by Nginx directly for better performance
- Accessible via `/uploads/change-requests/` URL path

---

## Why This Approach?

### ✅ Advantages

1. **Deployment Safety**
   - Uploads are NOT deleted when deploying new application versions
   - The `rsync --delete` flag in deployment script excludes uploads
   - Application can be rolled back without losing attachments

2. **Performance**
   - Nginx serves static files directly (no Node.js overhead)
   - Better caching with proper `Cache-Control` headers
   - Reduced load on the application server

3. **Data Integrity**
   - Attachments remain available even if app is reinstalled
   - Database references (`path` field) remain valid
   - Easy to backup separately from application

4. **Scalability**
   - Can easily move to S3, CloudFlare R2, or other object storage
   - Upload directory can be mounted on separate volume/disk
   - Can implement CDN for global distribution

---

## Directory Structure

```
/srv/bwb/
├── app/                          # Application code (redeployed on updates)
│   ├── .next/
│   ├── node_modules/
│   ├── prisma/
│   │   └── dev.db              # SQLite database
│   └── ...
├── uploads/                      # PERSISTENT STORAGE (never deleted)
│   └── change-requests/
│       ├── 123e4567-e89b-12d3-a456-426614174000.jpg
│       ├── 789f0123-e45c-67d8-b901-234567890abc.pdf
│       └── ...
├── backups/                      # Application backups
│   └── backup-20251021-143022/
└── logs/                         # PM2 and application logs
    └── bwb-climbing.log
```

---

## Nginx Configuration

The deployment script automatically adds this location block to Nginx:

```nginx
# Serve uploaded files from persistent storage
location /uploads {
    alias /srv/bwb/uploads;
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

### What This Does:

- Maps URL `/uploads/*` to filesystem `/srv/bwb/uploads/*`
- Sets 30-day cache expiration for browsers
- Marks files as immutable (can be cached aggressively)
- Nginx serves files directly (bypasses Node.js/Next.js)

---

## File Upload Process

### 1. Client Uploads File

```typescript
const formData = new FormData();
formData.append("file", fileInput.files[0]);

await fetch(`/api/change-requests/${crId}/attachments`, {
  method: "POST",
  body: formData,
});
```

### 2. Server Processes Upload

```typescript
// Generate unique filename with UUID
const filename = `${uuidv4()}${fileExtension}`;

// Determine storage location based on environment
const uploadsBaseDir =
  process.env.NODE_ENV === "production"
    ? "/srv/bwb/uploads/change-requests" // Persistent location
    : path.join(process.cwd(), "public", "uploads", "change-requests");

// Write to disk
await writeFile(path.join(uploadsBaseDir, filename), buffer);

// Save metadata to database
await prisma.changeRequestAttachment.create({
  data: {
    filename, // UUID filename
    originalName: file.name, // Original filename
    path: `/uploads/change-requests/${filename}`, // URL path
    mimeType: file.type,
    size: file.size,
  },
});
```

### 3. Client Accesses File

```html
<!-- Image -->
<img src="/uploads/change-requests/123e4567-e89b-12d3-a456-426614174000.jpg" />

<!-- Download link -->
<a href="/uploads/change-requests/789f0123-e45c-67d8-b901-234567890abc.pdf" download>
  Download Report.pdf
</a>
```

---

## File Validation

### Allowed File Types

- Images: `image/jpeg`, `image/png`, `image/gif`, `image/webp`
- Documents: `application/pdf`, `text/plain`
- Word docs: `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

### Size Limit

- Maximum: **10 MB** per file

### Security

- Filename is replaced with UUID to prevent path traversal attacks
- MIME type validation on upload
- Admin-only access for uploading/deleting attachments

---

## Backup Strategy

### Database Backup (includes attachment metadata)

```bash
ssh root@example.com 'cp /srv/bwb/app/prisma/dev.db /srv/bwb/backups/db-$(date +%Y%m%d-%H%M%S).db'
```

### Uploads Backup (actual files)

```bash
# Full backup
ssh root@example.com 'tar -czf /srv/bwb/backups/uploads-$(date +%Y%m%d-%H%M%S).tar.gz /srv/bwb/uploads'

# Or sync to remote location
rsync -avz root@example.com:/srv/bwb/uploads/ ./backups/uploads/
```

### Restoration

```bash
# Restore database
scp db-backup.db root@example.com:/srv/bwb/app/prisma/dev.db

# Restore uploads
ssh root@example.com 'tar -xzf /srv/bwb/backups/uploads-20251021-143022.tar.gz -C /'
```

---

## Monitoring & Maintenance

### Check Upload Directory Size

```bash
ssh root@example.com 'du -sh /srv/bwb/uploads'
```

### List Recent Uploads

```bash
ssh root@example.com 'ls -lht /srv/bwb/uploads/change-requests | head -20'
```

### Find Large Files

```bash
ssh root@example.com 'find /srv/bwb/uploads -type f -size +5M -exec ls -lh {} \;'
```

### Clean Up Orphaned Files

If an attachment is deleted from the database but file remains on disk:

```bash
# This should be done carefully - consider writing a cleanup script
# that cross-references database records with filesystem
```

---

## Alternative Storage Solutions

### Future Enhancements

1. **S3-Compatible Object Storage** (Recommended for production)
   - AWS S3, DigitalOcean Spaces, CloudFlare R2
   - Unlimited scalability
   - Geographic distribution
   - Automatic backups

2. **Separate Volume/Disk**
   - Mount `/srv/bwb/uploads` as separate disk
   - Easy to expand storage
   - Better I/O isolation

3. **Network File System (NFS)**
   - Shared storage across multiple servers
   - Required for horizontal scaling

4. **CDN Integration**
   - CloudFlare, AWS CloudFront
   - Global content delivery
   - Reduced bandwidth costs

---

## Migration to Object Storage (Future)

If you decide to move to S3/R2 in the future:

```typescript
// Example with AWS S3
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// Upload to S3 instead of local filesystem
await s3.send(
  new PutObjectCommand({
    Bucket: "[BUCKET NAME]",
    Key: `change-requests/${filename}`,
    Body: buffer,
    ContentType: file.type,
  })
);

// Generate public URL
const url = `[BUCKET URL]/change-requests/${filename}`;
```

---

## Summary

✅ **Current Setup:**

- Development: `public/uploads/change-requests/`
- Production: `/srv/bwb/uploads/change-requests/` (persistent, separate from app)
- Served by Nginx with aggressive caching
- Survives deployments and rollbacks
- Easy to backup and restore

✅ **Best Practices:**

- Regular backups of both database and upload directory
- Monitor disk space usage
- Consider object storage for long-term scalability
- Implement cleanup for orphaned files

📊 **Storage Estimates:**

- Average image: 2-5 MB
- Average PDF: 500 KB - 2 MB
- 1000 attachments ≈ 2-5 GB
- Recommend monitoring when reaching 50% disk capacity

---

**Last Updated:** October 21, 2025  
**Version:** 1.0
