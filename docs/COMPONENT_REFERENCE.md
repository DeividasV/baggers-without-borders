# Component Reference

## UI Components (`app/components/ui/`)

### Button

```tsx
import { Button } from "@/ui";

// Variants: primary, secondary, danger, ghost
// Sizes: sm, md, lg

<Button variant="primary" size="md">Click Me</Button>
<Button variant="primary" loading={true}>Saving...</Button>
<Button variant="ghost" icon={<Icon />} /> // Icon only
<Button variant="primary" icon={<Icon />}>With Icon</Button>
```

### Card

```tsx
import { Card } from "@/ui";

// Padding: none, sm, md, lg
// Hover: boolean

<Card padding="md">Content</Card>
<Card padding="lg" hover>Clickable Card</Card>
```

### Input

```tsx
import { Input } from "@/ui";

<Input
  label="Username"
  type="text"
  required
  value={value}
  onChange={handleChange}
  placeholder="Enter username"
  error="Error message"
  helperText="Helper text"
/>;
```

### Select

```tsx
import { Select } from "@/ui";

<Select
  label="Role"
  required
  value={value}
  onChange={handleChange}
  options={[
    { value: "USER", label: "User" },
    { value: "ADMIN", label: "Admin" },
  ]}
/>;
```

### Textarea

```tsx
import { Textarea } from "@/ui";

<Textarea
  label="Description"
  required
  rows={6}
  value={value}
  onChange={handleChange}
  helperText="Be specific"
/>;
```

### Badge

```tsx
import { Badge } from "@/ui";

// Variants: default, primary, success, warning, danger, info,
//           feature, bug, enhancement
// Sizes: sm, md, lg

<Badge variant="primary">Admin</Badge>
<Badge variant="success" size="sm">Approved</Badge>
```

### Modal

```tsx
import { Modal } from "@/ui";

// Sizes: sm, md, lg, xl, full

<Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Modal Title" size="lg">
  <div>Modal content</div>
</Modal>;
```

### EmptyState

```tsx
import { EmptyState } from "@/ui";
import { Users } from "lucide-react";

<EmptyState
  icon={Users}
  title="No users found"
  description="Get started by adding your first user"
  action={<Button onClick={handleAdd}>Add User</Button>}
/>;
```

### LoadingSpinner

```tsx
import { LoadingSpinner } from "@/ui";

// Sizes: sm, md, lg

<LoadingSpinner size="lg" text="Loading..." />
<LoadingSpinner fullScreen text="Please wait..." />
```

### Logo

```tsx
import { Logo } from "@/ui";

// Sizes: sm, md, lg, xl, xxl
// Default size: md, showText: true

<Logo size="sm" showText={false} />          // Icon only - small
<Logo size="md" />                           // Icon + text - medium
<Logo size="lg" showText={false} />          // Icon only - large
<Logo size="xl" />                           // Icon + text - extra large
<Logo size="xxl" showText={false} />         // Icon only - extra extra large

// Custom styling
<Logo className="hover:opacity-80" />

// Used in Navigation and Sidebar components
```

## Utility Functions (`app/lib/utils.ts`)

```tsx
import {
  formatFileSize,
  formatDate,
  formatDateTime,
  getBadgeVariant,
  getOptionLabel,
  truncateText,
  isImageFile,
  getInitials,
} from "@/app/lib/utils";

// Format file size
formatFileSize(1024000); // "1000 KB"

// Format dates
formatDate("2024-10-21"); // "10/21/2024"
formatDateTime(new Date()); // "Oct 21, 2024, 3:45 PM"

// Get badge variant automatically
getBadgeVariant("HIGH", "priority"); // "danger"
getBadgeVariant("FEATURE", "type"); // "feature"

// Get label from value
getOptionLabel("HIGH", PRIORITY_OPTIONS); // "High"

// Truncate text
truncateText("Long text here", 10); // "Long text..."

// Check if image
isImageFile("image/png"); // true

// Get initials
getInitials("John Doe"); // "JD"
```

## Constants (`src/lib/constants.ts`)

```tsx
import {
  CHANGE_REQUEST_TYPES,
  PRIORITY_OPTIONS,
  IMPACT_OPTIONS,
  STATUS_OPTIONS,
  USER_ROLES,
  MAX_FILE_SIZE,
  ALLOWED_FILE_TYPES,
} from "@/src/lib/constants";

// Use in Select components
<Select options={PRIORITY_OPTIONS} />;

// Check file size
if (file.size > MAX_FILE_SIZE) {
  alert("File too large");
}
```

