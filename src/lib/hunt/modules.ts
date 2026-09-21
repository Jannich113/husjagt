/**
 * Hunt feature switches. Flip a flag to hide UI and skip the matching work.
 * Add a new module here first, then branch on `moduleOn("id")` at the call site.
 */
export const HUNT_MODULES = {
  placePicker: { enabled: true, label: "By- og kommunesøgning" },
  mapDraw: { enabled: true, label: "Tegn område på kortet" },
  districts: { enabled: true, label: "Bydele" },
  odenseSnippet: { enabled: true, label: "Originalt Odense-kortudsnit" },
  listen: { enabled: true, label: "Lyt" },
  socialWatch: { enabled: true, label: "Følg konti og tags" },
  saved: { enabled: true, label: "Gemte huse" },
} as const;

export type HuntModuleId = keyof typeof HUNT_MODULES;

export function moduleOn(id: HuntModuleId): boolean {
  return HUNT_MODULES[id].enabled;
}
