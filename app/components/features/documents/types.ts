export interface Document {
  id: string;
  name: string;
  isFolder: boolean;
  parentId: string | null;
  path: string;
  filename: string | null;
  originalName: string | null;
  mimeType: string | null;
  size: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface BreadcrumbItem {
  id: string | null;
  name: string;
}

export type ViewMode = "grid" | "list";
export type SortBy = "name" | "size" | "modified";
export type SortDirection = "asc" | "desc";
