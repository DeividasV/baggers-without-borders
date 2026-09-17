"use client";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  id?: string;
}

export default function Switch({
  checked,
  onChange,
  label,
  disabled = false,
  id,
}: SwitchProps) {
  const handleToggle = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        id={id}
        onClick={handleToggle}
        disabled={disabled}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full
          transition-colors duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-800
          ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
          ${checked ? "bg-primary-600" : "bg-gray-600"}
        `}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full
            bg-white shadow-lg
            transition-transform duration-200 ease-in-out
            ${checked ? "translate-x-6" : "translate-x-1"}
          `}
        />
      </button>
      {label && (
        <label
          htmlFor={id}
          className={`text-sm ${
            disabled
              ? "text-gray-500 cursor-not-allowed"
              : "text-gray-300 cursor-pointer"
          }`}
          onClick={!disabled ? handleToggle : undefined}
        >
          {label}
        </label>
      )}
    </div>
  );
}
