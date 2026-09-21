import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { liveHuntServices } from "@/lib/hunt/container.server";
import { runGetListing, runHuntSearch } from "@/lib/hunt/run-search";
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
    "similarity",
  ]),
  sortAscending: z.boolean(),
  page: z.number().int().min(1).max(40),
  perPage: z.number().int().min(10).max(50),
  boxes: z
    .array(
      z.object({
        minLon: z.number(),
        minLat: z.number(),
        maxLon: z.number(),
        maxLat: z.number(),
      }),
    )
    .max(8)
    .default([]),
  districts: z.array(z.string().max(40)).max(20).default([]),
  bounds: z
    .object({
      minLon: z.number(),
      minLat: z.number(),
      maxLon: z.number(),
      maxLat: z.number(),
    })
    .nullable()
    .optional(),
});

const listenSchema = filtersSchema.extend({
  socialAccounts: z.array(z.string().max(80)).max(30).optional(),
  socialTags: z.array(z.string().max(40)).max(40).optional(),
});

function huntFilters(data: z.infer<typeof filtersSchema>) {
  return {
    ...DEFAULT_FILTERS,
    ...data,
    boxes: data.boxes?.length ? data.boxes : data.bounds ? [data.bounds] : [],
    districts: data.districts ?? [],
  };
}

export const searchHousesFast = createServerFn({ method: "POST" })
  .validator(filtersSchema)
  .handler(async ({ data }) => {
    return liveHuntServices().snapshot(huntFilters(data));
  });

export const searchHouses = createServerFn({ method: "POST" })
  .validator(filtersSchema)
  .handler(async ({ data }) => {
    return runHuntSearch(liveHuntServices(), huntFilters(data));
  });

export const listenSocial = createServerFn({ method: "POST" })
  .validator(listenSchema)
  .handler(async ({ data }) => {
    const { socialAccounts, socialTags, ...rest } = data;
    return liveHuntServices().social.listen(huntFilters(rest), {
      accounts: socialAccounts,
      tags: socialTags,
    });
  });

export const getListing = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().min(1).max(80) }))
  .handler(async ({ data }) => {
    return runGetListing(liveHuntServices(), data.id);
  });

export const loadKommuneDistricts = createServerFn({ method: "POST" })
  .validator(z.object({ municipality: z.string().min(1).max(80) }))
  .handler(async ({ data }) => {
    const services = liveHuntServices();
    const rows = await services.places.districts(data.municipality);
    services.places.remember?.(data.municipality, rows);
    return rows;
  });

export const suggestDawaPostnumre = createServerFn({ method: "POST" })
  .validator(z.object({ q: z.string().min(1).max(80), municipality: z.string().max(80).optional() }))
  .handler(async ({ data }) => {
    return liveHuntServices().places.suggestPostnumre(data.q, data.municipality);
  });

export const suggestHuntPlaces = createServerFn({ method: "POST" })
  .validator(z.object({ q: z.string().max(80) }))
  .handler(async ({ data }) => {
    return liveHuntServices().places.suggestPlaces(data.q);
  });
