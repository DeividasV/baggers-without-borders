import { calculatePasswordStrength } from "@/src/lib/passwordStrength";

type PasswordStrengthIndicatorProps = {
  password: string;
  prefixLabel?: string;
  showCharacterCount?: boolean;
};

export default function PasswordStrengthIndicator({
  password,
  prefixLabel,
  showCharacterCount = true,
}: PasswordStrengthIndicatorProps) {
  const passwordStrength = calculatePasswordStrength(password);

  const labelColorClass =
    passwordStrength.strength === 100
      ? "text-green-400"
      : passwordStrength.strength === 75
      ? "text-yellow-400"
      : passwordStrength.strength === 50
      ? "text-orange-400"
      : passwordStrength.strength === 0
      ? "text-gray-500"
      : "text-red-400";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className={`font-medium ${labelColorClass}`}>
          {prefixLabel ? (
            <>
              <span className="text-gray-400 font-normal">{prefixLabel} </span>
              {passwordStrength.label}
            </>
          ) : (
            passwordStrength.label
          )}
        </span>
        {showCharacterCount && (
          <span className="text-gray-500">{password.length} characters</span>
        )}
      </div>
      <div className="h-1.5 bg-dark-600 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${passwordStrength.color}`}
          style={{ width: `${passwordStrength.strength}%` }}
        />
      </div>
    </div>
  );
}
