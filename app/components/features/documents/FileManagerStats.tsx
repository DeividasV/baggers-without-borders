import { FileText, Folder, HardDrive } from "lucide-react";
import { Document } from "./types";
import { formatFileSize } from "./utils";
import StatsCard from "@/ui/StatsCard";

interface FileManagerStatsProps {
  documents: Document[];
}

export default function FileManagerStats({ documents }: FileManagerStatsProps) {
  const totalFiles = documents.filter((d) => !d.isFolder).length;
  const totalFolders = documents.filter((d) => d.isFolder).length;
  const totalSize = documents
    .filter((d) => !d.isFolder)
    .reduce((sum, d) => sum + (d.size || 0), 0);

  return (
    <>
      <StatsCard icon={FileText} value={totalFiles} label="Total Files" />
      <StatsCard icon={Folder} value={totalFolders} label="Folders" />
      <StatsCard
        icon={HardDrive}
        value={formatFileSize(totalSize)}
        label="Total Size"
      />
    </>
  );
}
