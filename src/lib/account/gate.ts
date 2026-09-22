export const KONTO_NEEDS = ["konti", "overvaag", "notes"] as const;
export type KontoNeed = (typeof KONTO_NEEDS)[number];

export const KONTO_COPY: Record<KontoNeed, { title: string; text: string }> = {
  konti: {
    title: "Opret konto",
    text: "Forbindelser og konto-indstillinger gemmes først, når du har en Husjagt-konto.",
  },
  overvaag: {
    title: "Opret konto for at overvåge",
    text: "Overvågning og beskeder om nye boliger gemmes på kontoen. Uden konto gemmes de ikke.",
  },
  notes: {
    title: "Opret konto for noter",
    text: "Noter på gemte boliger ligger på din konto, så de ikke kun bor på denne telefon.",
  },
};

export function parseKontoNeed(value: unknown): KontoNeed | undefined {
  return typeof value === "string" && (KONTO_NEEDS as readonly string[]).includes(value)
    ? (value as KontoNeed)
    : undefined;
}
