/**
 * Listing backends. Set `enabled: false` (or delete the entry) to drop a source
 * without touching the rest of the hunt.
 */
export const HUNT_SOURCES = {
  boligsiden: { id: "boligsiden", label: "Boligsiden", enabled: true, timeoutMs: 22000 },
  boliga: { id: "boliga", label: "Boliga", enabled: true, timeoutMs: 16000 },
  classifieds: { id: "classifieds", label: "GulogGratis / DBA", enabled: true, timeoutMs: 8000 },
} as const;

export type HuntSourceId = keyof typeof HUNT_SOURCES;

export function sourceEnabled(id: HuntSourceId): boolean {
  return HUNT_SOURCES[id].enabled;
}
