export type Kommune = { slug: string; name: string; code: number };

export const KOMMUNER: Kommune[] = [
  { slug: "albertslund", name: "Albertslund", code: 165 },
  { slug: "alleroed", name: "Allerød", code: 201 },
  { slug: "assens", name: "Assens", code: 420 },
  { slug: "ballerup", name: "Ballerup", code: 151 },
  { slug: "billund", name: "Billund", code: 530 },
  { slug: "bornholm", name: "Bornholm", code: 400 },
  { slug: "broendby", name: "Brøndby", code: 153 },
  { slug: "broenderslev", name: "Brønderslev", code: 810 },
  { slug: "dragoer", name: "Dragør", code: 155 },
  { slug: "egedal", name: "Egedal", code: 240 },
  { slug: "esbjerg", name: "Esbjerg", code: 561 },
  { slug: "fanoe", name: "Fanø", code: 563 },
  { slug: "favrskov", name: "Favrskov", code: 710 },
  { slug: "faxe", name: "Faxe", code: 320 },
  { slug: "fredensborg", name: "Fredensborg", code: 210 },
  { slug: "fredericia", name: "Fredericia", code: 607 },
  { slug: "frederiksberg", name: "Frederiksberg", code: 147 },
  { slug: "frederikshavn", name: "Frederikshavn", code: 813 },
  { slug: "frederikssund", name: "Frederikssund", code: 250 },
  { slug: "furesoe", name: "Furesø", code: 190 },
  { slug: "faaborg-midtfyn", name: "Faaborg-Midtfyn", code: 430 },
  { slug: "gentofte", name: "Gentofte", code: 157 },
  { slug: "gladsaxe", name: "Gladsaxe", code: 159 },
  { slug: "glostrup", name: "Glostrup", code: 161 },
  { slug: "greve", name: "Greve", code: 253 },
  { slug: "gribskov", name: "Gribskov", code: 270 },
  { slug: "guldborgsund", name: "Guldborgsund", code: 376 },
  { slug: "haderslev", name: "Haderslev", code: 510 },
  { slug: "halsnaes", name: "Halsnæs", code: 260 },
  { slug: "hedensted", name: "Hedensted", code: 766 },
  { slug: "helsingoer", name: "Helsingør", code: 217 },
  { slug: "herlev", name: "Herlev", code: 163 },
  { slug: "herning", name: "Herning", code: 657 },
  { slug: "hilleroed", name: "Hillerød", code: 219 },
  { slug: "hjoerring", name: "Hjørring", code: 860 },
  { slug: "holbaek", name: "Holbæk", code: 316 },
  { slug: "holstebro", name: "Holstebro", code: 661 },
  { slug: "horsens", name: "Horsens", code: 615 },
  { slug: "hvidovre", name: "Hvidovre", code: 167 },
  { slug: "hoeje-taastrup", name: "Høje-Taastrup", code: 169 },
  { slug: "hoersholm", name: "Hørsholm", code: 223 },
  { slug: "ikast-brande", name: "Ikast-Brande", code: 756 },
  { slug: "ishoej", name: "Ishøj", code: 183 },
  { slug: "jammerbugt", name: "Jammerbugt", code: 849 },
  { slug: "kalundborg", name: "Kalundborg", code: 326 },
  { slug: "kerteminde", name: "Kerteminde", code: 440 },
  { slug: "kolding", name: "Kolding", code: 621 },
  { slug: "koebenhavn", name: "København", code: 101 },
  { slug: "koege", name: "Køge", code: 259 },
  { slug: "langeland", name: "Langeland", code: 482 },
  { slug: "lejre", name: "Lejre", code: 350 },
  { slug: "lemvig", name: "Lemvig", code: 665 },
  { slug: "lolland", name: "Lolland", code: 360 },
  { slug: "lyngby-taarbaek", name: "Lyngby-Taarbæk", code: 173 },
  { slug: "laesoe", name: "Læsø", code: 825 },
  { slug: "mariagerfjord", name: "Mariagerfjord", code: 846 },
  { slug: "middelfart", name: "Middelfart", code: 410 },
  { slug: "morsoe", name: "Morsø", code: 773 },
  { slug: "norddjurs", name: "Norddjurs", code: 707 },
  { slug: "nordfyns", name: "Nordfyns", code: 480 },
  { slug: "nyborg", name: "Nyborg", code: 450 },
  { slug: "naestved", name: "Næstved", code: 370 },
  { slug: "odder", name: "Odder", code: 727 },
  { slug: "odense", name: "Odense", code: 461 },
  { slug: "odsherred", name: "Odsherred", code: 306 },
  { slug: "randers", name: "Randers", code: 730 },
  { slug: "rebild", name: "Rebild", code: 840 },
  { slug: "ringkoebing-skjern", name: "Ringkøbing-Skjern", code: 760 },
  { slug: "ringsted", name: "Ringsted", code: 329 },
  { slug: "roskilde", name: "Roskilde", code: 265 },
  { slug: "rudersdal", name: "Rudersdal", code: 230 },
  { slug: "roedovre", name: "Rødovre", code: 175 },
  { slug: "samsoe", name: "Samsø", code: 741 },
  { slug: "silkeborg", name: "Silkeborg", code: 740 },
  { slug: "skanderborg", name: "Skanderborg", code: 746 },
  { slug: "skive", name: "Skive", code: 779 },
  { slug: "slagelse", name: "Slagelse", code: 330 },
  { slug: "solroed", name: "Solrød", code: 269 },
  { slug: "soroe", name: "Sorø", code: 340 },
  { slug: "stevns", name: "Stevns", code: 336 },
  { slug: "struer", name: "Struer", code: 671 },
  { slug: "svendborg", name: "Svendborg", code: 479 },
  { slug: "syddjurs", name: "Syddjurs", code: 706 },
  { slug: "soenderborg", name: "Sønderborg", code: 540 },
  { slug: "thisted", name: "Thisted", code: 787 },
  { slug: "toender", name: "Tønder", code: 550 },
  { slug: "taarnby", name: "Tårnby", code: 185 },
  { slug: "vallensbaek", name: "Vallensbæk", code: 187 },
  { slug: "varde", name: "Varde", code: 573 },
  { slug: "vejen", name: "Vejen", code: 575 },
  { slug: "vejle", name: "Vejle", code: 630 },
  { slug: "vesthimmerlands", name: "Vesthimmerlands", code: 820 },
  { slug: "viborg", name: "Viborg", code: 791 },
  { slug: "vordingborg", name: "Vordingborg", code: 390 },
  { slug: "aeroe", name: "Ærø", code: 492 },
  { slug: "aabenraa", name: "Aabenraa", code: 580 },
  { slug: "aalborg", name: "Aalborg", code: 851 },
  { slug: "aarhus", name: "Aarhus", code: 751 },
];

