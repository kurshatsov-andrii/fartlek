/**
 * Compatibility wrapper for call sites migrated from
 * supabase.functions.invoke() to TanStack server functions.
 * Preserves the { data, error } tuple shape so page logic stays unchanged.
 */
export async function invokeCompat<TInput, TResult>(
  fn: (opts: { data: TInput }) => Promise<TResult>,
  body: TInput,
): Promise<{ data: TResult | null; error: Error | null }> {
  try {
    const data = await fn({ data: body });
    return { data, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e : new Error(String(e)) };
  }
}
