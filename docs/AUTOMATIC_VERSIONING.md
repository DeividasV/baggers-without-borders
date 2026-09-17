# 🚀 BWB Automatic Versioning & Smart Commits

Complete guide to BWB's automated versioning system with intelligent commit message generation.

## 🎯 Quick Start

### Basic Usage

```bash
# Stage your changes
git add .

# Interactive commit with AI suggestions
npm run commit

# Or just get suggestions
npm run commit:suggest
```

## 📋 System Overview

BWB automatically manages semantic versioning using Git hooks and analyzes your code changes to suggest appropriate conventional commit messages.

### Components

- **Version Calculator**: Analyzes all commits to determine version
- **Git Hook**: Auto-updates version on every commit
- **Commit Analyzer**: Suggests conventional commit messages
- **UI Display**: Shows current version in navigation
- **API Endpoint**: Provides version info to frontend

## 🔧 Version Bumping Rules

| Commit Type        | Version Bump | Example           |
| ------------------ | ------------ | ----------------- |
| `feat:`            | **MINOR**    | `1.2.3` → `1.3.0` |
| `fix:`             | **PATCH**    | `1.2.3` → `1.2.4` |
| Unclassified       | **MINOR**    | `1.2.3` → `1.3.0` |
| `BREAKING CHANGE:` | **MAJOR**    | `1.2.3` → `2.0.0` |

### Conventional Commit Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

## 🤖 Smart Commit Suggestions

The system analyzes your staged changes and suggests appropriate commit messages:

### Analysis Factors

- **File Types**: Frontend (`.tsx`, `.css`) vs Backend (`.ts`, `.js`)
- **Change Patterns**: New files, deletions, modifications
- **Content Analysis**: Function names, imports, test files
- **Project Structure**: Component changes, API routes, database updates

### Example Suggestions

```bash
🔍 Analyzing staged changes...

📋 Analysis Summary:
   📁 Files: 3
   🎯 Scope: ui
   📊 Changes: +45 -12
   🏷️  Pattern: New Feature

💡 Suggested Commit Messages:

1. 🎯 feat(ui): add version display component to navigation
2. 🔀 feat: implement version display in navigation bar
3. 📝 chore(ui): update navigation with version info
```

## 🛠️ Interactive Commit Workflow

### Using `npm run commit`

1. **Stage Changes**

   ```bash
   git add .
   # or stage specific files
   git add src/components/Version.tsx
   ```

2. **Run Interactive Commit**

   ```bash
   npm run commit
   ```

3. **Choose Your Option**
   - Select numbered suggestion (1-3)
   - Enter `c` for custom message
   - Enter `q` to cancel

4. **Automatic Processing**
   - Commit is made with chosen message
   - Git hook automatically updates version
   - New version is calculated and stored

## 📁 File Structure

```
scripts/versioning/
├── calculate-version.js      # Main version calculation logic
├── hook-update-version.js    # Git hook version updater
├── suggest-commit.js         # Commit message analyzer
├── interactive-commit.js     # Interactive commit helper
└── update-version.js         # Manual version update script

.git/hooks/
└── prepare-commit-msg        # Git hook (auto-installed)

app/
├── api/version/route.ts      # Version API endpoint
└── components/ui/Version.tsx # Version display component

version.json                  # Current version storage
```

## 🎨 UI Integration

The current version is displayed in the navigation bar next to the BWB logo.

### Component Usage

```tsx
import { Version } from "@/app/components/ui/Version";

// Displays: "v1.2.3"
<Version />;
```

### API Endpoint

```bash
GET /api/version
```

Response:

```json
{
  "version": "1.2.3",
  "lastCommit": "abc123f",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## 🔍 Manual Commands

### Version Management

```bash
# Calculate and update version manually
npm run version:update

# Just calculate version (no file changes)
npm run version:calculate

# Get commit suggestions only
npm run commit:suggest
```

### Git Hook Management

```bash
# Reinstall Git hook (if needed)
npm run version:setup

# Check current version
cat version.json
```

## 🧪 Testing the System

### Test Version Calculation

```bash
# Make some changes
echo "// Test change" >> app/test.js
git add app/test.js

# Get suggestions
npm run commit:suggest

# Make commit
npm run commit
# Choose option 1: "feat: add test functionality"

# Verify version updated
cat version.json
# Should show MINOR version bump
```

### Test Different Commit Types

```bash
# Feature commit (MINOR bump)
git commit -m "feat: add new user dashboard"

# Fix commit (PATCH bump)
git commit -m "fix: resolve login button styling issue"

# Unclassified commit (MINOR bump)
git commit -m "update documentation"
```

## 🎯 Commit Type Detection

The system automatically detects commit types based on file patterns:

### Feature Detection (`feat:`)

- New component files (`*.tsx`, `*.jsx`)
- New API routes (`/api/*/route.ts`)
- New pages (`page.tsx`)
- Significant additions (>50 lines)

### Bug Fix Detection (`fix:`)

- Keywords: "fix", "bug", "issue", "error"
- Test file changes with fixes
- Small targeted changes (<20 lines)

### Scope Detection

- `ui`: Frontend components, styles
- `api`: Backend routes, server logic
- `db`: Database schema, migrations
- `auth`: Authentication, middleware
- `test`: Test files, test utilities
- `docs`: Documentation files

## 🚀 Best Practices

### 1. Staging Strategy

```bash
# Stage related changes together
git add src/components/UserProfile.tsx
git add app/api/users/route.ts
npm run commit  # Will suggest "feat(api): add user profile management"
```

### 2. Commit Frequency

- Commit logical units of work
- Use interactive commit for all changes
- Let the system suggest appropriate messages

### 3. Custom Messages

Use custom messages for:

- Complex changes spanning multiple areas
- Breaking changes (include `BREAKING CHANGE:`)
- Specific business context

### 4. Version Monitoring

- Check version display in UI regularly
- Monitor version.json for accuracy
- Review Git hook logs if issues arise

## 🔧 Troubleshooting

### Git Hook Not Working

```bash
# Check hook exists
ls -la .git/hooks/prepare-commit-msg

# Reinstall hook
npm run version:setup

# Check hook permissions
chmod +x .git/hooks/prepare-commit-msg
```

### Version Not Updating

```bash
# Manually update version
npm run version:update

# Check for Git hook errors
git commit -m "test" --dry-run

# Verify version files
cat version.json
grep version package.json
```

### Commit Suggestions Not Working

```bash
# Test analyzer directly
node scripts/versioning/suggest-commit.js

# Check staged changes
git diff --cached --name-only

# Verify dependencies
npm list
```

## 🎉 Success Indicators

When everything works correctly:

1. ✅ Version displays in UI navigation
2. ✅ Each commit increments version appropriately
3. ✅ Commit suggestions match your changes
4. ✅ Interactive commit completes without errors
5. ✅ Version API returns correct information

## 📝 Examples

### Frontend Component Addition

```bash
# Add new component
git add src/components/UserCard.tsx
npm run commit

# Suggestion: "feat(ui): add user card component"
# Version: 1.2.3 → 1.3.0
```

### Bug Fix

```bash
# Fix styling issue
git add app/globals.css
npm run commit

# Suggestion: "fix(ui): resolve navigation menu alignment"
# Version: 1.3.0 → 1.3.1
```

### API Enhancement

```bash
# Add new endpoint
git add app/api/analytics/route.ts
npm run commit

# Suggestion: "feat(api): implement analytics endpoint"
# Version: 1.3.1 → 1.4.0
```

This system provides seamless, automated versioning with intelligent commit assistance, making version management effortless while maintaining semantic versioning standards.