## Feature Components (`app/components/features/`)

```tsx
import { Dashboard, UserManagement, ChangeRequestManagement } from "@/features";

// Use in pages
<Dashboard />
<UserManagement />
<ChangeRequestManagement />
```

## Path Aliases

```tsx
// New path aliases (tsconfig.json)
@/app/*              // app directory
@/components/*       // app/components
@/ui/*              // app/components/ui
@/features/*        // app/components/features
@/lib/*             // app/lib
@/src/*             // src (legacy support)
@/types/*           // src/types
```

## Styling Patterns

### Colors

```tsx
// Primary actions
className = "bg-primary-600 hover:bg-primary-700 text-white";

// Secondary actions
className = "bg-dark-700 hover:bg-dark-600 text-gray-100";

// Danger actions
className = "bg-red-600 hover:bg-red-700 text-white";

// Text colors
className = "text-gray-100"; // Primary text
className = "text-gray-400"; // Secondary text
className = "text-primary-400"; // Accent text
```

### Typography

```tsx
// Page title
className = "text-3xl font-bold text-primary-400";

// Section header
className = "text-2xl font-bold text-primary-400";

// Card title
className = "text-lg font-semibold text-gray-100";

// Body text
className = "text-base text-gray-300";

// Helper text
className = "text-sm text-gray-400";
```

### Spacing

```tsx
// Between sections
className = "space-y-8";

// Between elements
className = "space-y-4"; // Related elements
className = "space-y-2"; // Tightly related

// Padding
className = "p-6"; // Standard card padding
className = "p-4"; // Compact padding
className = "p-8"; // Large padding
```

### Borders

```tsx
// Standard border
className = "border border-dark-700";

// Hover border
className = "hover:border-primary-600";

// Section separator
className = "border-b border-dark-700";
```

## Common Patterns

### Loading State

```tsx
const [loading, setLoading] = useState(true);

if (loading) {
  return (
    <Card>
      <LoadingSpinner size="lg" text="Loading..." />
    </Card>
  );
}
```

### Empty State

```tsx
{items.length === 0 ? (
  <EmptyState
    icon={Icon}
    title="No items found"
    action={<Button onClick={handleAdd}>Add Item</Button>}
  />
) : (
  <div className="space-y-4">
    {items.map(item => ...)}
  </div>
)}
```

### Form Submission

```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
    const response = await fetch("/api/endpoint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      // Success handling
    } else {
      // Error handling
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    setLoading(false);
  }
};
```

### Modal Pattern

```tsx
const [showModal, setShowModal] = useState(false);

<Button onClick={() => setShowModal(true)}>Open</Button>

<Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Title">
  <form onSubmit={handleSubmit}>
    {/* Form fields */}
    <div className="flex justify-end space-x-3 pt-4">
      <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
        Cancel
      </Button>
      <Button type="submit" variant="primary">
        Submit
      </Button>
    </div>
  </form>
</Modal>
```

## Best Practices

1. **Always use shared UI components** - Don't create custom buttons, inputs, etc.
2. **Use constants** - Don't hardcode options, use centralized constants
3. **Consistent spacing** - Follow the spacing patterns (2, 4, 6, 8 units)
4. **Loading states** - Always show loading indicators for async operations
5. **Empty states** - Provide helpful empty states with actions
6. **Error handling** - Use proper error messages and validation
7. **Accessibility** - Use proper labels, ARIA attributes, and keyboard support
8. **Mobile first** - Use responsive classes (sm:, md:, lg:)
9. **Type safety** - Use TypeScript types from `@/types`
10. **DRY principle** - Extract reusable patterns into components

---

**Quick Start Checklist**

- [ ] Import from `@/ui` for UI components
- [ ] Import from `@/features` for feature components
- [ ] Use constants from `@/src/lib/constants`
- [ ] Use utilities from `@/app/lib/utils`
- [ ] Follow consistent spacing patterns
- [ ] Add loading states
- [ ] Add empty states
- [ ] Use proper TypeScript types
- [ ] Test on mobile
- [ ] Check accessibility
