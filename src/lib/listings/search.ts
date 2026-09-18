import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { mergeSearchResults } from "./aggregate";
import { searchBoliga } from "./boliga.server";
import { getBoligsidenCase, searchBoligsiden, snapshotSearch } from "./boligsiden.server";
import { listenPrivateAds, listenSocial as runSocialListen } from "./social.server";
import { DEFAULT_FILTERS } from "./types";

const filtersSchema = z.object({
  municipality: z.string().min(1).max(80),
  types: z.array(z.string()).max(12),
  priceMin: z.number().nonnegative().nullable(),
  priceMax: z.number().nonnegative().nullable(),
  roomsMin: z.number().int().nonnegative().nullable(),
  roomsMax: z.number().int().nonnegative().nullable(),
  areaMin: z.number().nonnegative().nullable(),
  areaMax: z.number().nonnegative().nullable(),
  lotMin: z.number().nonnegative().nullable(),
  lotMax: z.number().nonnegative().nullable(),
  yearFrom: z.number().int().min(1600).max(2100).nullable(),
  yearTo: z.number().int().min(1600).max(2100).nullable(),
  energyLabels: z.array(z.string()).max(8),
  expenseMax: z.number().nonnegative().nullable(),
  m2PriceMax: z.number().nonnegative().nullable(),
  daysMax: z.number().int().nonnegative().nullable(),
  zipCode: z.string().max(8).nullable(),
  city: z.string().max(80).nullable(),
  basement: z.boolean(),
  balcony: z.boolean(),
  terrace: z.boolean(),
  elevator: z.boolean(),
  priceDropOnly: z.boolean(),
  freshOnly: z.boolean(),
  sortBy: z.enum([
    "price",
    "daysListed",
    "timeOnMarket",
    "perAreaPrice",
    "monthlyExpense",
    "lotArea",
    "housingArea",
  ]),
  sortAscending: z.boolean(),
  page: z.number().int().min(1).max(40),
  perPage: z.number().int().min(10).max(50),
  bounds: z
    .object({
      minLon: z.number(),
      minLat: z.number(),
      maxLon: z.number(),
      maxLat: z.number(),
    })
    .nullable(),
});

const listenSchema = filtersSchema.extend({
  socialAccounts: z.array(z.string().max(80)).max(30).optional(),
  socialTags: z.array(z.string().max(40)).max(40).optional(),
});

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => {
      setTimeout(() => resolve(fallback), ms);
    }),
  ]);
}

const EMPTY_BOLIGA = {
  totalHits: 0,
  listings: [],
  live: false,
  source: "Boliga",
  sources: [] as string[],
};

export const searchHousesFast = createServerFn({ method: "POST" })
  .validator(filtersSchema)
  .handler(async ({ data }) => {
    return snapshotSearch({ ...DEFAULT_FILTERS, ...data });
  });

export const searchHouses = createServerFn({ method: "POST" })
  .validator(filtersSchema)
  .handler(async ({ data }) => {
    const filters = { ...DEFAULT_FILTERS, ...data };
    const [boligsiden, boliga, classifieds] = await Promise.all([
      searchBoligsiden(filters),
      withTimeout(searchBoliga(filters).catch(() => EMPTY_BOLIGA), 4500, EMPTY_BOLIGA),
      withTimeout(listenPrivateAds(filters).catch(() => []), 4500, []),
    ]);
    return mergeSearchResults(filters, [boligsiden, boliga], classifieds);
  });

export const listenSocial = createServerFn({ method: "POST" })
  .validator(listenSchema)
  .handler(async ({ data }) => {
    const { socialAccounts, socialTags, ...rest } = data;
    return runSocialListen(
      { ...DEFAULT_FILTERS, ...rest },
      { accounts: socialAccounts, tags: socialTags },
    );
  });

export const getListing = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().min(1).max(80) }))
  .handler(async ({ data }) => {
    return getBoligsidenCase(data.id);
  });
