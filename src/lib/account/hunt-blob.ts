import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import type { HuntBlobPayload } from "./blob";

const payloadSchema = z.object({
  v: z.literal(1),
  savedAt: z.number(),
  stores: z.record(z.string(), z.any()),
});

export const loadHuntBlob = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql<{ payload: HuntBlobPayload | string }>`
      select payload from hunt_blob where user_id = ${context.userId} limit 1
    `;
    const raw = rows[0]?.payload;
    if (!raw) return null;
    const parsed = payloadSchema.parse(typeof raw === "string" ? JSON.parse(raw) : raw);
    return { v: 1 as const, savedAt: parsed.savedAt, stores: parsed.stores as HuntBlobPayload["stores"] };
  });

export const saveHuntBlob = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: HuntBlobPayload) => payloadSchema.parse(input))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const body = JSON.stringify(data);
    if (body.length > 400_000) throw new Error("Konto-data er for stor");
    await sql`
      insert into hunt_blob (user_id, payload, updated_at)
      values (${context.userId}, ${body}::jsonb, now())
      on conflict (user_id) do update set payload = excluded.payload, updated_at = now()
    `;
    return { ok: true as const };
  });
