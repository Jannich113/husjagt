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
  streetSearch: { enabled: true, label: "Søg på vej og adresse" },
  keywords: { enabled: true, label: "Nøgleord i teksten" },
  photoGallery: { enabled: true, label: "Fotogalleri på boligen" },
  dismiss: { enabled: true, label: "Skjul boliger" },
  notes: { enabled: true, label: "Noter på gemte boliger" },
} as const;

export type HuntModuleId = keyof typeof HUNT_MODULES;

export function moduleOn(id: HuntModuleId): boolean {
  return HUNT_MODULES[id].enabled;
}
