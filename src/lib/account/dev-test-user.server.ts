import { hashPassword } from "better-auth/crypto";
import { getSql } from "@/lib/db";
import { DEV_TEST_LOGIN } from "./dev-test-user";

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
  const accounts = await sql<{ id: string }>`
    select id from "account"
    where "userId" = ${DEV_TEST_LOGIN.id} and "providerId" = 'credential'
    limit 1
  `;
  if (accounts.length) return;
  const password = await hashPassword(DEV_TEST_LOGIN.password);
  await sql`
    insert into "account" (
      id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt"
    )
    values (
      ${`${DEV_TEST_LOGIN.id}-credential`},
      ${DEV_TEST_LOGIN.id},
      'credential',
      ${DEV_TEST_LOGIN.id},
      ${password},
      now(),
      now()
    )
    on conflict (id) do nothing
  `;
}
