"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";
import { loginErrorMessage } from "@/lib/staff/domain";

export default function StaffLoginPage() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lock = useRef(false);
  const router = useRouter();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;
    const form = event.currentTarget;
    const values = new FormData(form);
    lock.current = true;
    setBusy(true); setError("");
    try {
      const { error } = await getSupabaseClient().auth.signInWithPassword({ email: String(values.get("email") ?? "").trim(), password: String(values.get("password") ?? "") });
      form.reset();
      if (error) throw error;
      router.replace("/staff");
    } catch { setError(loginErrorMessage()); }
    finally { lock.current = false; setBusy(false); }
  }
  return <section className="mx-auto max-w-lg space-y-5">
    <h1 className="text-3xl font-bold">ล็อกอินเจ้าหน้าที่</h1>
    <p>ใช้บัญชีที่ผู้ดูแลจัดเตรียมให้เท่านั้น</p>
    {error && <p role="alert" className="staff-error">{error}</p>}
    <form onSubmit={submit} aria-busy={busy} className="space-y-5">
      <fieldset disabled={busy} className="space-y-5">
        <legend className="sr-only">บัญชีเจ้าหน้าที่</legend>
        <label htmlFor="email" className="block font-semibold">อีเมล<input id="email" name="email" type="email" required autoComplete="username" className="staff-input" /></label>
        <label htmlFor="password" className="block font-semibold">รหัสผ่าน<input id="password" name="password" type="password" required autoComplete="current-password" className="staff-input" /></label>
        <button className="staff-button w-full bg-blue-800 text-white" type="submit" disabled={busy}>{busy ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}</button>
      </fieldset>
    </form>
  </section>;
}
