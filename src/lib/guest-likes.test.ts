import { describe, expect, it } from "vitest";
import { guestLikeToken, GUEST_LIKE_KEY } from "./guest-likes";

describe("guest likes", () => {
  it("gives an unregistered visitor a persistent identity without an account", () => {
    const values = new Map<string, string>();
    const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } };
    const token = "a13d9d0a-34af-4d55-9be4-f0b18f4233fb";
    expect(guestLikeToken(storage, () => token)).toBe(token);
    expect(values.get(GUEST_LIKE_KEY)).toBe(token);
    expect(guestLikeToken(storage, () => "different-browser")).toBe(token);
  });
});