import { describe, expect, it } from "vitest";
import { INITIAL_VALUES, NEED_OPTIONS, URGENCY_OPTIONS, toHelpRequestInsert, validateHelpRequest, type HelpRequestValues } from "./validation";

const valid: HelpRequestValues = { ...INITIAL_VALUES, requester_name: "ผู้แจ้งทดสอบ", phone: "0812345678", lat: "13.75", lng: "100.5", need_types: ["food"] };

describe("validateHelpRequest", () => {
  it("accepts a valid request with optional fields empty", () => expect(validateHelpRequest(valid)).toEqual({}));
  it("reports all required fields together", () => expect(Object.keys(validateHelpRequest({ ...INITIAL_VALUES, people_count: "", urgency: "" })).sort()).toEqual(["requester_name", "phone", "lat", "lng", "people_count", "need_types", "urgency"].sort()));
  it("rejects a whitespace-only name", () => expect(validateHelpRequest({ ...valid, requester_name: " \n " }).requester_name).toBeTruthy());
  it.each(["0812345678", "0612345678", "0912345678", "021234567", "053123456", "081-234-5678", "081 234 5678"])("accepts domestic Thai phone %s", phone => expect(validateHelpRequest({ ...valid, phone }).phone).toBeUndefined());
  it.each(["", "1234567890", "081234567", "08123456789", "abcdefghij", "+66812345678", "0123456789"])("rejects phone %s", phone => expect(validateHelpRequest({ ...valid, phone }).phone).toBeTruthy());
  it.each([[-90, -180], [90, 180], [0, 0]])("accepts coordinate boundaries %s/%s", (lat, lng) => expect(validateHelpRequest({ ...valid, lat: String(lat), lng: String(lng) })).toEqual({}));
  it.each(["", " ", "NaN", "Infinity", "0x20", "1,5", "-90.0001", "90.0001"])("rejects latitude %s", lat => expect(validateHelpRequest({ ...valid, lat }).lat).toBeTruthy());
  it.each(["", "-180.0001", "180.0001", "NaN"])("rejects longitude %s", lng => expect(validateHelpRequest({ ...valid, lng }).lng).toBeTruthy());
  it.each(["1", "2", "2147483647"])("accepts people count %s", people_count => expect(validateHelpRequest({ ...valid, people_count }).people_count).toBeUndefined());
  it.each(["", "0", "-1", "1.5", "NaN", "Infinity", "1e2", "2147483648"])("rejects people count %s", people_count => expect(validateHelpRequest({ ...valid, people_count }).people_count).toBeTruthy());
  it("accepts all need types together", () => expect(validateHelpRequest({ ...valid, need_types: NEED_OPTIONS.map(o => o.value) })).toEqual({}));
  it.each([[], ["unknown"], ["food", "unknown"]])("rejects invalid need types %j", (...need_types) => expect(validateHelpRequest({ ...valid, need_types }).need_types).toBeTruthy());
  it.each(URGENCY_OPTIONS)("accepts urgency $value", ({ value }) => expect(validateHelpRequest({ ...valid, urgency: value })).toEqual({}));
  it("rejects unknown urgency", () => expect(validateHelpRequest({ ...valid, urgency: "other" }).urgency).toBeTruthy());
});

describe("toHelpRequestInsert", () => {
  it("normalizes inputs and leaves status/assignee to database defaults", () => {
    expect(toHelpRequestInsert({ ...valid, requester_name: " ผู้แจ้งทดสอบ ", phone: "081-234-5678", need_types: ["food", "food", "water"], has_children: true })).toEqual({ requester_name: "ผู้แจ้งทดสอบ", phone: "0812345678", address_note: null, lat: 13.75, lng: 100.5, people_count: 1, has_elderly: false, has_children: true, has_patient_or_disabled: false, need_types: ["food", "water"], urgency: "normal", details: null });
  });
  it("preserves optional text and all vulnerability flags", () => expect(toHelpRequestInsert({ ...valid, address_note: " จุดสังเกต ", details: " รายละเอียด ", has_elderly: true, has_patient_or_disabled: true })).toMatchObject({ address_note: "จุดสังเกต", details: "รายละเอียด", has_elderly: true, has_patient_or_disabled: true }));
  it("refuses an invalid payload", () => expect(() => toHelpRequestInsert(INITIAL_VALUES)).toThrow("ข้อมูลคำขอไม่ถูกต้อง"));
});