export function kommuneBySlug(slug: string): Kommune | undefined {
  return KOMMUNER.find((k) => k.slug === slug);
}

export function kommuneByCode(code: number | string): Kommune | undefined {
  const n = typeof code === "number" ? code : Number(String(code).replace(/\D/g, ""));
  if (!Number.isFinite(n)) return undefined;
  return KOMMUNER.find((k) => k.code === n);
}

export function slugifyKommuneName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/æ/g, "ae")
    .replace(/ø/g, "oe")
    .replace(/å/g, "aa")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function kommuneByName(name: string): Kommune | undefined {
  const needle = name.trim().toLowerCase();
  if (!needle) return undefined;
  const exact = KOMMUNER.find((k) => k.name.toLowerCase() === needle);
  if (exact) return exact;
  const slug = slugifyKommuneName(name);
  return KOMMUNER.find((k) => k.slug === slug);
}

export function searchKommuner(query: string, limit = 8): Kommune[] {
  const q = query.trim().toLowerCase();
  if (!q) return KOMMUNER.slice(0, limit);
  const slug = slugifyKommuneName(q);
  return KOMMUNER.filter(
    (k) =>
      k.name.toLowerCase().includes(q) ||
      k.slug.includes(q) ||
      k.slug.includes(slug) ||
      String(k.code).includes(q),
  ).slice(0, limit);
}
