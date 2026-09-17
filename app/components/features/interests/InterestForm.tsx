"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { X, Trash2, AlertTriangle } from "lucide-react";
import Button from "@/ui/Button";
import MarkdownTextarea from "@/ui/MarkdownTextarea";
import ConfirmationDialog from "@/ui/ConfirmationDialog";

type Interest = {
  id: string;
  name: string;
  description?: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    userInterests: number;
  };
};

interface InterestFormProps {
  mode: "create" | "edit";
  interestId?: string;
}

export default function InterestForm({
  mode = "create",
  interestId,
}: InterestFormProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [existingInterest, setExistingInterest] = useState<Interest | null>(
    null
  );
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    displayOrder: 0,
    isActive: true,
  });
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const hasInitialized = useRef(false);

  // Validation function
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required.";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Mark field as touched
  const handleBlur = (field: string) => {
    setTouched({ ...touched, [field]: true });
  };

  useEffect(() => {
    // Only run once on mount
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    if (!session) return;
    if (!session?.user?.role || session.user.role !== "ADMIN") {
      router.push("/");
      return;
    }

    if (mode === "edit" && interestId) {
      fetchInterest(interestId);
    }
  }, []); // Empty dependency array - only run once on mount

  const fetchInterest = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/interests/${id}`);
      if (response.ok) {
        const data = await response.json();
        setExistingInterest(data);
        setFormData({
          name: data.name,
          description: data.description || "",
          displayOrder: data.displayOrder,
          isActive: data.isActive,
        });
      } else {
        const returnTo = searchParams.get("returnTo");
        router.push(returnTo || "/admin/interests");
      }
    } catch (error) {
      console.error("Error fetching interest:", error);
      const returnTo = searchParams.get("returnTo");
      router.push(returnTo || "/admin/interests");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      name: true,
      description: true,
      displayOrder: true,
    });

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const url =
        mode === "create" ? "/api/interests" : `/api/interests/${interestId}`;
      const method = mode === "create" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowSuccess(true);
        setTimeout(() => {
          const returnTo = searchParams.get("returnTo");
          router.push(returnTo || "/admin/interests");
        }, 1500);
      } else {
        const data = await response.json();
        setErrors({ submit: data.error || "Failed to save interest" });
      }
    } catch (error) {
      setErrors({ submit: "An error occurred while saving" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!interestId) return;

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/interests/${interestId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        const returnTo = searchParams.get("returnTo");
        router.push(returnTo || "/admin/interests");
      } else {
        const data = await response.json();
        setErrors({ submit: data.error || "Failed to delete interest" });
        setShowDeleteConfirmation(false);
      }
    } catch (error) {
      setErrors({ submit: "An error occurred while deleting" });
      setShowDeleteConfirmation(false);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!session || session.user.role !== "ADMIN") {
    return null;
  }

  if (loading && mode === "edit") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-primary-400">Loading interest...</div>
      </div>
    );
  }

  const pageTitle = mode === "create" ? "Create Interest" : "Edit Interest";

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="card">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="text-xl sm:text-2xl font-bold text-primary-400">
                {pageTitle}
              </h2>
              <p className="text-sm text-gray-400">
                {mode === "create"
                  ? "Add a new user interest"
                  : "Update interest details"}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {mode === "edit" && existingInterest && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setShowDeleteConfirmation(true)}
                  disabled={
                    existingInterest._count.userInterests > 0 || isDeleting
                  }
                >
                  Delete
                </Button>
              )}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const returnTo = searchParams.get("returnTo");
                  router.push(returnTo || "/admin/interests");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  const form = document.querySelector("form");
                  if (form) {
                    form.dispatchEvent(
                      new Event("submit", { cancelable: true, bubbles: true })
                    );
                  }
                }}
                disabled={loading}
              >
                {loading ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="card bg-green-900/20 border-green-700/50">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <p className="text-green-400 font-medium">
                Interest {mode === "create" ? "created" : "updated"}!
                Redirecting...
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {errors.submit && (
          <div className="card bg-red-900/20 border-red-700/50">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0" />
              <p className="text-red-400">{errors.submit}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="card space-y-6">
          {/* Name */}
          <div>
            <label
              htmlFor="interest-name"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              id="interest-name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              onBlur={() => handleBlur("name")}
              className={`input-field w-full ${
                touched.name && errors.name
                  ? "border-red-500 focus:border-red-500"
                  : ""
              }`}
              placeholder="e.g., Hiking"
              disabled={loading}
            />
            {touched.name && errors.name && (
              <p className="mt-1 text-sm text-red-400">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <MarkdownTextarea
              label="Description"
              value={formData.description}
              onChange={(value) =>
                setFormData({ ...formData, description: value })
              }
              placeholder="Optional description of this interest (Markdown supported)"
              rows={4}
              disabled={loading}
              helperText="Supports Markdown formatting"
            />
          </div>

          {/* Display Order */}
          <div>
            <label
              htmlFor="displayOrder"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Display Order
            </label>
            <input
              type="number"
              id="displayOrder"
              value={formData.displayOrder}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  displayOrder: parseInt(e.target.value) || 0,
                })
              }
              className="input-field w-full"
              disabled={loading}
            />
            <p className="mt-1 text-sm text-gray-500">
              Controls the order in which interests are displayed
            </p>
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between p-4 bg-dark-800 rounded-lg border border-dark-600">
            <div>
              <label
                htmlFor="isActive"
                className="text-sm font-medium text-gray-300"
              >
                Active Status
              </label>
              <p className="text-sm text-gray-500 mt-1">
                Inactive interests are hidden from users
              </p>
            </div>
            <div className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className="sr-only peer"
                disabled={loading}
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </div>
          </div>
        </form>

        {/* Warning Message for Deletion */}
        {mode === "edit" && existingInterest && (
          <div className="card">
            {existingInterest._count.userInterests > 0 ? (
              <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div className="flex-1">
                    <h3 className="text-yellow-400 font-semibold mb-1">
                      This interest is assigned to{" "}
                      {existingInterest._count.userInterests} user(s)
                    </h3>
                    <p className="text-sm text-yellow-300">
                      It cannot be deleted while in use. You can deactivate it
                      instead.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">ℹ️</span>
                  <div className="flex-1">
                    <h3 className="text-blue-400 font-semibold mb-1">
                      This interest can be deleted
                    </h3>
                    <p className="text-sm text-blue-300">
                      No users have been assigned this interest yet.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteConfirmation}
        onClose={() => setShowDeleteConfirmation(false)}
        onConfirm={handleDelete}
        title="Delete Interest"
        message={`Are you sure you want to delete "${existingInterest?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        loading={isDeleting}
      />
    </>
  );
}
