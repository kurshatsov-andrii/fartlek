import { describe, expect, it } from "vitest";
import { imageDeliveryUrl } from "./image-delivery";

const host = "https://storage.example.com";
describe("image delivery", () => {
  it("resizes public posters without cropping or changing their identity", () => {
    const result = new URL(imageDeliveryUrl(`${host}/storage/v1/object/public/event-images/poster.jpg`, 640, 75, host));
    expect(result.pathname).toBe("/storage/v1/render/image/public/event-images/poster.jpg");
    expect(result.searchParams.get("width")).toBe("640");
    expect(result.searchParams.get("quality")).toBe("75");
    expect(result.searchParams.get("resize")).toBe("contain");
  });
  it("leaves external and private media unchanged", () => {
    for (const src of ["https://other.example.com/storage/v1/object/public/a.jpg", `${host}/storage/v1/object/sign/a.jpg`, "/local.jpg", `${host}/storage/v1/object/public/logo.svg`]) {
      expect(imageDeliveryUrl(src, 640, 75, host)).toBe(src);
    }
  });
});