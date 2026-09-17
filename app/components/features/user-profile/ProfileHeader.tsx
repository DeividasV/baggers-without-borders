import Link from "next/link";
import { Edit3 } from "lucide-react";
import Button from "@/ui/Button";
import type { User as UserType } from "@/src/types";

interface ProfileHeaderProps {
  user: UserType;
  isEditing: boolean;
  saving: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onBack: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
  isSelfProfile?: boolean;
  isLoadingCount?: boolean;
  onSaveAndClose?: () => void;
}

export default function ProfileHeader({
  user,
  isEditing,
  saving,
  onEdit,
  onSave,
  onCancel,
  onBack,
  onDelete,
  isDeleting = false,
  isSelfProfile = false,
  isLoadingCount = false,
  onSaveAndClose,
}: ProfileHeaderProps) {
  const getDeleteButtonTitle = () => {
    if (isSelfProfile) return "Cannot delete your own account";
    if (isLoadingCount) return "Loading member data...";
    return "Delete this member permanently";
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="min-w-0 flex-1">
        <h2 className="text-xl sm:text-2xl font-bold text-primary-400 truncate">
          {user.displayName}
        </h2>
        <p className="text-sm text-gray-400 truncate">{user.username}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2 shrink-0 sm:flex-nowrap">
        {!isEditing ? (
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={onBack}
              className="whitespace-nowrap"
            >
              Back to List
            </Button>
            <Link
              href={`/admin/data-entry?member=${user.id}&sortBy=member.displayName&sortOrder=asc`}
              className="inline-flex"
            >
              <Button
                variant="secondary"
                size="sm"
                className="whitespace-nowrap"
              >
                <Edit3 className="h-4 w-4 mr-1.5" />
                <span className="hidden sm:inline">Data Entry</span>
              </Button>
            </Link>
            {onDelete && (
              <Button
                variant="danger"
                size="sm"
                onClick={onDelete}
                disabled={isSelfProfile || isLoadingCount || isDeleting}
                className="whitespace-nowrap"
                title={getDeleteButtonTitle()}
              >
                Delete
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={onEdit}
              className="whitespace-nowrap"
            >
              Edit
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={onCancel}
              disabled={saving}
              className="whitespace-nowrap"
            >
              Cancel
            </Button>
            {onSaveAndClose && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onSaveAndClose}
                disabled={saving}
                className="whitespace-nowrap"
              >
                {saving ? "Saving..." : "Save & Close"}
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={onSave}
              disabled={saving}
              className="whitespace-nowrap"
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
