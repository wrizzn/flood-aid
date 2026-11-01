import { describe, expect, it } from "vitest";
import { STATUS_LABELS, TRANSITIONS, loginErrorMessage, mapLink, pageSlices, sortRequests, thaiTime, transitionError, type Status } from "./domain";

describe("status transitions", () => {
  for (const from of Object.keys(STATUS_LABELS) as Status[]) {
    for (const to of Object.keys(STATUS_LABELS) as Status[]) {
      it(`${from} -> ${to}`, () => expect(transitionError(from, to, "เหตุผลทดสอบ", "staff-test") === null).toBe(TRANSITIONS[from].includes(to)));
    }
  }
  it("requires cancellation note", () => expect(transitionError("pending", "cancelled", " \n", null)).toContain("เหตุผล"));
  it.each(["assigned", "in_progress", "done"] as Status[])("requires assignee for %s", to => {
    const from = to === "assigned" ? "pending" : to === "in_progress" ? "assigned" : "in_progress";
    expect(transitionError(from, to, "", null)).toContain("รับงาน");
  });
});
describe("priority and pagination", () => {
  it("sorts across priorities and oldest first without mutating input", () => {
    const rows = [
      { id: "n", urgency: "normal" as const, created_at: "2020-01-01T00:00:00Z" },
      { id: "u", urgency: "urgent" as const, created_at: "2020-01-01T00:00:00Z" },
      { id: "b", urgency: "critical" as const, created_at: "2026-01-02T00:00:00Z" },
      { id: "c", urgency: "critical" as const, created_at: "2026-01-01T00:00:00Z" },
      { id: "a", urgency: "critical" as const, created_at: "2026-01-01T00:00:00Z" },
    ];
    expect(sortRequests(rows).map(r => r.id)).toEqual(["a", "c", "b", "u", "n"]);
    expect(rows[0].id).toBe("n");
  });
  it("splits a global page across urgency buckets", () => expect(pageSlices({ critical: 23, urgent: 10, normal: 100 }, 1)).toEqual([{ urgency: "critical", from: 20, to: 22 }, { urgency: "urgent", from: 0, to: 9 }, { urgency: "normal", from: 0, to: 6 }]));
  it("handles a single filtered bucket", () => expect(pageSlices({ critical: 0, urgent: 25, normal: 0 }, 1)).toEqual([{ urgency: "urgent", from: 20, to: 24 }]));
  it("handles empty and exhausted pages", () => { expect(pageSlices({ critical: 0, urgent: 0, normal: 0 }, 0)).toEqual([]); expect(pageSlices({ critical: 1, urgent: 0, normal: 0 }, 2)).toEqual([]); });
  it("rejects invalid page", () => expect(() => pageSlices({ critical: 0, urgent: 0, normal: 0 }, -1)).toThrow());
});
describe("Google Maps links", () => {
  it("encodes only coordinates into a fixed HTTPS origin", () => expect(mapLink(13.75, 100.5)).toBe("https://www.google.com/maps/search/?api=1&query=13.75%2C100.5"));
  it.each([[0, 0], [-90, -180], [90, 180]])("accepts boundaries %s/%s", (lat, lng) => expect(mapLink(lat, lng)).not.toBeNull());
  it.each([[91, 0], [0, 181], [NaN, 0], [0, Infinity]])("rejects invalid coordinates %s/%s", (lat, lng) => expect(mapLink(lat, lng)).toBeNull());
});
describe("Thai local time", () => {
  it("converts UTC across midnight using explicit Bangkok timezone", () => expect(thaiTime("2026-01-01T18:05:00Z")).toBe("02/01/2026 01:05"));
  it("normalizes timestamps that already have an offset", () => expect(thaiTime("2026-01-02T01:05:00+07:00")).toBe(thaiTime("2026-01-01T18:05:00Z")));
  it.each(["", "invalid", "2026-01-01T00:00:00"])("does not guess invalid or timezone-less time %s", value => expect(thaiTime(value)).toBe("ไม่ทราบเวลา"));
});
describe("login errors", () => {
  it.each([{ code: "invalid_credentials", message: "wrong password" }, { code: "user_not_found", message: "unknown email" }, new Error("network"), null])("never reveals which credential failed", error => {
    const text = loginErrorMessage(error);
    expect(text).toBe(loginErrorMessage());
    expect(text).toContain("เข้าสู่ระบบไม่สำเร็จ");
    expect(text).not.toMatch(/wrong password|unknown email|user_not_found|invalid_credentials/);
  });
});
