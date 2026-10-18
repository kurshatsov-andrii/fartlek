/** Metadata is optional: a transport failure must not prevent page navigation. */
export async function optionalMetadata<T>(request: () => Promise<T>): Promise<T | null> {
  try {
    return await request();
  } catch (error) {
    if (error instanceof TypeError && /fetch|network|load failed/i.test(error.message)) return null;
    throw error;
  }
}