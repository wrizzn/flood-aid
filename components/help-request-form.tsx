"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { EMERGENCY_HOTLINE } from "@/config/emergency";
import { submitHelpRequest } from "@/lib/help-request/submit";
import { INITIAL_VALUES, NEED_OPTIONS, URGENCY_OPTIONS, validateHelpRequest, type HelpRequestValues, type ValidationErrors } from "@/lib/help-request/validation";

const inputStyle = "mt-2 min-h-12 w-full rounded-lg border border-slate-500 bg-white px-3 py-3 text-lg focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-blue-700";
const buttonStyle = "min-h-12 rounded-lg px-5 py-3 text-lg font-semibold focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-not-allowed disabled:opacity-60";

export default function HelpRequestForm() {
  const [values, setValues] = useState<HelpRequestValues>({ ...INITIAL_VALUES });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [failure, setFailure] = useState("");
  const [locating, setLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");
  const submitLock = useRef(false);
  const locationVersion = useRef(0);
  const summary = useRef<HTMLDivElement>(null);
  const result = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (Object.keys(errors).length) summary.current?.focus();
  }, [errors]);
  useEffect(() => {
    if (success || failure) result.current?.focus();
  }, [success, failure]);
  useEffect(() => () => { locationVersion.current += 1; }, []);

  function change<K extends keyof HelpRequestValues>(key: K, value: HelpRequestValues[K]) {
    setValues(previous => ({ ...previous, [key]: value }));
    if (key === "lat" || key === "lng") {
      locationVersion.current += 1;
      setLocating(false);
      setLocationMessage("กำลังใช้พิกัดที่กรอกเอง กรุณาตรวจสอบก่อนส่ง");
    }
  }

  function locate() {
    if (locating || submitLock.current) return;
    if (!navigator.geolocation) {
      setLocationMessage("อุปกรณ์นี้ไม่รองรับการหาตำแหน่ง กรุณากรอกละติจูดและลองจิจูดเอง");
      return;
    }
    const version = ++locationVersion.current;
    setLocating(true);
    setLocationMessage("กำลังค้นหาตำแหน่ง กรุณารอสักครู่…");
    navigator.geolocation.getCurrentPosition(position => {
      if (version !== locationVersion.current) return;
      setValues(previous => ({ ...previous, lat: String(position.coords.latitude), lng: String(position.coords.longitude) }));
      setLocating(false);
      setLocationMessage(`หาตำแหน่งสำเร็จ ความคลาดเคลื่อนประมาณ ${Math.round(position.coords.accuracy)} เมตร กรุณาตรวจสอบพิกัดก่อนส่ง`);
    }, error => {
      if (version !== locationVersion.current) return;
      setLocating(false);
      setLocationMessage(error.code === 1
        ? "ถูกปฏิเสธการเข้าถึงตำแหน่ง กรุณาอนุญาตตำแหน่งในเบราว์เซอร์แล้วลองใหม่ หรือกรอกพิกัดเอง"
        : error.code === 3
          ? "ค้นหาตำแหน่งนานเกินไป ลองอีกครั้งหรือกรอกพิกัดเองได้"
          : "ไม่สามารถหาตำแหน่งได้ ลองอีกครั้งหรือกรอกพิกัดเองได้");
    }, { timeout: 15000, maximumAge: 0, enableHighAccuracy: false });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitLock.current || success || locating) return;
    const nextErrors = validateHelpRequest(values);
    setErrors(nextErrors);
    setFailure("");
    if (Object.keys(nextErrors).length) return;
    submitLock.current = true;
    setSending(true);
    try {
      await submitHelpRequest(values);
      setSuccess(true);
    } catch {
      // Do not log the payload, coordinates, phone, or raw backend errors.
      setFailure("ยังยืนยันการส่งไม่ได้ ข้อมูลในฟอร์มยังอยู่ กรุณาตรวจอินเทอร์เน็ตแล้วกดลองส่งอีกครั้ง หากการเชื่อมต่อขาดระหว่างส่ง ระบบอาจรับคำขอไปแล้ว การลองใหม่อาจทำให้มีคำขอซ้ำ");
    } finally {
      submitLock.current = false;
      setSending(false);
    }
  }

  function errorProps(key: keyof HelpRequestValues) {
    return { "aria-invalid": !!errors[key], "aria-describedby": errors[key] ? `${key}-error` : undefined };
  }
  function errorText(key: keyof HelpRequestValues) {
    return errors[key] ? <p id={`${key}-error`} className="mt-2 font-medium text-red-800">{errors[key]}</p> : null;
  }

  return (
    <div className="space-y-6 text-lg leading-relaxed text-slate-950">
      <aside aria-labelledby="emergency-heading" className="rounded-lg border-2 border-amber-700 bg-amber-50 p-4">
        <h2 id="emergency-heading" className="text-xl font-bold">หากเสี่ยงชีวิต ให้โทรสายด่วนก่อน</h2>
        <p>ระบบนี้ไม่ใช่ช่องทางฉุกเฉินแทนสายด่วน การส่งฟอร์มไม่ได้ยืนยันว่าจะมีทีมเข้าช่วยเหลือทันที</p>
        {EMERGENCY_HOTLINE ? <a className="inline-block min-h-12 py-3 font-bold text-blue-800 underline" href={`tel:${EMERGENCY_HOTLINE}`}>โทรสายด่วน {EMERGENCY_HOTLINE}</a> : <p className="mt-2">เบอร์สายด่วนของระบบยังรอตรวจสอบ โปรดใช้เบอร์ฉุกเฉินที่คุณทราบและตรวจสอบแล้ว</p>}
      </aside>
      <p>ช่องที่มีคำว่า “จำเป็น” ต้องกรอก ข้อมูลติดต่อและตำแหน่งใช้เพื่อประสานงานช่วยเหลือ โปรดตรวจสอบให้ถูกต้อง</p>

      {Object.keys(errors).length > 0 && <div ref={summary} tabIndex={-1} role="alert" aria-labelledby="error-heading" className="rounded-lg border-2 border-red-700 bg-red-50 p-4 focus:outline-3 focus:outline-blue-700">
        <h2 id="error-heading" className="font-bold">กรุณาตรวจสอบข้อมูลก่อนส่ง</h2>
        <ul className="list-inside list-disc">{Object.entries(errors).map(([key, message]) => <li key={key}><a className="inline-block py-2 text-red-900 underline" href={`#${key}`}>{message}</a></li>)}</ul>
      </div>}
      {(success || failure) && <div ref={result} tabIndex={-1} role={success ? "status" : "alert"} className={`rounded-lg border-2 p-4 focus:outline-3 focus:outline-blue-700 ${success ? "border-green-700 bg-green-50" : "border-red-700 bg-red-50"}`}>
        <h2 className="text-xl font-bold">{success ? "ส่งคำขอความช่วยเหลือสำเร็จ" : "ส่งคำขอไม่สำเร็จหรือยังยืนยันไม่ได้"}</h2>
        <p>{success ? "ระบบได้รับคำขอแล้ว โปรดเตรียมรับการติดต่อ การส่งคำขอไม่ใช่การยืนยันเวลาช่วยเหลือ หากเสี่ยงชีวิตให้โทรสายด่วนก่อน" : failure}</p>
      </div>}

      <form onSubmit={submit} noValidate aria-busy={sending} className="space-y-7">
        <fieldset disabled={sending || success} className="space-y-7 disabled:opacity-75">
          <legend className="mb-4 text-xl font-bold">ข้อมูลผู้แจ้งและตำแหน่ง</legend>
          <div><label htmlFor="requester_name" className="font-semibold">ชื่อผู้แจ้ง (จำเป็น)</label><input id="requester_name" name="requester_name" autoComplete="name" required value={values.requester_name} onChange={e => change("requester_name", e.target.value)} className={inputStyle} {...errorProps("requester_name")} />{errorText("requester_name")}</div>
          <div><label htmlFor="phone" className="font-semibold">เบอร์โทร (จำเป็น)</label><p id="phone-hint" className="mt-1">ใช้เบอร์ไทยขึ้นต้นด้วย 0 ใส่ช่องว่างหรือขีดได้</p><input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel-national" required value={values.phone} onChange={e => change("phone", e.target.value)} className={inputStyle} {...errorProps("phone")} aria-describedby={`phone-hint${errors.phone ? " phone-error" : ""}`} />{errorText("phone")}</div>
          <div><label htmlFor="address_note" className="font-semibold">หมายเหตุที่อยู่ / จุดสังเกต</label><textarea id="address_note" name="address_note" rows={3} value={values.address_note} onChange={e => change("address_note", e.target.value)} className={inputStyle} /></div>
          <div className="space-y-3"><h2 className="text-xl font-bold">ตำแหน่งที่ต้องการความช่วยเหลือ</h2><button type="button" disabled={locating} onClick={locate} aria-describedby="location-status" className={`${buttonStyle} border-2 border-blue-800 text-blue-900`}>{locating ? "กำลังค้นหาตำแหน่ง…" : "ใช้ตำแหน่งปัจจุบัน"}</button><p id="location-status" role="status" aria-live="polite">{locationMessage || "ใช้ตำแหน่งปัจจุบันได้เมื่ออนุญาต GPS หรือกรอกพิกัดด้านล่างเอง"}</p><p>หากแจ้งแทนผู้อื่น ให้กรอกตำแหน่งของผู้ประสบภัย ไม่ใช่ตำแหน่งของผู้แจ้ง</p></div>
          <div className="grid gap-5 sm:grid-cols-2">{([['lat', 'ละติจูด', '-90 ถึง 90'], ['lng', 'ลองจิจูด', '-180 ถึง 180']] as const).map(([key, label, range]) => <div key={key}><label htmlFor={key} className="font-semibold">{label} (จำเป็น)</label><p id={`${key}-hint`}>{range} ใส่เครื่องหมายลบได้</p><input id={key} name={key} type="text" inputMode="text" required autoComplete="off" spellCheck={false} value={values[key]} onChange={e => change(key, e.target.value)} className={inputStyle} {...errorProps(key)} aria-describedby={`${key}-hint${errors[key] ? ` ${key}-error` : ""}`} />{errorText(key)}</div>)}</div>
          <div><label htmlFor="people_count" className="font-semibold">จำนวนผู้ประสบภัย (คน) (จำเป็น)</label><input id="people_count" name="people_count" type="number" inputMode="numeric" min={1} max={2147483647} step={1} required value={values.people_count} onChange={e => change("people_count", e.target.value)} className={inputStyle} {...errorProps("people_count")} />{errorText("people_count")}</div>
          <fieldset><legend className="mb-2 text-xl font-bold">มีกลุ่มเปราะบางหรือไม่</legend>{([['has_elderly', 'มีผู้สูงอายุ'], ['has_children', 'มีเด็ก'], ['has_patient_or_disabled', 'มีผู้ป่วยหรือผู้พิการ']] as const).map(([key, label]) => <label key={key} htmlFor={key} className="flex min-h-12 cursor-pointer items-center gap-3 py-3"><input id={key} name={key} type="checkbox" checked={values[key]} onChange={e => change(key, e.target.checked)} className="h-6 w-6 accent-blue-800" />{label}</label>)}</fieldset>
          <fieldset id="need_types" tabIndex={-1} aria-describedby={errors.need_types ? "need_types-error" : undefined} aria-invalid={!!errors.need_types}><legend className="mb-2 text-xl font-bold">สิ่งที่ต้องการ (จำเป็น เลือกได้หลายอย่าง)</legend>{NEED_OPTIONS.map(({ value, label }) => <label key={value} htmlFor={`need-${value}`} className="flex min-h-12 cursor-pointer items-center gap-3 py-3"><input id={`need-${value}`} name="need_types" value={value} type="checkbox" checked={values.need_types.includes(value)} onChange={e => change("need_types", e.target.checked ? [...values.need_types, value] : values.need_types.filter(v => v !== value))} className="h-6 w-6 accent-blue-800" />{label}</label>)}{errorText("need_types")}</fieldset>
          <fieldset id="urgency" tabIndex={-1} aria-describedby={errors.urgency ? "urgency-error" : undefined} aria-invalid={!!errors.urgency}><legend className="mb-2 text-xl font-bold">ความเร่งด่วน (จำเป็น)</legend>{URGENCY_OPTIONS.map(({ value, label }) => <label key={value} htmlFor={`urgency-${value}`} className="flex min-h-12 cursor-pointer items-center gap-3 py-3"><input id={`urgency-${value}`} name="urgency" type="radio" required value={value} checked={values.urgency === value} onChange={() => change("urgency", value)} className="h-6 w-6 accent-blue-800" />{label}</label>)}{errorText("urgency")}</fieldset>
          <div><label htmlFor="details" className="font-semibold">รายละเอียดเพิ่มเติม</label><textarea id="details" name="details" rows={4} value={values.details} onChange={e => change("details", e.target.value)} className={inputStyle} /></div>
        </fieldset>
        <button type="submit" disabled={sending || success || locating} className={`${buttonStyle} w-full bg-blue-800 text-white`}>{sending ? "กำลังส่งคำขอ กรุณารอ…" : success ? "ส่งคำขอแล้ว" : failure ? "ลองส่งคำขออีกครั้ง" : "ส่งคำขอความช่วยเหลือ"}</button>
        <p role="status" aria-live="polite">{sending ? "กำลังส่งข้อมูล โปรดอย่าปิดหน้านี้" : ""}</p>
      </form>
    </div>
  );
}
