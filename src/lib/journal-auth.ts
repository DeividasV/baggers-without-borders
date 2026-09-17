import { prisma } from "@/src/lib/prisma";

/**
 * Check if a user is a Journal Editor.
 * Editors are ADMIN users whose IDs are stored in the `journal_editor_ids` AppSetting.
 */
export async function isJournalEditor(userId: string): Promise<boolean> {
  const setting = await prisma.appSetting.findUnique({
    where: { key: "journal_editor_ids" },
  });

  if (!setting?.value) return false;

  try {
    const ids: string[] = JSON.parse(setting.value);
    return Array.isArray(ids) && ids.includes(userId);
  } catch {
    return false;
  }
}
