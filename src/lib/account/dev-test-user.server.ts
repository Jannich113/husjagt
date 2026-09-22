import { getSql } from "@/lib/db";
import { DEV_TEST_LOGIN } from "./dev-test-user";

/** Precomputed Better Auth scrypt hash of `test` — avoid blocking the event loop on boot. */
const TEST_PASSWORD_HASH =
  "54c1903588f3d4d65da5ed4272656b85:af6e5b1bafa42af1479ba6c2ef98d1c91ebe51f901d847b883fd9d15ea3c3c56b983c8f050ed84dd7133f8c877c24dc7fffc18394d2ad6ee3c2aa5c843bc668e";

export async function seedDevTestAccount() {
  if (process.env.DATABASE_URL?.trim()) return;
  const sql = await getSql();
  await sql`
    insert into "user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
    values (
      ${DEV_TEST_LOGIN.id},
      ${DEV_TEST_LOGIN.name},
      ${DEV_TEST_LOGIN.email},
      true,
      now(),
      now()
    )
    on conflict (id) do nothing
  `;
  await sql`
    insert into "account" (
      id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt"
    )
    values (
      ${`${DEV_TEST_LOGIN.id}-credential`},
      ${DEV_TEST_LOGIN.id},
      'credential',
      ${DEV_TEST_LOGIN.id},
      ${TEST_PASSWORD_HASH},
      now(),
      now()
    )
    on conflict (id) do nothing
  `;
}
