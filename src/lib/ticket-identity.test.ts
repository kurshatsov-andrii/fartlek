import { describe, expect, it } from "vitest";
import { ticketBibName, ticketTeamName } from "./ticket-identity";

describe("Ticket team identity", () => {
  it("uses the saved team name for the team bib instead of the account name", () => {
    const registration = { team_name: "Фартлек", athletes: { full_name: "Андрій Куршацов" } };
    expect(ticketTeamName(registration)).toBe("Фартлек");
    expect(ticketBibName(registration, "Андрій Куршацов")).toBe("Фартлек");
  });
  it("preserves the athlete name for an individual registration", () => {
    expect(ticketBibName({ team_name: null, athletes: { full_name: "Олена" } }, "Андрій")).toBe("Олена");
  });
  it("does not invent a team from an empty field or the account profile", () => {
    expect(ticketTeamName({ team_name: "  " })).toBeNull();
    expect(ticketBibName({ team_name: "  " }, "Андрій")).toBe("Андрій");
  });
});