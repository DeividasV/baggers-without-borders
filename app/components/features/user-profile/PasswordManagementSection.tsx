"use client";

import { useState } from "react";
import Card from "@/ui/Card";
import Button from "@/ui/Button";
import { Copy, Check, Eye, EyeOff } from "lucide-react";
import PasswordStrengthIndicator from "@/ui/PasswordStrengthIndicator";
import {
  generateStrongPassword as generatePassword,
  formatTimeAgo,
  formatDateTimeYMD,
} from "./utils";
import type { User as UserType } from "@/src/types";

interface PasswordManagementSectionProps {
  user: UserType;
  userId: string;
  onPasswordChange: (password: string) => void;
}

export default function PasswordManagementSection({
  user,
  userId,
  onPasswordChange,
}: PasswordManagementSectionProps) {
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const copyTextToClipboard = async (text: string): Promise<boolean> => {
    const value = text?.trim();
    if (!value) return false;

    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(value);
        return true;
      } catch {
        // fall through to legacy fallback
      }
    }

    try {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.setAttribute("readonly", "true");
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      textarea.style.top = "0";
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);
      return ok;
    } catch {
      return false;
    }
  };

  const handleGenerate = () => {
    const password = generatePassword();
    setNewPassword(password);
    setShowPassword(true);
  };

  const handlePasswordChange = async () => {
    if (!newPassword || newPassword.length < 8) {
      alert("Password must be at least 8 characters.");
      return;
    }

    // Call parent handler with password
    onPasswordChange(newPassword);

    // Reset local state
    setNewPassword("");
    setShowPassword(false);
  };

  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-100 mb-6">
        Password Management
      </h3>

      <div className="space-y-2">
        {/* First Line: 50/50 Split - Password Input (Left) | Buttons (Right) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Left: Password Input with Strength Indicator */}
          <div className="space-y-2">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 8 characters)"
                autoComplete="new-password"
                data-form-type="other"
                data-lpignore="true"
                className="w-full h-[38px] px-4 py-2 pr-20 bg-dark-700 border border-dark-500 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {newPassword && (
                  <button
                    type="button"
                    onClick={async () => {
                      const ok = await copyTextToClipboard(newPassword);
                      if (!ok) {
                        alert(
                          "Copy failed. Your browser may block clipboard access (requires HTTPS or localhost)."
                        );
                        return;
                      }

                      setCopiedPassword(true);
                      setTimeout(() => setCopiedPassword(false), 2000);
                    }}
                    className="text-gray-400 hover:text-gray-300 transition-colors"
                    title="Copy password"
                  >
                    {copiedPassword ? (
                      <Check className="h-4 w-4 text-green-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-300 transition-colors"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <PasswordStrengthIndicator password={newPassword} />
          </div>

          {/* Right: Action Buttons */}
          <div className="space-y-2">
            <div className="flex flex-col md:flex-row gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleGenerate}
                className="h-[38px] md:flex-1 w-full"
              >
                Generate
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handlePasswordChange}
                disabled={
                  !newPassword || newPassword.length < 8 || changingPassword
                }
                className="h-[38px] md:flex-1 w-full"
              >
                {changingPassword ? "Changing..." : "Change Password"}
              </Button>
            </div>

            {/* Last Changed - Below Buttons */}
            <div className="text-xs text-gray-400">
              <span>Last changed: </span>
              {user.passwordChangedAt ? (
                <>
                  <span className="text-gray-400">
                    {formatTimeAgo(user.passwordChangedAt)}
                  </span>
                  <span className="text-gray-500">
                    {" "}
                    ({formatDateTimeYMD(user.passwordChangedAt)})
                  </span>
                </>
              ) : (
                <span className="text-gray-400 italic">Never changed</span>
              )}
            </div>
          </div>
        </div>

        {/* Second Line: Password Requirements */}
        <div className="text-xs">
          <ul className="text-blue-200/60 space-y-1 list-disc list-inside">
            <li>Minimum 8 characters (recommended: 18+ for strong security)</li>
            <li>
              Include letters (a-z, A-Z), numbers (0-9), and special characters
            </li>
            <li>Use the Generate button for a secure 18-character password</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}
