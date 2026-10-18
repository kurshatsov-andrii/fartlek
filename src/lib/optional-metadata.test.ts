import { describe, expect, it } from "vitest";
import { optionalMetadata } from "./optional-metadata";

describe("optional public metadata", () => {
  it("uses fallback metadata when the RPC transport fails", async () => {
    expect(await optionalMetadata(() => Promise.reject(new TypeError("Failed to fetch")))).toBeNull();
  });
  it("keeps successful metadata", async () => {
    const metadata = { title: "Race" };
    expect(await optionalMetadata(() => Promise.resolve(metadata))).toBe(metadata);
  });
  it("does not hide programming errors", async () => {
    await expect(optionalMetadata(() => Promise.reject(new Error("Invalid result")))).rejects.toThrow("Invalid result");
  });
});