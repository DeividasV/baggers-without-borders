import { TextareaHTMLAttributes, forwardRef, ReactNode, useId } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string | ReactNode;
  maxLength?: number;
  showCharCount?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      className = "",
      required,
      id: providedId,
      maxLength,
      showCharCount = false,
      value,
      defaultValue,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = providedId || generatedId;
    const errorId = `${id}-error`;
    const helperId = `${id}-helper`;
    const charCountId = `${id}-char-count`;
    const currentLength =
      typeof value === "string"
        ? value.length
        : typeof defaultValue === "string"
          ? defaultValue.length
          : 0;

    const describedBy = [
      error ? errorId : null,
      helperText ? helperId : null,
      showCharCount && maxLength ? charCountId : null,
    ]
      .filter(Boolean)
      .join(" ");
    const isNearLimit = !!maxLength && currentLength >= maxLength * 0.9;

    return (
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          {label && (
            <label htmlFor={id} className="block text-sm font-medium text-gray-300">
              {label}
              {required && <span className="text-red-400 ml-1">*</span>}
            </label>
          )}
          {showCharCount && maxLength && (
            <span
              id={charCountId}
              aria-live="polite"
              aria-atomic="true"
              className={`shrink-0 text-xs tabular-nums ${
                isNearLimit ? "text-yellow-400" : "text-gray-400"
              }`}
            >
              {currentLength} / {maxLength}
            </span>
          )}
        </div>
        <textarea
          id={id}
          ref={ref}
          className={`input-field w-full min-h-32 text-base leading-6 resize-y ${
            error ? "border-red-500 focus:ring-red-500" : ""
          } ${className}`}
          required={required}
          aria-invalid={!!error}
          aria-describedby={describedBy || undefined}
          maxLength={maxLength}
          value={value}
          defaultValue={defaultValue}
          {...props}
        />
        {error && (
          <p id={errorId} role="alert" className="text-sm text-red-400">
            {error}
          </p>
        )}
        {helperText && !error && (
          <div id={helperId} className="text-xs text-gray-400">
            {helperText}
          </div>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export default Textarea;
