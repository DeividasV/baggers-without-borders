#!/bin/bash

# BWB Auto-Versioning Setup Script
# This script sets up automatic version updates on every commit

echo "🚀 Setting up BWB Automatic Versioning System..."

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Error: Not in a Git repository"
    exit 1
fi

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed or not in PATH"
    exit 1
fi

# Check if versioning scripts exist
if [ ! -f "scripts/versioning/hook-update-version.js" ]; then
    echo "❌ Error: Versioning scripts not found"
    exit 1
fi

# Make sure hooks directory exists
mkdir -p .git/hooks

# Copy the pre-commit hook
if [ -f ".git/hooks/pre-commit" ]; then
    echo "⚠️  Pre-commit hook already exists, backing up..."
    cp .git/hooks/pre-commit .git/hooks/pre-commit.backup
fi

# Install the hook
cp .git/hooks/pre-commit.template .git/hooks/pre-commit 2>/dev/null || cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash

# BWB Automatic Version Update Hook
# This hook runs before each commit to update the version and include the updated files

echo "🔄 BWB Auto-Versioning: Updating version before commit..."

# Check if we're in the middle of a rebase, merge, or other Git operation
if [ -f ".git/MERGE_HEAD" ] || [ -f ".git/rebase-apply/applying" ] || [ -f ".git/CHERRY_PICK_HEAD" ]; then
    echo "⚠️  Git operation in progress, skipping auto-versioning"
    exit 0
fi

# Check if this is the initial commit
if git rev-parse --verify HEAD >/dev/null 2>&1; then
    # Not initial commit - update version
    echo "📈 Calculating new version based on staged changes..."
    
    # Update version (this will modify package.json and version.json)
    node scripts/versioning/hook-update-version.js
    
    if [ $? -eq 0 ]; then
        echo "✅ Version updated successfully"
        
        # Add the updated version files to the current commit
        git add package.json version.json
        
        echo "📦 Added version files to commit"
    else
        echo "❌ Failed to update version"
        exit 1
    fi
else
    echo "🆕 Initial commit detected, skipping auto-versioning"
fi

echo "🎉 Pre-commit version update complete!"
exit 0
EOF

# Make the hook executable
chmod +x .git/hooks/pre-commit

# Make versioning scripts executable
chmod +x scripts/versioning/*.js

echo "✅ BWB Auto-Versioning System installed successfully!"
echo ""
echo "📋 How it works:"
echo "  • Every commit will automatically update the version"
echo "  • Version files (package.json, version.json) are automatically included in the commit"
echo "  • Version bumps based on conventional commit messages:"
echo "    - feat: → MINOR bump"
echo "    - fix: → PATCH bump"
echo "    - other types → PATCH bump"
echo ""
echo "🎯 To disable: rm .git/hooks/pre-commit"
echo "🔄 To manually update: npm run version:update"