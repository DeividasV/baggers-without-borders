# Journal System

The Journal subsystem is one self-referential content table rendered through four
public channels and administered from a dedicated set of `/admin/journal` screens.
Articles are markdown documents with an optional issue parent, a four-state
publication machine, a photo library, and an editor allow-list layered over the
global `ADMIN` role.

> **Verified:** 2026-09-16 against `main`. The three behaviours listed under
> [Verification](#verification) are read from the code rather than exercised at
> runtime.

## Overview

A `Journal` row is either **top-level** (`parentId` is `null`) or a **child
topic** of another row; that is the only hierarchy in the model. The `type`
column decides which public channel displays a published row.

| Channel    | Journal types            | Heading | Page                                   |
| ---------- | ------------------------ | ------- | -------------------------------------- |
| `/journal` | `journal`, `article`     | Journal | `app/(authenticated)/journal/page.tsx` |
| `/awards`  | `awards`, `achievements` | Awards  | `app/(authenticated)/awards/page.tsx`  |
| `/p-index` | `p-index`                | P-Index | `app/(authenticated)/p-index/page.tsx` |
| `/other`   | `other`                  | Other   | `app/(authenticated)/other/page.tsx`   |

The type groupings are declared in `src/types/journal.ts`
(`JOURNAL_JOURNAL_VIEW_TYPES`, `JOURNAL_AWARDS_VIEW_TYPES`). Each channel is a
listing page plus a `/[slug]` detail page; both are thin wrappers around the
shared components `JournalCollectionPage` and `JournalPublishedArticlePage`
(`app/components/features/journal/`).

Administrative surfaces:

| Page                       | Behaviour                                                                         |
| -------------------------- | --------------------------------------------------------------------------------- |
| `/admin/journal`           | `JournalManagement` — filterable, paginated list (20/page), expandable child rows |
| `/admin/journal/new`       | `JournalEditor` in create mode                                                    |
| `/admin/journal/[id]/edit` | `JournalEditor` in edit mode                                                      |
| `/admin/journal/issues`    | `IssuesManagement` — CRUD for top-level rows via `/api/journal/issues`            |
| `/admin/journal/settings`  | Redirects to `/admin/settings#journal-editors`                                    |
| `/journal/preview/[id]`    | Editor preview of any status, `noindex`, requires `ADMIN` plus editor membership  |

## Data model

Three models, all in `prisma/schema.prisma`.

| Model           | Table             | Fields that matter                                                                                                                                               | Relationships and `onDelete`                                                                                                                                                                                             |
| --------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Journal`       | `journals`        | `title`, `subtitle?`, `slug` (unique), `content` (markdown), `tableStyle` (`"legacy"`), `type` (`"journal"`), `status` (`"DRAFT"`), `childOrder`, `publishedAt?` | `parentId?` → self (`IssueChildren`), **SetNull**; `editorId?` → `User`, **SetNull**; `coverPhotoId?` → `JournalPhoto`, unique, **SetNull**; `createdById` → `User`, **Restrict**; `approvedById?` → `User`, **SetNull** |
| `JournalAuthor` | `journal_authors` | `journalId`, `userId?`, `name?`, `order`                                                                                                                         | `journalId` → `Journal`, **Cascade**; `userId?` → `User`, **SetNull**. Unique on `(journalId, userId)`                                                                                                                   |
| `JournalPhoto`  | `journal_photos`  | `filename`, `originalName`, `mimeType`, `size`, `title?`, `caption?`, `attribution?`, `order`, `journalId?`                                                      | `journalId?` → `Journal` (`ArticlePhotos`), **SetNull**; also reachable as `coverOfJournal`                                                                                                                              |

**Hierarchy.** `parentId` is a self-relation: `null` marks a top-level row
(presented as an _issue_), any other value marks a child article. The UI only
offers top-level rows as parents, but nothing in the schema or the generic
create/update handlers restricts depth — see [Known gaps](#known-gaps-and-sharp-edges).

Additional constraints:

- `coverPhotoId` is `@unique`, so a photo can cover at most one article.
- The `JournalAuthor` unique constraint covers member authors only; free-text
  rows (`userId = null`) are unrestricted.
- The `type` and `tableStyle` value sets are enforced in the API layer, not the
  database: types `journal`, `article`, `awards`, `achievements`, `p-index`,
  `other`; table styles `legacy`, `none`, `standard`, `compact`, `striped`,
  `minimal`, `highlight-header`, `responsive-cards`.

## Public rendering

The public pages read the database directly through Prisma in server components
rather than through the JSON API.

- **Listing** — `JournalCollectionPage` selects `status: "PUBLISHED"`,
  `parentId: null` and `type in includedTypes`, orders by `publishedAt`
  descending, and paginates at 12 per page.
- **Detail by slug** — `JournalPublishedArticlePage` looks up
  `{ slug, status: "PUBLISHED", type: { in: allowedTypes } }` and calls
  `notFound()` on a miss. Two consequences follow: an unpublished row is
  invisible even to a signed-in non-admin, and a published row is reachable only
  through the channel that owns its `type` — a `type: "other"` post 404s at
  `/journal/<slug>`.
- **Children** — the detail page loads children with `status: "PUBLISHED"`,
  ordered by `publishedAt` then `updatedAt` ascending, and `JournalArticleView`
  re-sorts them client-side by the same keys, pushing rows without a
  `publishedAt` to the end.
- **Preview** — `/journal/preview/[id]` loads any status, renders the same view
  component with `mode="preview"`, sets `robots: { index: false, follow: false }`,
  redirects anonymous visitors to `/login`, and calls `notFound()` for any
  signed-in user who is not both `ADMIN` and a journal editor.

`GET /api/journal/slug/[slug]` also reads a published row by slug, without the
`type` restriction. The four channel pages do not call it.

Rendering rules:

- Bodies are rendered by `MarkdownViewer` (`app/components/ui/MarkdownViewer.tsx`)
  using `react-markdown` with `remark-gfm`.
- Table styling comes from `tableStyle` through `getMarkdownTableStylePreset`
  (`src/lib/markdown-table-styles.ts`); an unknown value falls back to `legacy`.
- Column alignment and width hints are computed by
  `src/lib/markdown-table-alignment.ts`, which classifies columns
  (text/number/year) and reads `{w:…}` header directives.
- Markdown images whose `src` matches `/api/journal/photos/<id>` render as
  figures with the photo's caption and `attribution` credit, plus lightbox
  navigation against the article's photo list. An alt text `|left` or `|right`
  suffix produces a floated figure.

## Authoring workflow

**Create.** `POST /api/journal` requires a trimmed, non-empty `title`, accepts
`subtitle`, `content`, `parentId`, `editorId`, `type`, `tableStyle` and
`authors`, and always writes `status: "DRAFT"`. The slug is derived with
`uniqueSlug(title)`. Author entries may reference a member (`userId`) or carry a
free-text `name`; `order` defaults to the array index.

**Edit.** `PUT /api/journal/[id]` is a partial update — each field is applied only
when present in the body. It validates a non-empty `title`, the `type` and
`tableStyle` enums, that `authors` is an array, and that `publishedAt` parses.
When `authors` is supplied the handler deletes every existing `JournalAuthor` row
and recreates the set in one transaction: authors are replaced wholesale, never
merged.

**Slug.** `slugify` lowercases, strips non-word characters and collapses
separators to hyphens; `uniqueSlug` appends `-1`, `-2`, … until the value is
free, and accepts an `excludeId` so a row does not collide with itself
(`src/lib/journal-utils.ts`). On update the slug is recomputed only when the
`slug` key is present.

**Child topics.** The editor's child picker calls
`PUT /api/journal/[id]/children` with `{ childIds }`. The handler caps the list at
200, rejects a row as its own child, rejects duplicates, rejects any id that is an
ancestor of the parent (a cycle check that walks up to 50 levels), and rejects ids
that do not exist. It unlinks every current child not in the list (`parentId:
null`, `childOrder: 0`), links the selected rows, and assigns `childOrder` from
the index. The submitted order is **not** honoured — see
[Known gaps](#known-gaps-and-sharp-edges).

**Delete.** `DELETE /api/journal/[id]` exists but no component calls it; there is
no delete control in `JournalManagement` or `JournalEditor`.

## Status and lifecycle

Statuses are `DRAFT`, `PENDING_REVIEW`, `PUBLISHED`, `ARCHIVED`
(`src/types/journal.ts`). Transitions are applied by
`POST /api/journal/[id]/status`, which rejects anything absent from its
transition table.

| From             | To               | Required role  | Effects                                                                       |
| ---------------- | ---------------- | -------------- | ----------------------------------------------------------------------------- |
| `DRAFT`          | `PENDING_REVIEW` | any `ADMIN`    | —                                                                             |
| `PENDING_REVIEW` | `DRAFT`          | any `ADMIN`    | —                                                                             |
| `PENDING_REVIEW` | `PUBLISHED`      | journal editor | Requires `publishedAt` in the body or already on the row; sets `approvedById` |
| `PUBLISHED`      | `ARCHIVED`       | journal editor | —                                                                             |
| `ARCHIVED`       | `DRAFT`          | any `ADMIN`    | —                                                                             |

Every other pair is rejected with `400`. In particular `DRAFT → PUBLISHED` is not
allowed (submission for review is mandatory), `PUBLISHED → DRAFT` and
`PUBLISHED → PENDING_REVIEW` are not allowed (archive first), and
`ARCHIVED → PUBLISHED` is not allowed (restore to draft, then resubmit).

Related rules:

- Publishing requires a publish date: if the body omits `publishedAt` the handler
  keeps an existing value, and if neither exists it returns
  `400 publishedAt is required to publish`.
- `approvedById` is overwritten with the acting user on every publish, so
  re-publishing after an archive cycle replaces the recorded approver.
- An `ADMIN` who is not a journal editor can move a draft into review and back,
  but cannot publish or archive.

**Delete rules.** `DELETE /api/journal/[id]` requires `ADMIN` and refuses rows in
`PUBLISHED` or `PENDING_REVIEW` with
`400 Cannot delete a published or pending-review article. Archive it first.`;
`DRAFT` and `ARCHIVED` rows are deleted outright. Deleting a row cascades to its
`JournalAuthor` rows; its children survive with `parentId` set to `null`, and its
photos survive with `journalId` set to `null`.

`DELETE /api/journal/issues/[id]` is a separate handler for top-level rows and
applies **no status check** — see [Known gaps](#known-gaps-and-sharp-edges).

**Moderation gate.** There is no review queue or reviewer assignment. The gate is
the status machine itself: a non-editor admin can move a draft into review but
cannot approve it, and publishing is restricted to the editor allow-list. The
article footer shows "Reviewed by …" from `approvedBy`.

## Authorization

Two independent layers apply.

1. **`ADMIN` role.** Every journal API handler except the public reads performs
   its own in-route role check. `/api/journal` is not in the `middleware.ts`
   matcher, so no path-based role check protects it; a missing or non-admin
   session produces `401`/`403` from the handler.
2. **Journal editor allow-list.** `isJournalEditor(userId)` reads the
   `journal_editor_ids` `AppSetting` and returns whether an array parsed from its
   JSON value contains the user id; a missing setting, empty value or malformed
   JSON returns `false` (`src/lib/journal-auth.ts`). The setting is written through
   `GET`/`PUT /api/journal/settings`, whose write path upserts with
   `category: "journal"` and accepts only that key. The admin UI is
   `JournalSettingsSection`, mounted at `/admin/settings#journal-editors`.

The editor list is **not** a role and is never checked against the user's role. It
only matters inside handlers that already required `ADMIN`, so in practice an
editor must also be an `ADMIN`; a non-admin whose id is in the list gains nothing,
because the role check runs first. `isJournalEditor` is consulted for:

| Capability                                           | Enforcement                                                |
| ---------------------------------------------------- | ---------------------------------------------------------- |
| Edit any field of a `PUBLISHED` article              | `403 Only Journal Editors can edit published articles`     |
| Publish or archive                                   | `403 Only Journal Editors can publish or archive articles` |
| Open `/journal/preview/[id]`                         | `ADMIN` **and** editor, otherwise `notFound()`             |
| Read the `isEditor` flag and render the editor badge | informational                                              |

Any `ADMIN` (editor or not) can create, edit and delete `DRAFT` and `ARCHIVED`
articles including their content, photos, authors and child topics; submit drafts
for review and return pending articles to draft; create, edit and delete issues;
read every article in any status; upload, edit and delete journal photos,
including those attached to published articles; and add or remove ids in
`journal_editor_ids`. The last two are gated only by `ADMIN`.

## Photos

`POST /api/journal/photos` accepts `multipart/form-data` with `file` (required)
plus optional `title`, `caption`, `attribution` and `journalId`.

| Aspect             | Behaviour                                                                                                     |
| ------------------ | ------------------------------------------------------------------------------------------------------------- |
| Accepted types     | `image/jpeg`, `image/png`, `image/webp`, `image/gif`                                                          |
| Size cap           | 20 MB, checked against the uploaded file before optimisation                                                  |
| Validation         | `validateImageFile` (`src/lib/imageOptimizer`); validation and corruption errors return `400`                 |
| Re-encode          | `sharp(...).resize(1920, 1200, { fit: "inside", withoutEnlargement: true }).webp({ quality: 88, effort: 4 })` |
| Stored file        | `<uploads>/journal/<uuid>.webp` — `UPLOADS_DIR` in production, `<repo>/uploads` in development                |
| Stored metadata    | `mimeType` forced to `image/webp`, `size` = optimised byte length; the original bytes are discarded           |
| Ordering on upload | `order` = current photo count for that article, so uploads append                                             |
| Cleanup            | If the database insert fails, the written file is removed best-effort                                         |

`PATCH /api/journal/photos/[id]` updates `title`, `caption`, `attribution`,
`order` and `journalId` with no status gate; `DELETE` removes the row and the
file, clearing any article's `coverPhotoId` first. Upload and metadata writes
require `ADMIN`.

**Serving.** `GET /api/journal/photos/[id]` decides access from the photo's
references:

| Photo state                                       | Access       | `Cache-Control`                       |
| ------------------------------------------------- | ------------ | ------------------------------------- |
| Attached to a `PUBLISHED` article                 | public       | `public, max-age=31536000, immutable` |
| Used as the cover of a `PUBLISHED` article        | public       | same                                  |
| Attached to a non-published article, or its cover | `ADMIN` only | `private, no-store`                   |
| Attached to nothing and used as no cover          | `ADMIN` only | `private, no-store`                   |

The checks run attachment-first and return `403` immediately, so a photo attached
to a draft is admin-only even if a published article also uses it as its cover.

**Ordering and captions.** Article pages request photos with
`orderBy: { order: "asc" }`. The uploader's move-up/move-down controls swap the
`order` values of the two affected photos with two independent `PATCH` calls and
no transaction. `title` becomes the image `alt`; captions and attributions surface
in galleries and `figcaption` elements.

**Cover selection.** The uploader sets the cover with `PUT /api/journal/[id]` and
`{ coverPhotoId }` immediately rather than on Save, rolling back in the UI if the
request fails. Because it goes through the article update handler, choosing a
cover for an already-published article requires the journal-editor role.

## Known gaps and sharp edges

- **No scheduled publishing.** A future `publishedAt` is stored verbatim, but
  status flips to `PUBLISHED` on demand and every public query filters on `status`
  alone with no date comparison, so a future-dated article is live immediately.
  `FEATURES.md` §9 records the same limitation.
- **Slug is changeable through the API.** The editor UI labels the slug "Cannot be
  changed after creation", but `PUT /api/journal/[id]` accepts `slug` and
  re-slugifies it. Only an external API caller can exercise this.
- **Submitted child order is discarded.** `PUT /api/journal/[id]/children`
  validates and unlinks correctly, then re-sorts by publish time, so `childOrder`
  is a derived value rather than the order an editor submitted.
- **`parentId` is unvalidated on create and update.** Neither `POST /api/journal`
  nor `PUT /api/journal/[id]` checks that a `parentId` exists, points at a
  top-level row, is not the row itself, or avoids an ancestor loop; only the
  dedicated children handler performs a cycle check. A `PUT` with `parentId` equal
  to the row's own id makes the article its own parent, and it then appears in its
  own child list.
- **The issue delete route bypasses the moderation gate.**
  `DELETE /api/journal/issues/[id]` has no `PUBLISHED`/`PENDING_REVIEW` guard,
  unlike `DELETE /api/journal/[id]`, so a published issue can be deleted while an
  equivalent published article cannot.
- **Article deletion has no UI.** The only way to delete a draft or archived
  article is to call `DELETE /api/journal/[id]` directly.
- **Deleting an article orphans its photos.** `JournalPhoto.journalId` is
  `SetNull`, so rows and files survive; with no article reference they become
  admin-only under the serving rules, and nothing prunes them.
- **Orphan photos embedded in published markdown break for readers.** `journalId`
  is optional on upload, and a photo attached to nothing is served only to
  admins, so an `<img>` pointing at it renders broken in the public view.
- **Duplicate member authors fail loudly.** `JournalAuthor` is unique on
  `(journalId, userId)` and the update handler recreates the set without
  deduplication; the resulting Prisma error is not caught. The client picker
  prevents adding the same member twice, so the API is the exposed surface.
- **Deleted members become "Unknown" bylines.** `JournalAuthor.userId` is
  `SetNull` and member authors store no `name`, so the byline falls through to
  `"Unknown"`. `Journal.createdById` is `Restrict`, so deleting a member who
  created a journal fails instead.
- **An editor must also be an admin.** Editor membership alone grants no access,
  because every handler checks the `ADMIN` role first.
- **The editor allow-list is writable by any admin.** `PUT /api/journal/settings`
  checks only `ADMIN`, so any admin can add or remove editors, including
  themselves. `DELETE /api/app-settings?key=journal_editor_ids` is now
  role-checked by the middleware — writes to `/api/app-settings` require `ADMIN` —
  although the handler itself still contains no auth code (`FEATURES.md` §9 item
  38, `IMPLEMENTATION.md` §16.6).
- **No audit trail and no notification.** No handler under `app/api/journal/**`
  writes an audit-log entry or sends mail on publication or status change.
- **Markdown is not sanitised.** `MarkdownViewer` uses `react-markdown` and
  `remark-gfm` without `rehype-sanitize` or `rehype-raw`. Raw HTML is escaped
  rather than rendered, so this is not an XSS vector, but sanitisation is absent;
  the helpdesk timeline does apply it.
- **The channel pages are unguarded.** `/journal`, `/awards`, `/p-index` and
  `/other` live in the `(authenticated)` route group, but that group is not a
  guard: its layout is a client component that renders `children`
  unconditionally, and none of these paths are in the `middleware.ts` matcher.
  Anonymous visitors therefore get the pages, which is why
  `JournalCollectionPage` renders a "Member login" link when there is no session.
- **A published article can be left without a date.** `PUT /api/journal/[id]`
  accepts `publishedAt: null` or `""` without touching `status`, so an editor can
  clear the date of a live article, which then sorts to the bottom of a
  `publishedAt desc` listing.
- **Child counts are unfiltered.** The `_count.children` value returned to the
  channel pages counts children in every status while the public child list shows
  only published rows. `ArticleCard` does not render that count, so it is latent
  rather than visible.

## API surface

Every handler under `app/api/journal/**` performs its own access check; the path
prefix is not covered by `middleware.ts`.

| Method(s) | Path                        | Access                                                          | Purpose                                                          |
| --------- | --------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------- |
| `GET`     | `/api/journal`              | public (`PUBLISHED` only); `ADMIN` may pass `status` to see all | List articles (`parentId`, `type`, `status`, `search`, paging)   |
| `POST`    | `/api/journal`              | admin                                                           | Create an article; always `DRAFT`                                |
| `GET`     | `/api/journal/:id`          | admin                                                           | Read one article with photos, authors, editor, creator, approver |
| `PUT`     | `/api/journal/:id`          | admin; journal editor for `PUBLISHED` rows                      | Partial update; replaces authors when supplied                   |
| `DELETE`  | `/api/journal/:id`          | admin                                                           | Delete a `DRAFT` or `ARCHIVED` row                               |
| `PUT`     | `/api/journal/:id/children` | admin                                                           | Replace and re-sort the child set                                |
| `POST`    | `/api/journal/:id/status`   | admin; journal editor to publish or archive                     | Apply a status transition                                        |
| `GET`     | `/api/journal/issues`       | public (`PUBLISHED` only); `ADMIN` sees all                     | List top-level rows                                              |
| `POST`    | `/api/journal/issues`       | admin                                                           | Create a top-level issue; always `DRAFT`                         |
| `PUT`     | `/api/journal/issues/:id`   | admin                                                           | Update a top-level issue                                         |
| `DELETE`  | `/api/journal/issues/:id`   | admin                                                           | Delete a top-level issue; unlinks children; no status check      |
| `POST`    | `/api/journal/photos`       | admin                                                           | Upload and re-encode a photo                                     |
| `GET`     | `/api/journal/photos/:id`   | public when referenced by a published article, otherwise admin  | Serve the image bytes                                            |
| `PATCH`   | `/api/journal/photos/:id`   | admin                                                           | Update title, caption, attribution, order, `journalId`           |
| `DELETE`  | `/api/journal/photos/:id`   | admin                                                           | Delete the photo row and file                                    |
| `GET`     | `/api/journal/settings`     | admin                                                           | Read journal settings and the caller's editor status             |
| `PUT`     | `/api/journal/settings`     | admin                                                           | Upsert a journal setting (`journal_editor_ids`)                  |
| `GET`     | `/api/journal/slug/:slug`   | public                                                          | Read one `PUBLISHED` article by slug, any type                   |

## Verification

Checked against the source on 2026-09-16. Three behaviours are read from the code
rather than exercised at runtime, and are stated here so they are not mistaken for
tested facts:

- The HTTP status returned for an unhandled Prisma failure (a duplicate
  `(journalId, userId)` author, or a foreign-key violation from a bad `parentId`)
  is inferred from the absence of a `try`/`catch` in those handlers.
- SQLite's null ordering for `orderBy: { publishedAt: "asc" }` in the children
  handler's response query was not executed. The handler sorts ids with drafts
  last before writing, but its final read has no null branch; the client re-sorts
  regardless.
- Whether any external tooling consumes `GET /api/journal/slug/[slug]` is unknown;
  no caller exists in the repository.

## Related documentation

- [`FEATURES.md`](../FEATURES.md) §3 (content channels), §5.8 (journal administration), §9 (known gaps)
- [`IMPLEMENTATION.md`](../IMPLEMENTATION.md) §7.6 and §9 (file storage), §16 (known defects)
- [`API_REFERENCE.md`](API_REFERENCE.md) — full route inventory and access-level definitions
- [`HOF_SYSTEM.md`](HOF_SYSTEM.md) — the Hall of Fame tables, which are separate from the journal channels
