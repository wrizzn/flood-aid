"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useStaffSession } from "@/components/staff-session";
import { changeRequestStatus, loadRequestPage, type Filters } from "@/lib/staff/api";
import { PAGE_SIZE, STATUS_LABELS, URGENCY_LABELS, TRANSITIONS, mapLink, thaiTime, transitionError, type RequestRow, type StaffProfile, type Status, type Urgency } from "@/lib/staff/domain";
import { NEED_OPTIONS } from "@/lib/help-request/validation";

export default function StaffDashboard() {
  const { profile, setOperationBusy } = useStaffSession();
  const [query, setQuery] = useState<{ page: number; filters: Filters; revision: number }>({ page: 0, filters: { status: "", urgency: "" }, revision: 0 });
  const [result, setResult] = useState<{ rows: RequestRow[]; total: number; page: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [auditWarning, setAuditWarning] = useState("");
  const [mutating, setMutating] = useState(false);
  const mutationLock = useRef(false);

  useEffect(() => {
    if (!profile) return;
    let active = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    async function load() {
      setLoading(true); setError(""); setResult(null);
      try {
        const data = await loadRequestPage(query.page, query.filters, controller.signal);
        if (active) setResult(data);
      } catch {
        if (active) setError("โหลดรายการไม่สำเร็จ กรุณาตรวจการเชื่อมต่อหรือสิทธิ์ แล้วกดโหลดใหม่");
      } finally {
        clearTimeout(timeout);
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; clearTimeout(timeout); controller.abort(); };
  }, [query, profile]);

  function reload() { setQuery(q => ({ ...q, revision: q.revision + 1 })); }
  function filter(key: keyof Filters, value: string) {
    setResult(null); setLoading(true);
    setQuery(q => ({ ...q, page: 0, filters: { ...q.filters, [key]: value } }));
  }
  async function update(row: RequestRow, target: Status, note: string) {
    if (!profile || mutationLock.current) return;
    const invalid = transitionError(row.status, target, note, target === "assigned" ? profile.id : row.assigned_to);
    if (invalid) { setMessage(invalid); return; }
    mutationLock.current = true; setMutating(true); setOperationBusy(true); setMessage("");
    try {
      const outcome = await changeRequestStatus(row, target, note, profile);
      if (outcome === "audit_failed") {
        setAuditWarning(`คำขอ ${row.id}: เปลี่ยนสถานะจาก ${STATUS_LABELS[row.status]} เป็น ${STATUS_LABELS[target]} แล้ว แต่ยังยืนยันการบันทึกประวัติไม่ได้ กรุณาจดรหัสคำขอและแจ้งผู้ดูแลตรวจสอบตาราง request_updates ก่อนดำเนินการต่อ ห้ามกดเปลี่ยนสถานะซ้ำเพื่อสร้างประวัติย้อนหลัง`);
      } else if (outcome === "conflict") setMessage("ข้อมูลถูกเปลี่ยนไปแล้วหรือไม่สามารถแก้ไขแถวนี้ได้ กำลังโหลดรายการใหม่ กรุณาตรวจสอบก่อนลองอีกครั้ง");
      else if (outcome === "update_unconfirmed") setAuditWarning(`คำขอ ${row.id}: ยังยืนยันการเปลี่ยนสถานะไม่ได้ อาจมีการเปลี่ยนแล้วแต่ไม่ได้บันทึกประวัติ กรุณาโหลดใหม่และให้ผู้ดูแลตรวจสอบก่อนลองซ้ำ`);
      else setMessage("เปลี่ยนสถานะและบันทึกประวัติแล้ว");
    } catch { setMessage("ดำเนินการไม่สำเร็จ กรุณาโหลดข้อมูลใหม่ก่อนลองอีกครั้ง"); }
    finally { mutationLock.current = false; setMutating(false); setOperationBusy(false); reload(); }
  }

  if (!profile) return null;
  const currentPage = result?.page ?? query.page;
  const pages = Math.max(1, Math.ceil((result?.total ?? 0) / PAGE_SIZE));
  return <section className="space-y-6">
    <h1 className="text-3xl font-bold">รายการคำขอความช่วยเหลือ</h1>
    <p>เจ้าหน้าที่: {profile.full_name}</p>
    <p>เรียงวิกฤต → เร่งด่วน → ทั่วไป และเก่าสุดก่อนในระดับเดียวกัน หน้าละ {PAGE_SIZE} รายการ</p>
    {auditWarning && <div role="alert" className="staff-error space-y-3"><p className="font-bold">คำเตือน: ประวัติอาจไม่ครบ</p><p>{auditWarning}</p><p>ซ่อนปุ่มเปลี่ยนสถานะไว้จนกว่าจะตรวจสอบและโหลดหน้านี้ใหม่ คำเตือนนี้ไม่ถูกเก็บถาวรเมื่อปิดหน้า</p></div>}
    {message && <p role="status" className="rounded-lg border-2 border-blue-800 bg-blue-50 p-4">{message}</p>}
    <fieldset disabled={mutating} className="grid gap-4 sm:grid-cols-2">
      <legend className="mb-3 text-xl font-bold">ตัวกรอง</legend>
      <label htmlFor="filter-status">สถานะ<select id="filter-status" className="staff-input" value={query.filters.status} onChange={e => filter("status", e.target.value as Status | "")}><option value="">ทุกสถานะ</option>{Object.entries(STATUS_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <label htmlFor="filter-urgency">ความเร่งด่วน<select id="filter-urgency" className="staff-input" value={query.filters.urgency} onChange={e => filter("urgency", e.target.value as Urgency | "")}><option value="">ทุกความเร่งด่วน</option>{Object.entries(URGENCY_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
    </fieldset>
    <button type="button" className="staff-button border-2 border-blue-800" onClick={reload} disabled={loading || mutating}>โหลดรายการใหม่</button>
    {loading && <p role="status">กำลังโหลดรายการ…</p>}
    {error && <p role="alert" className="staff-error">{error}</p>}
    {result && <>
      <p role="status">พบ {result.total} รายการ · หน้า {currentPage + 1} จาก {pages}</p>
      {!result.rows.length && <p>ไม่พบคำขอที่ตรงกับตัวกรอง</p>}
      <ul className="space-y-5" aria-label="รายการคำขอ">{result.rows.map(row => <li key={`${row.id}:${row.updated_at}`}><RequestCard row={row} profile={profile} locked={mutating || !!auditWarning} update={update} /></li>)}</ul>
      <nav className="flex flex-wrap items-center justify-between gap-3" aria-label="เปลี่ยนหน้ารายการ">
        <button type="button" className="staff-button border-2" disabled={loading || mutating || currentPage === 0} onClick={() => { setResult(null); setLoading(true); setQuery(q => ({ ...q, page: currentPage - 1 })); }}>หน้าก่อนหน้า</button>
        <span>หน้า {currentPage + 1} / {pages}</span>
        <button type="button" className="staff-button border-2" disabled={loading || mutating || currentPage + 1 >= pages} onClick={() => { setResult(null); setLoading(true); setQuery(q => ({ ...q, page: currentPage + 1 })); }}>หน้าถัดไป</button>
      </nav>
    </>}
  </section>;
}

function RequestCard({ row, profile, locked, update }: { row: RequestRow; profile: StaffProfile; locked: boolean; update: (row: RequestRow, target: Status, note: string) => Promise<void> }) {
  const [target, setTarget] = useState<Status | "">("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const link = mapLink(row.lat, row.lng);
  const next = TRANSITIONS[row.status] ?? [];
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!target || locked) return;
    const invalid = transitionError(row.status, target, note, target === "assigned" ? profile.id : row.assigned_to);
    setError(invalid ?? "");
    if (!invalid) await update(row, target, note);
  }
  const vulnerable = [row.has_elderly && "ผู้สูงอายุ", row.has_children && "เด็ก", row.has_patient_or_disabled && "ผู้ป่วยหรือผู้พิการ"].filter(Boolean).join(", ");
  return <article className="space-y-4 rounded-xl border-2 border-slate-400 bg-white p-4 sm:p-6" aria-labelledby={`request-${row.id}`}>
    <div className="flex flex-wrap gap-3 font-bold"><span className={row.urgency === "critical" ? "text-red-800" : "text-slate-950"}>{URGENCY_LABELS[row.urgency]}</span><span>{STATUS_LABELS[row.status]}</span></div>
    <h2 id={`request-${row.id}`} className="text-xl font-bold break-words">{row.requester_name}</h2>
    <dl className="space-y-2 break-words">
      <div><dt className="inline font-semibold">เบอร์โทร: </dt><dd className="inline">{row.phone}</dd></div>
      <div><dt className="inline font-semibold">จำนวนคน: </dt><dd className="inline">{row.people_count} คน</dd></div>
      <div><dt className="inline font-semibold">กลุ่มเปราะบาง: </dt><dd className="inline">{vulnerable || "ไม่ได้ระบุ"}</dd></div>
      <div><dt className="inline font-semibold">สิ่งที่ต้องการ: </dt><dd className="inline">{row.need_types.map(v => NEED_OPTIONS.find(o => o.value === v)?.label ?? v).join(", ")}</dd></div>
      <div><dt className="inline font-semibold">เวลาที่แจ้ง (ไทย): </dt><dd className="inline"><time dateTime={row.created_at}>{thaiTime(row.created_at)}</time></dd></div>
      <div><dt className="inline font-semibold">ผู้รับผิดชอบ: </dt><dd className="inline">{!row.assigned_to ? "ยังไม่มีผู้รับผิดชอบ" : row.assigned_to === profile.id ? profile.full_name : `เจ้าหน้าที่รหัส ${row.assigned_to}`}</dd></div>
    </dl>
    {link ? <a href={link} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" className="inline-block min-h-12 py-3 font-semibold text-blue-800 underline">เปิดพิกัดใน Google Maps (แท็บใหม่)</a> : <p>พิกัดไม่ถูกต้อง จึงเปิดแผนที่ไม่ได้</p>}
    {next.length > 0 && <form onSubmit={submit} className="space-y-4 border-t pt-4">
      <fieldset disabled={locked} className="space-y-4"><legend className="mb-2 font-bold">ดำเนินการคำขอนี้</legend>
        {row.status === "pending" && <button type="button" className="staff-button w-full bg-blue-800 text-white" onClick={() => { void update(row, "assigned", note); }}>รับงาน</button>}
        <label htmlFor={`next-${row.id}`} className="block">สถานะถัดไป<select id={`next-${row.id}`} className="staff-input" required value={target} onChange={e => setTarget(e.target.value as Status | "")}><option value="">เลือกสถานะ</option>{next.filter(s => s !== "assigned").map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}</select></label>
        <label htmlFor={`note-${row.id}`} className="block">หมายเหตุ {target === "cancelled" ? "(จำเป็นเมื่อยกเลิก)" : "(ถ้ามี)"}<textarea id={`note-${row.id}`} className="staff-input" rows={2} required={target === "cancelled"} value={note} onChange={e => setNote(e.target.value)} /></label>
        {error && <p role="alert" className="staff-error">{error}</p>}
        <button type="submit" disabled={!target} className="staff-button w-full border-2 border-blue-800">ยืนยันเปลี่ยนสถานะ</button>
      </fieldset>
    </form>}
    {!next.length && <p className="font-semibold">ปิดคำขอแล้ว ไม่สามารถเปลี่ยนสถานะต่อได้</p>}
  </article>;
}
