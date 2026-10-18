import { describe, it, expect } from "vitest";
import {
  reminderDue,
  toggleComparison,
  plannerCalendarEvent,
  plannerAlerts,
  type PlannedStart,
  type StartRef,
} from "./start-planner";
import { buildIcs } from "./calendar";
const refs: StartRef[] = [
  { source: "event", id: "1" },
  { source: "start", id: "2" },
  { source: "calendar", id: "3" },
];
const race: PlannedStart = {
  source: "calendar",
  id: "3",
  title: "Харків 2027",
  date: "2027-05-23",
  time: null,
  location: "Харків",
  distances: "",
  price: null,
  isPaid: null,
  organizer: null,
  url: null,
  image: null,
  registration: { state: "unknown", opensOn: null, sourceUrl: null, sourceLabel: null, checkedOn: null },
};
describe("start planner", () => {
  it("compares no more than three starts", () => {
    expect(toggleComparison(refs, { source: "start", id: "4" })).toEqual(refs);
  });
  it("removes a selected start without mixing sources", () => {
    expect(toggleComparison(refs, { source: "start", id: "2" })).toEqual([
      refs[0],
      refs[2],
    ]);
    expect(
      toggleComparison([{ source: "event", id: "2" }], {
        source: "start",
        id: "2",
      }),
    ).toHaveLength(2);
  });
  it("requires opt-in for an in-app reminder", () => {
    expect(reminderDue("2027-05-23", null, "2027-05-22")).toBe(false);
  });
  it("uses the chosen reminder window and excludes past races", () => {
    expect(reminderDue("2027-05-23", 3, "2027-05-20")).toBe(true);
    expect(reminderDue("2027-05-23", 3, "2027-05-19")).toBe(false);
    expect(reminderDue("2027-05-23", 3, "2027-05-24")).toBe(false);
  });
  it("never invents a start time for the calendar", () => {
    const event = plannerCalendarEvent(race, null);
    expect(event?.allDay).toBe(true);
    if (!event) throw Error("Expected event");
    const ics = buildIcs(event);
    expect(ics).toContain("DTSTART;VALUE=DATE:20270523");
    expect(ics).toContain("DTEND;VALUE=DATE:20270524");
    expect(ics).not.toContain("BEGIN:VALARM");
  });
  it("includes exactly the selected calendar alarm", () => {
    const event = plannerCalendarEvent(race, 7);
    if (!event) throw Error("Expected event");
    expect(buildIcs(event)).toContain("TRIGGER:-P7D");
  });
  it("does not export a race without a date", () => {
    expect(plannerCalendarEvent({ ...race, date: null }, 1)).toBeNull();
  });
});

const prefs = {
  reminder_days: null,
  notify_registration: false,
  notify_date_change: false,
  known_date: "2027-05-23",
  known_registration: "expected",
};
describe("opt-in planner alerts", () => {
  const open = { ...race, registration: { ...race.registration, state: "open" as const } };
  it("stays silent without opt-in", () => {
    expect(plannerAlerts({ ...open, date: "2027-06-01" }, prefs, "2027-01-01")).toEqual([]);
  });
  it("alerts once registration opens", () => {
    expect(plannerAlerts(open, { ...prefs, notify_registration: true }, "2027-01-01")).toEqual(["registration"]);
    expect(plannerAlerts(open, { ...prefs, notify_registration: true, known_registration: "open" }, "2027-01-01")).toEqual([]);
  });
  it("alerts when the date moves", () => {
    expect(plannerAlerts({ ...race, date: "2027-06-01" }, { ...prefs, notify_date_change: true }, "2027-01-01")).toEqual(["date"]);
  });
  it("alerts when the start is within the chosen days", () => {
    expect(plannerAlerts(race, { ...prefs, reminder_days: 3 }, "2027-05-21")).toEqual(["start"]);
  });
});
