# UX Copy Guidelines

This document establishes voice, tone, and content standards for all user-facing text in BWB.

## Core Principles

### 1. Be Helpful and Actionable

Every message should tell users what happened and what they can do next.

**Good:**

- "Couldn't load members. Check your connection and try again."
- "Password must be at least 8 characters."

**Avoid:**

- "An error occurred."
- "Invalid input."

### 2. Use Plain Language

Write for clarity, not cleverness. Avoid technical jargon.

**Good:**

- "Incorrect email/username or password. Check your credentials and try again."
- "Complete the bot check to continue."

**Avoid:**

- "Authentication failed. Invalid credentials provided."
- "Please complete the CAPTCHA verification to proceed with authentication."

### 3. Be Consistent

Use the same terms and patterns everywhere. Build user familiarity.

**Good:**

- Always "Select" (not "Choose" or "Pick")
- Always periods on validation messages
- Always specific loading states ("Loading members..." not "Loading...")

## Voice and Tone

### Voice

Calm, confident, and straightforward. Like a knowledgeable friend who keeps things simple.

### Tone by Context

| Context         | Tone                | Example                                                   |
| --------------- | ------------------- | --------------------------------------------------------- |
| **Success**     | Brief and affirming | "HOF updated."                                            |
| **Error**       | Calm and helpful    | "Unable to connect. Check your connection and try again." |
| **Empty state** | Encouraging         | "No members yet. Add your first member to get started."   |
| **Loading**     | Informative         | "Loading change request..."                               |
| **Validation**  | Direct and clear    | "Email is required."                                      |

## Terminology Glossary

Use these terms consistently throughout the app:

| ✅ Use This    | ❌ Not This             | Context                     |
| -------------- | ----------------------- | --------------------------- |
| Select         | Choose, Pick            | Dropdowns and selectors     |
| Enter          | Input, Type in          | Text field instructions     |
| Email/username | Username/email          | Login field references      |
| Connection     | Network                 | Connection errors           |
| Check your...  | Please check...         | Error recovery instructions |
| Try again      | Retry, Please try again | Retry prompts               |
| Complete       | Fill out                | CAPTCHA instructions        |
| Incorrect      | Invalid, Wrong          | Credential errors           |

## Message Patterns

### Validation Messages

**Format:** `[Field] [rule/constraint].`

Always end with a period. Be specific about the requirement.

```typescript
// Good
"Email is required.";
"Password must be at least 8 characters.";
"Name cannot exceed 255 characters.";

// Avoid
"This field is required";
"Invalid password";
"Too long";
```

### Error Messages

**Format:** `[What happened]. [What to do].`

Two sentences: diagnosis + action.

```typescript
// Good
"Couldn't load members. Check your connection and try again.";
"Unable to save changes. Check the form for errors and try again.";

// Avoid
"An error occurred.";
"Failed to load data.";
"Something went wrong.";
```

**Common Error Templates:**

```typescript
// Network errors
"Unable to connect. Check your connection and try again.";

// Permission errors
"You don't have permission to [action].";

// Not found errors
"[Resource] not found.";

// File upload errors
"Couldn't upload file. Check the file size (max 10MB) and format, then try again.";
```

### Success Messages

**Format:** `[Resource] [action].`

Brief and past tense. **Never** use "successfully" — the success state speaks for itself.

```typescript
// Good
"HOF updated.";
"Member created.";
"Changes saved.";

// Avoid
"HOF successfully updated.";
"Member has been created successfully.";
"Your changes were successfully saved.";
```

### Empty States

**Title Format:** `No [plural resource] yet`

**Description:** Specific guidance based on context.

```typescript
// Good - with filters
title: "No members yet";
description: "Clear filters to see all members";

// Good - no data
title: "No members yet";
description: "Add your first member to get started";

// Avoid
title: "No data found";
description: "Try adjusting your filters";
```

### Loading States

**Format:** `Loading [specific resource]...`

Always context-specific. Use ellipsis.

```typescript
// Good
"Loading members...";
"Loading change request...";
"Verifying email...";

// Avoid
"Loading...";
"Please wait...";
```

### Placeholders

**Format:** `Select [option type]` or `Enter [field type]`

Always start with action verb.

