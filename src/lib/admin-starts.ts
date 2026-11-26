export interface StartOrderSpec {
  column: string;
  ascending: boolean;
  nullsFirst: boolean;
}

/**
 * Admin /admin/starts listing rule: the most recently added starts come first.
 * `created_at` is the insertion moment, so editing a start never moves it up;
 * `event_date` ascending only breaks ties inside one insertion batch.
 */
export const ADMIN_STARTS_ORDER: readonly StartOrderSpec[] = [
  { column: "created_at", ascending: false, nullsFirst: false },
  { column: "event_date", ascending: true, nullsFirst: false },
];

interface OrderChain {
  order(column: string, options: { ascending: boolean; nullsFirst: boolean }): OrderChain;
}

export interface AdminStartsSource {
  from(table: "telegram_starts"): { select(columns: "*"): OrderChain };
}

export async function fetchAdminStarts<T>(source: AdminStartsSource): Promise<T[]> {
  let chain: OrderChain = source.from("telegram_starts").select("*");
  for (const spec of ADMIN_STARTS_ORDER) {
    chain = chain.order(spec.column, { ascending: spec.ascending, nullsFirst: spec.nullsFirst });
  }
  // The query builder resolves like a promise only once every modifier is applied.
  const { data } = await (chain as unknown as PromiseLike<{ data: T[] | null }>);
  return data ?? [];
}
