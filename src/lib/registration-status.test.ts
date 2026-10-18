import { describe, it, expect } from "vitest";
import { deriveRegistrationState as d, canShowRegisterButton as show } from "./registration-status";
const today = "2027-01-10";
describe("registration state", () => {
  it("cancelled wins", () => expect(d({ cancelled: true, defaultOpen: true, date: "2027-05-01", today })).toBe("cancelled"));
  it("past start is closed", () => expect(d({ explicit: "open", date: "2027-01-01", today })).toBe("closed"));
  it("future opening date is expected", () => expect(d({ explicit: "open", opensOn: "2027-02-01", date: "2027-05-01", today })).toBe("expected"));
  it("expected becomes open after opening date", () => expect(d({ explicit: "expected", opensOn: "2027-01-05", date: "2027-05-01", today })).toBe("open"));
  it("external start without verification is unknown", () => expect(d({ date: "2027-05-01", today })).toBe("unknown"));
  it("platform event is open by default", () => expect(d({ defaultOpen: true, date: "2027-05-01", today })).toBe("open"));
  it("card hides register button when admin closed registration", () => expect(show({ explicit: "closed", date: "2027-05-01", today })).toBe(false));
  it("card hides register button for cancelled start", () => expect(show({ explicit: "cancelled", date: "2027-05-01", today })).toBe(false));
  it("card hides register button on event day if closed is unconfirmed", () => expect(show({ date: today, today })).toBe(true));
  it("card hides register button for past start", () => expect(show({ explicit: "open", date: "2027-01-01", today })).toBe(false));
  it("card keeps register button for unconfirmed future start", () => expect(show({ date: "2027-05-01", today })).toBe(true));
});
