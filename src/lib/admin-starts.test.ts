import { describe, expect, it } from "vitest";
import { ADMIN_STARTS_ORDER, fetchAdminStarts } from "./admin-starts";

type Call = { column: string; options: { ascending: boolean; nullsFirst: boolean } };
type Row = { id: string; title: string; created_at: string };

const ROWS: Row[] = [
  { id: "newest", title: "ЛІСОТРЕЙЛ 2.0", created_at: "2026-11-26T09:43:31Z" },
  { id: "older", title: "Winter Trail", created_at: "2026-11-20T08:00:00Z" },
];

function sourceWith(calls: Call[], data: unknown[] | null = ROWS) {
  const chain = {
    order(column: string, options: { ascending: boolean; nullsFirst: boolean }) {
      calls.push({ column, options });
      return chain;
    },
    then(resolve: (value: { data: unknown[] | null }) => void) {
      resolve({ data });
    },
  };
  return {
    from(table: "telegram_starts") {
      return { select: (_columns: "*") => chain };
    },
  };
}

describe("admin starts listing order", () => {
  it("asks the backend for the newest added starts first", async () => {
    const calls: Call[] = [];
    const rows = await fetchAdminStarts<Row>(sourceWith(calls));

    expect(calls).toEqual([
      { column: "created_at", options: { ascending: false, nullsFirst: false } },
      { column: "event_date", options: { ascending: true, nullsFirst: false } },
    ]);
    expect(rows.map((r) => r.id)).toEqual(["newest", "older"]);
  });

  it("keeps creation date ahead of event date in the declared order", () => {
    expect(ADMIN_STARTS_ORDER[0]).toEqual({
      column: "created_at",
      ascending: false,
      nullsFirst: false,
    });
  });

  it("returns an empty list instead of null when the backend has no rows", async () => {
    const calls: Call[] = [];
    await expect(fetchAdminStarts<Row>(sourceWith(calls, null))).resolves.toEqual([]);
  });
});
