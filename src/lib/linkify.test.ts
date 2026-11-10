import { describe, expect, it } from "vitest";
import { isInternalArticleLink } from "./linkify";

describe("internal article links", () => {
  it("recognizes the article's calendar destination as internal", () => {
    expect(isInternalArticleLink("https://fartlek.com.ua/calendar")).toBe(true);
    expect(isInternalArticleLink("https://www.fartlek.com.ua/calendar")).toBe(true);
  });
  it("does not treat external or lookalike domains as internal", () => {
    expect(isInternalArticleLink("https://youtube.com/watch?v=test")).toBe(false);
    expect(isInternalArticleLink("https://fartlek.com.ua.example.com/calendar")).toBe(false);
  });
});