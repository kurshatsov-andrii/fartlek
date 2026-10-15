import { describe, expect, it } from "vitest";
import { calendarLocation } from "./calendar-location";

describe("calendarLocation", () => {
  it("adds a venue from the description after city and region", () => {
    expect(calendarLocation({ location: "Хуст, Закарпатська", city: "Хуст", region: "Закарпатська", description: "Де: Старт - смт. Буштино, фініш - у центрі міста Хуст" })).toBe("Хуст, Закарпатська, Старт - смт. Буштино, фініш - у центрі міста Хуст");
  });
  it("does not repeat a venue already included in the city", () => {
    expect(calendarLocation({ location: "Дніпро, Кав'ярня Floyd, Дніпропетровська", city: "Дніпро, Кав'ярня Floyd", region: "Дніпропетровська", description: "Місто: Дніпро\nДе: Кав'ярня Floyd" })).toBe("Дніпро, Дніпропетровська, Кав'ярня Floyd");
  });
  it("extracts explicitly stated city and oblast from a formatted description", () => {
    expect(calendarLocation({ description: "📍 **Місто:** Опішня, Полтавська область\n**Де:** Центральна площа" })).toBe("Опішня, Полтавська область, Центральна площа");
  });
  it("keeps a location when no description details are present", () => {
    expect(calendarLocation({ location: "Кременчук" })).toBe("Кременчук");
    expect(calendarLocation({})).toBeNull();
  });
});