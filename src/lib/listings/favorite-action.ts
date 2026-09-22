export function needsUnsaveConfirm(saved: boolean, note?: string | null): boolean {
  return saved && Boolean(note?.trim());
}
