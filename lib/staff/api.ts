import { getSupabaseClient } from "../supabase/client";
import { PAGE_SIZE, URGENCY_ORDER, pageSlices, sortRequests, transitionError, type RequestRow, type StaffProfile, type Status, type Urgency } from "./domain";

const COLUMNS = "id,created_at,updated_at,requester_name,phone,lat,lng,people_count,has_elderly,has_children,has_patient_or_disabled,need_types,urgency,status,assigned_to";
export type Filters = { status: Status | ""; urgency: Urgency | "" };

export async function loadRequestPage(page: number, filters: Filters, signal: AbortSignal) {
  const client = getSupabaseClient();
  const counts: Record<Urgency, number> = { critical: 0, urgent: 0, normal: 0 };
  await Promise.all(URGENCY_ORDER.filter(u => !filters.urgency || filters.urgency === u).map(async urgency => {
    let query = client.from("help_requests").select("id", { count: "exact", head: true }).eq("urgency", urgency);
    if (filters.status) query = query.eq("status", filters.status);
    const { count, error } = await query.abortSignal(signal);
    if (error) throw error;
    counts[urgency] = count ?? 0;
  }));
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const lastPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1);
  const actualPage = Math.min(page, lastPage);
  const groups = await Promise.all(pageSlices(counts, actualPage).map(async slice => {
    let query = client.from("help_requests").select(COLUMNS).eq("urgency", slice.urgency);
    if (filters.status) query = query.eq("status", filters.status);
    const { data, error } = await query.order("created_at", { ascending: true }).order("id", { ascending: true }).range(slice.from, slice.to).abortSignal(signal);
    if (error) throw error;
    return (data ?? []) as RequestRow[];
  }));
  return { rows: sortRequests(groups.flat()), total, page: actualPage };
}

export type ChangeResult = "complete" | "conflict" | "audit_failed" | "update_unconfirmed";
export async function changeRequestStatus(row: RequestRow, target: Status, note: string, staff: StaffProfile): Promise<ChangeResult> {
  const assignedTo = target === "assigned" ? staff.id : row.assigned_to;
  const invalid = transitionError(row.status, target, note, assignedTo);
  if (invalid) throw new Error(invalid);
  const client = getSupabaseClient();
  try {
    let query = client.from("help_requests")
      .update({ status: target, assigned_to: assignedTo, updated_at: new Date().toISOString() })
      .eq("id", row.id).eq("status", row.status).eq("updated_at", row.updated_at);
    query = row.assigned_to === null ? query.is("assigned_to", null) : query.eq("assigned_to", row.assigned_to);
    // SELECT is allowed for staff, and is required to detect a zero-row conflict.
    const { data, error } = await query.select("id").abortSignal(AbortSignal.timeout(30000));
    if (error) return "update_unconfirmed";
    if (!data?.length) return "conflict";
  } catch { return "update_unconfirmed"; }
  try {
    const { error } = await client.from("request_updates").insert({
      request_id: row.id, old_status: row.status, new_status: target, note: note.trim() || null, staff_id: staff.id,
    }).abortSignal(AbortSignal.timeout(30000));
    return error ? "audit_failed" : "complete";
  } catch { return "audit_failed"; }
}
