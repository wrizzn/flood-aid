import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { INITIAL_VALUES, type HelpRequestValues } from "./validation";
import { submitHelpRequest } from "./submit";

const mock = vi.hoisted(() => ({ from: vi.fn(), insert: vi.fn(), abortSignal: vi.fn(), getClient: vi.fn() }));
vi.mock("../supabase/client", () => ({ getSupabaseClient: mock.getClient }));
const valid: HelpRequestValues = { ...INITIAL_VALUES, requester_name: "ผู้แจ้งทดสอบ", phone: "0812345678", lat: "0", lng: "0", need_types: ["water"] };

beforeEach(() => {
  vi.resetAllMocks();
  mock.getClient.mockReturnValue({ from: mock.from });
  mock.from.mockReturnValue({ insert: mock.insert });
  // This mock intentionally exposes no select/read method.
  mock.insert.mockReturnValue({ abortSignal: mock.abortSignal });
  mock.abortSignal.mockResolvedValue({ error: null });
});
afterEach(() => vi.useRealTimers());

describe("submitHelpRequest", () => {
  it("inserts into help_requests without selecting records", async () => {
    await expect(submitHelpRequest(valid)).resolves.toBeUndefined();
    expect(mock.from).toHaveBeenCalledExactlyOnceWith("help_requests");
    expect(mock.insert).toHaveBeenCalledTimes(1);
    expect(mock.insert.mock.calls[0][0]).toMatchObject({ lat: 0, lng: 0, people_count: 1, need_types: ["water"] });
    expect(mock.insert.mock.calls[0][0]).not.toHaveProperty("status");
    expect(mock.insert.mock.calls[0][0]).not.toHaveProperty("assigned_to");
  });
  it("rejects invalid inputs before contacting Supabase", async () => {
    await expect(submitHelpRequest(INITIAL_VALUES)).rejects.toThrow("ข้อมูลคำขอไม่ถูกต้อง");
    expect(mock.getClient).not.toHaveBeenCalled();
  });
  it("propagates backend errors without retrying", async () => {
    mock.abortSignal.mockResolvedValue({ error: new Error("test backend error") });
    await expect(submitHelpRequest(valid)).rejects.toThrow("test backend error");
    expect(mock.insert).toHaveBeenCalledTimes(1);
  });
  it("propagates network failures without retrying", async () => {
    mock.abortSignal.mockRejectedValue(new TypeError("test offline"));
    await expect(submitHelpRequest(valid)).rejects.toThrow("test offline");
    expect(mock.insert).toHaveBeenCalledTimes(1);
  });
  it("propagates configuration errors and clears its timer", async () => {
    vi.useFakeTimers();
    mock.getClient.mockImplementation(() => { throw new Error("test missing config"); });
    await expect(submitHelpRequest(valid)).rejects.toThrow("test missing config");
    expect(vi.getTimerCount()).toBe(0);
  });
  it("aborts at 30 seconds and cleans up the timer", async () => {
    vi.useFakeTimers();
    let signal: AbortSignal | undefined;
    mock.abortSignal.mockImplementation((s: AbortSignal) => {
      signal = s;
      return new Promise(resolve => s.addEventListener("abort", () => resolve({ error: new Error("test timeout") })));
    });
    const pending = submitHelpRequest(valid);
    const rejected = expect(pending).rejects.toThrow("test timeout");
    await vi.advanceTimersByTimeAsync(29999);
    expect(signal?.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await rejected;
    expect(signal?.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });
});
