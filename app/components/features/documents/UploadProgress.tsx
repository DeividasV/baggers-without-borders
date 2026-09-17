import { Loader2 } from "lucide-react";

interface UploadProgressProps {
  uploadProgress: { [key: string]: number };
}

export default function UploadProgress({
  uploadProgress,
}: UploadProgressProps) {
  if (Object.keys(uploadProgress).length === 0) return null;

  return (
    <div className="bg-dark-800 rounded-lg p-4 space-y-2">
      <div className="text-sm font-medium text-white mb-3">
        Uploading files...
      </div>
      {Object.entries(uploadProgress).map(([filename, progress]) => (
        <div key={filename} className="space-y-1">
          <div className="flex justify-between text-xs text-gray-400">
            <span className="truncate">{filename}</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-dark-600 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
