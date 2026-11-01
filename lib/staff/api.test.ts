import { beforeEach, describe, expect, it, vi } from "vitest";
import { changeRequestStatus, loadRequestPage } from "./api";
import type { RequestRow, StaffProfile } from "./domain";

const mock = vi.hoisted(() => ({ client: vi.fn() }));
vi.mock("../supabase/client", () => ({ getSupabaseClient: mock.client }));
type Reply = { data?: unknown; error?: unknown; count?: number };
class Query {
  constructor(private reply: Reply | Error) {}
  select = vi.fn((...args: unknown[]) => { void args; return this; });
  eq = vi.fn((...args: unknown[]) => { void args; return this; });
  is = vi.fn((...args: unknown[]) => { void args; return this; });
  update = vi.fn((...args: unknown[]) => { void args; return this; });
  insert = vi.fn((...args: unknown[]) => { void args; return this; });
  order = vi.fn((...args: unknown[]) => { void args; return this; });
  range = vi.fn((...args: unknown[]) => { void args; return this; });
  abortSignal = vi.fn(async (...args: unknown[]) => { void args; if (this.reply instanceof Error) throw this.reply; return this.reply; });
}
let queries: Query[];
let from: ReturnType<typeof vi.fn>;
function arrange(replies: (Reply | Error)[]) {
  queries = replies.map(r => new Query(r));
  let index = 0;
  from = vi.fn(() => queries[index++]);
  mock.client.mockReturnValue({ from });
}
const row = { id: "request-test", status: "pending", assigned_to: null, updated_at: "2026-01-01T00:00:00Z" } as RequestRow;
const staff: StaffProfile = { id: "staff-test", full_name: "เจ้าหน้าที่ทดสอบ", role: "volunteer" };
beforeEach(() => vi.resetAllMocks());

describe("optimistic update and audit", () => {
  it("checks old status, version and assignee, then writes audit without select", async () => {
    arrange([{ data: [{ id: row.id }] }, { error: null }]);
    expect(await changeRequestStatus(row, "assigned", "รับงานทดสอบ", staff)).toBe("complete");
    expect(queries[0].eq).toHaveBeenCalledWith("status", "pending");
    expect(queries[0].eq).toHaveBeenCalledWith("updated_at", row.updated_at);
    expect(queries[0].is).toHaveBeenCalledWith("assigned_to", null);
    expect(queries[0].update).toHaveBeenCalledWith(expect.objectContaining({ assigned_to: staff.id, status: "assigned" }));
    expect(from).toHaveBeenNthCalledWith(2, "request_updates");
    expect(queries[1].insert).toHaveBeenCalledWith({ request_id: row.id, old_status: "pending", new_status: "assigned", note: "รับงานทดสอบ", staff_id: staff.id });
    expect(queries[1].select).not.toHaveBeenCalled();
  });
  it("does not insert audit for a zero-row conflict", async () => { arrange([{ data: [] }]); expect(await changeRequestStatus(row, "assigned", "", staff)).toBe("conflict"); expect(from).toHaveBeenCalledTimes(1); });
  it("reports partial success when audit fails", async () => { arrange([{ data: [{ id: row.id }] }, { error: { code: "test-error" } }]); expect(await changeRequestStatus(row, "assigned", "", staff)).toBe("audit_failed"); });
  it("reports ambiguous result after update network error and does not retry", async () => { arrange([new Error("test offline")]); expect(await changeRequestStatus(row, "assigned", "", staff)).toBe("update_unconfirmed"); expect(from).toHaveBeenCalledTimes(1); });
  it("reports audit failure if second request throws", async () => { arrange([{ data: [{ id: row.id }] }, new Error("test offline")]); expect(await changeRequestStatus(row, "assigned", "", staff)).toBe("audit_failed"); });
  it("rejects cancellation without note before contacting backend", async () => { arrange([]); await expect(changeRequestStatus(row, "cancelled", " ", staff)).rejects.toThrow("เหตุผล"); expect(from).not.toHaveBeenCalled(); });
});
describe("server pagination", () => {
  it("only fetches a bounded range and orders oldest plus stable id", async () => {
    arrange([{ count: 1000 }, { count: 2 }, { count: 1 }, { data: [] }]);
    const result = await loadRequestPage(1, { status: "pending", urgency: "" }, new AbortController().signal);
    expect(result.total).toBe(1003);
    expect(queries[0].select).toHaveBeenCalledWith("id", { count: "exact", head: true });
    expect(queries[3].range).toHaveBeenCalledWith(20, 39);
    expect(queries[3].eq).toHaveBeenCalledWith("urgency", "critical");
    expect(queries[3].eq).toHaveBeenCalledWith("status", "pending");
    expect(queries[3].order).toHaveBeenCalledWith("created_at", { ascending: true });
    expect(queries[3].order).toHaveBeenCalledWith("id", { ascending: true });
  });
  it("fetches only requested urgency and adjusts pages after counts shrink", async () => {
    arrange([{ count: 3 }, { data: [] }]);
    const result = await loadRequestPage(8, { status: "", urgency: "urgent" }, new AbortController().signal);
    expect(result.page).toBe(0);
    expect(from).toHaveBeenCalledTimes(2);
    expect(queries[1].range).toHaveBeenCalledWith(0, 2);
    expect(queries[1].eq).toHaveBeenCalledWith("urgency", "urgent");
  });
});
