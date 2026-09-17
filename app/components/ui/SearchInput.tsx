import { InputHTMLAttributes } from "react";
import { Search } from "lucide-react";

interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
  showClearButton?: boolean;
}

export default function SearchInput({
  className = "",
  onClear,
  showClearButton = false,
  disabled = false,
  ...props
}: SearchInputProps) {
  return (
    <div className="relative">
      <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${disabled ? 'text-gray-500' : 'text-gray-400'}`} />
      <input
        type="text"
        disabled={disabled}
        className={`input-field pl-10 w-full disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
        {...props}
      />
    </div>
  );
}
