import { describe, expect, it } from "vitest";
import { isValidElement, type ReactNode } from "react";
import { isInternalArticleLink, linkifyText } from "./linkify";

function collect(nodes: ReactNode[]) {
  const hrefs: string[] = [];
  const classes: string[] = [];
  const walk = (node: ReactNode) => {
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (isValidElement(node)) {
      const props = node.props as { href?: string; className?: string; children?: ReactNode };
      if (typeof props.href === "string") hrefs.push(props.href);
      if (typeof props.className === "string") classes.push(props.className);
      walk(props.children);
    }
  };
  nodes.forEach(walk);
  return { hrefs, classes };
}

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

describe("race dates are never phone links", () => {
  it("keeps a dotted date as plain colored text without a tel link", () => {
    const { hrefs, classes } = collect(linkifyText("Дата: 29.11.2026"));
    expect(hrefs).toEqual([]);
    expect(classes).toContain("text-primary");
  });

  it("keeps an ISO date and a date with a start time unlinked", () => {
    expect(collect(linkifyText("2026-11-14")).hrefs).toEqual([]);
    expect(collect(linkifyText("Дата: 14.11.2026 08:00")).hrefs).toEqual([]);
  });

  it("keeps a dash-separated date unlinked", () => {
    expect(collect(linkifyText("Дата: 29-11-2026")).hrefs).toEqual([]);
  });

  it("still links real phone numbers and source URLs", () => {
    expect(collect(linkifyText("Телефон: +38 (066) 468 81 51")).hrefs).toEqual([
      "tel:+380664688151",
    ]);
    expect(collect(linkifyText("Телефон: 066.468.81.51")).hrefs).toEqual(["tel:0664688151"]);
    expect(collect(linkifyText("Джерело: https://zabig.com.ua")).hrefs).toEqual([
      "https://zabig.com.ua",
    ]);
  });
});
