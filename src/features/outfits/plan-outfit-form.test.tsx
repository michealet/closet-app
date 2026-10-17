import { expect, it } from "vitest";
import { deleteWarning } from "./delete-outfit-button";
import { localToday } from "./plan-outfit-form";

it("uses the viewer's own date, not UTC", () => {
  // 23:30 on Oct 17 in UTC-4 is already Oct 18 in UTC.
  const lateEvening = new Date("2026-10-18T03:30:00Z");
  lateEvening.getTimezoneOffset = () => 240;
  expect(localToday(lateEvening)).toBe("2026-10-17");
});

it("warns how many plans go with a deleted outfit", () => {
  expect(deleteWarning(0)).toBe("This can't be undone.");
  expect(deleteWarning(1)).toContain("planned on 1 date.");
  expect(deleteWarning(3)).toContain("planned on 3 dates.");
});
