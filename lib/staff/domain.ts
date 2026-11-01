export const STATUS_LABELS = { pending: "รอดำเนินการ", assigned: "มอบหมายแล้ว", in_progress: "กำลังช่วยเหลือ", done: "เสร็จสิ้น", cancelled: "ยกเลิก" } as const;
export const URGENCY_LABELS = { critical: "วิกฤต", urgent: "เร่งด่วน", normal: "ทั่วไป" } as const;
export type Status = keyof typeof STATUS_LABELS;
export type Urgency = keyof typeof URGENCY_LABELS;
export const URGENCY_ORDER: Urgency[] = ["critical", "urgent", "normal"];
export const PAGE_SIZE = 20;
export type StaffProfile = { id: string; full_name: string; role: string };
export type RequestRow = {
  id: string; created_at: string; updated_at: string; requester_name: string; phone: string;
  lat: number; lng: number; people_count: number; has_elderly: boolean; has_children: boolean;
  has_patient_or_disabled: boolean; need_types: string[]; urgency: Urgency; status: Status; assigned_to: string | null;
};
export const TRANSITIONS: Record<Status, readonly Status[]> = {
  pending: ["assigned", "cancelled"], assigned: ["in_progress", "cancelled"],
  in_progress: ["done", "cancelled"], done: [], cancelled: [],
};
export function transitionError(from: Status, to: Status, note: string, assignedTo: string | null): string | null {
  if (!TRANSITIONS[from]?.includes(to)) return "ไม่สามารถเปลี่ยนสถานะตามลำดับนี้ได้ กรุณาโหลดข้อมูลล่าสุด";
  if (to === "cancelled" && !note.trim()) return "กรุณาระบุเหตุผลในการยกเลิก";
  if (["assigned", "in_progress", "done"].includes(to) && !assignedTo) return "ต้องมีเจ้าหน้าที่รับงานก่อนดำเนินการต่อ";
  return null;
}
export function sortRequests<T extends Pick<RequestRow, "id" | "urgency" | "created_at">>(rows: T[]): T[] {
  return [...rows].sort((a, b) => URGENCY_ORDER.indexOf(a.urgency) - URGENCY_ORDER.indexOf(b.urgency) || Date.parse(a.created_at) - Date.parse(b.created_at) || a.id.localeCompare(b.id));
}
export function mapLink(lat: number, lng: number): string | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`;
}
export function thaiTime(iso: string): string {
  // Reject timezone-less timestamps; Supabase timestamptz includes Z or offset.
  if (!/(Z|[+-]\d{2}:\d{2})$/i.test(iso) || !Number.isFinite(Date.parse(iso))) return "ไม่ทราบเวลา";
  return new Intl.DateTimeFormat("th-TH", { timeZone: "Asia/Bangkok", calendar: "gregory", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(iso));
}
export function loginErrorMessage(error?: unknown): string {
  void error;
  return "เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบอีเมลและรหัสผ่าน หรือการเชื่อมต่อ แล้วลองอีกครั้ง";
}
export function pageSlices(counts: Record<Urgency, number>, page: number, size = PAGE_SIZE) {
  if (!Number.isInteger(page) || page < 0 || !Number.isInteger(size) || size < 1) throw new Error("หน้ารายการไม่ถูกต้อง");
  let skip = page * size;
  let remaining = size;
  const slices: { urgency: Urgency; from: number; to: number }[] = [];
  for (const urgency of URGENCY_ORDER) {
    const count = counts[urgency];
    if (skip >= count) { skip -= count; continue; }
    const take = Math.min(remaining, count - skip);
    if (take) slices.push({ urgency, from: skip, to: skip + take - 1 });
    remaining -= take;
    skip = 0;
    if (!remaining) break;
  }
  return slices;
}
