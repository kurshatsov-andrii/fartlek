export const GUEST_LIKE_KEY = "fartlek-guest-likes-token";

export function guestLikeToken(storage: Pick<Storage, "getItem" | "setItem">, create: () => string): string {
  const current = storage.getItem(GUEST_LIKE_KEY);
  if (current && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(current)) return current;
  const token = create();
  storage.setItem(GUEST_LIKE_KEY, token);
  return token;
}