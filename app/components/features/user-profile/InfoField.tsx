interface InfoFieldProps {
  label: string;
  value?: string;
  isLink?: boolean;
}

export default function InfoField({ label, value, isLink }: InfoFieldProps) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-400">{label}</label>
      <div>
        {isLink && value ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-400 hover:text-primary-300 underline break-all"
          >
            {value}
          </a>
        ) : (
          <span className="text-gray-100">
            {value || <span className="text-gray-500 italic">Not set</span>}
          </span>
        )}
      </div>
    </div>
  );
}
