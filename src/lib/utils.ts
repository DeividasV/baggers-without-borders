/**
 * Utility Functions - Main Export
 *
 * This file maintains backward compatibility by re-exporting
 * from the new modular structure in src/lib/utils/
 *
 * New imports should use: import { fn } from "@/src/lib/utils"
 * The utilities are now organized in separate modules:
 * - styling.ts - Tailwind/CSS utilities
 * - formatting.ts - Number and text formatting
 * - dates.ts - Date and time formatting
 * - files.ts - File operations and validation
 * - helpers.ts - General utility functions
 */

export * from "./utils/index";