```typescript
// Good
"Select a country";
"Enter your email";
"Search members...";

// Avoid
"Country...";
"Email";
"Type to search";
```

### Helper Text

Keep brief. One line maximum. No periods.

```typescript
// Good
"Must be at least 8 characters";
"Visible to other authenticated users";

// Avoid
"Your password must be at least 8 characters long.";
"This information will be visible to other authenticated users on the platform.";
```

### Confirmation Dialogs

**Title:** Action question  
**Body:** Consequence + optional detail  
**Buttons:** [Cancel] [Action Verb]

```typescript
// Good
title: "Delete member?";
body: "This cannot be undone. All HOF entries for this member will also be deleted.";
buttons: ["Cancel", "Delete"];

// Avoid
title: "Are you sure?";
body: "This action cannot be reversed.";
buttons: ["No", "Yes"];
```

## Capitalization

### Sentence Case (Preferred)

Use sentence case for most UI text:

- **Buttons:** "Save changes", "Create member", "Sign in"
- **Labels:** "Email address", "Display name", "Privacy level"
- **Headings:** "Member management", "Edit profile"

### Title Case (Limited Use)

Use title case only for:

- Navigation menu items: "Hall of Fame", "My Bags"
- Page titles: "Member Management"

### Never Capitalize

- Error messages
- Helper text
- Placeholder text

## Punctuation

| Element             | Rule                     | Example                                                   |
| ------------------- | ------------------------ | --------------------------------------------------------- |
| Validation messages | Period                   | "Email is required."                                      |
| Error messages      | Period on both sentences | "Unable to connect. Check your connection and try again." |
| Success messages    | Period                   | "Member created."                                         |
| Helper text         | No period                | "Must be at least 8 characters"                           |
| Button labels       | No period                | "Save changes"                                            |
| Placeholder text    | No period                | "Enter your email"                                        |

## Accessibility

### Screen Readers

- Use full words, not abbreviations ("Hall of Fame" not "HOF" in aria-labels)
- Loading states must announce to screen readers
- Error messages must be associated with form fields

### Reading Level

Target 8th grade reading level:

- Short sentences
- Common words
- Active voice
- No jargon

## i18n Preparation

### Placeholder Safety

Never concatenate strings. Use template variables:

```typescript
// Good
const message = t("validation.required", { field: "Email" });
// "Email is required."

// Avoid
const message = field + " is required.";
// Breaks in languages with different word order
```

### Avoid Cultural Idioms

```typescript
// Good
"Unable to load data";

// Avoid
"Oops! Something went wrong";
```

### Pluralization

Prepare for languages with complex plural rules:

```typescript
// Good - structured for pluralization
t("members.count", {
  count: n,
}) // Avoid - hardcoded English pluralization
`${count} member${count !== 1 ? "s" : ""}`;
```

## Copy Review Checklist

Before submitting UI changes, verify:

- [ ] Validation messages end with periods
- [ ] Error messages include recovery action
- [ ] Success messages omit "successfully"
- [ ] Loading states are specific
- [ ] Empty state titles use "No [resource] yet"
- [ ] Placeholders start with action verbs
- [ ] Helper text is under one line
- [ ] Terminology matches glossary
- [ ] Buttons use sentence case
- [ ] No technical jargon
- [ ] Messages are actionable

## Quick Reference

### Common Rewrites

| Instead of...             | Use...                            |
| ------------------------- | --------------------------------- |
| "Choose a country"        | "Select a country"                |
| "Loading..."              | "Loading [specific]..."           |
| "Successfully updated"    | "Updated"                         |
| "No data found"           | "No [resource] yet"               |
| "Please enter your email" | "Enter your email"                |
| "Invalid input"           | "[What's wrong]. [What to do]."   |
| "An error occurred"       | "Unable to [action]. [Recovery]." |

### Constants Reference

All copy constants live in: `src/lib/constants.ts`

```typescript
import { VALIDATION_MESSAGES, ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/src/lib/constants";
```

Prefer constants over inline strings for reusability and consistency.

## Maintenance

### When to Update This Guide

- New UI patterns emerge
- User feedback suggests confusion
- Accessibility requirements change
- i18n implementation begins

### Document Owner

This guide should be reviewed quarterly and updated by the development team lead.

---

**Last Updated:** January 2026  
**Version:** 1.0
