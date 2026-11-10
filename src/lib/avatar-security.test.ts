import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(new URL("../../drizzle/migrations/0015_bind_avatar_writes_to_owner.sql", import.meta.url), "utf8");

describe("avatar ownership policies", () => {
  const policies = migration.split("ALTER POLICY").slice(1);
  it.each(["upload", "update", "delete"])("binds avatar %s to the signed-in owner", (action) => {
    const policy = policies.find((sql) => sql.startsWith(` "Authenticated ${action} avatar"`));
    expect(policy).toBeDefined();
    expect(policy).toContain("TO authenticated");
    expect(policy).toContain("owner_id = (SELECT auth.uid()::text)");
    expect(policy).not.toMatch(/\bOR\b|\bLIKE\b/);
  });
  it("checks ownership in both update clauses", () => {
    const policy = policies.find((sql) => sql.startsWith(' "Authenticated update avatar"')) ?? "";
    expect(policy.match(/owner_id = \(SELECT auth.uid\(\)::text\)/g)).toHaveLength(2);
  });
});