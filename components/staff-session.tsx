"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { StaffProfile } from "@/lib/staff/domain";

type Access = { state: "loading" | "signed_out" | "denied" | "ready" | "error"; profile: StaffProfile | null };
const Context = createContext<Access & { setOperationBusy: (busy: boolean) => void }>({ state: "loading", profile: null, setOperationBusy: () => {} });
export function useStaffSession() { return useContext(Context); }

export default function StaffSession({ children }: { children: ReactNode }) {
  const [access, setAccess] = useState<Access>({ state: "loading", profile: null });
  const [message, setMessage] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [revision, setRevision] = useState(0);
  const [operationBusy, setOperationBusy] = useState(false);
  const checkedUserId = useRef<string | null>(null);
  const version = useRef(0);
  const logoutLock = useRef(false);
  const router = useRouter();
  const path = usePathname();
  const loginPage = path === "/staff/login";

  useEffect(() => {
    let active = true;
    let cleanup = () => {};
    async function verify() {
      if (logoutLock.current) return;
      const generation = ++version.current;
      setAccess({ state: "loading", profile: null });
      try {
        const client = getSupabaseClient();
        const { data: { user }, error } = await client.auth.getUser();
        if (!active || generation !== version.current) return;
        if (error && error.name !== "AuthSessionMissingError" && error.status !== 401) throw error;
        if (!user) { checkedUserId.current = null; setAccess({ state: "signed_out", profile: null }); return; }
        const { data, error: profileError } = await client.from("staff_profiles").select("id,full_name,role").eq("id", user.id).maybeSingle();
        if (!active || generation !== version.current) return;
        if (profileError) throw profileError;
        checkedUserId.current = user.id;
        setAccess({ state: data ? "ready" : "denied", profile: data as StaffProfile | null });
      } catch {
        if (active && generation === version.current) setAccess({ state: "error", profile: null });
      }
    }
    try {
      const client = getSupabaseClient();
      // No awaited Supabase calls inside auth callbacks (avoid SDK lock deadlocks).
      const { data } = client.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_OUT") { version.current += 1; checkedUserId.current = null; setOperationBusy(false); setAccess({ state: "signed_out", profile: null }); }
        else if (event !== "INITIAL_SESSION" && event !== "TOKEN_REFRESHED" && !(event === "SIGNED_IN" && session?.user.id === checkedUserId.current)) {
          version.current += 1;
          setAccess({ state: "loading", profile: null });
          setTimeout(() => { if (active) void verify(); }, 0);
        }
      });
      cleanup = () => data.subscription.unsubscribe();
    } catch { /* verify reports configuration errors without exposing values. */ }
    void verify();
    return () => { active = false; version.current += 1; cleanup(); };
  }, [revision]);

  useEffect(() => {
    if (!loginPage && access.state === "signed_out") router.replace("/staff/login");
    if (loginPage && access.state === "ready") router.replace("/staff");
  }, [access.state, loginPage, router]);

  async function logout() {
    if (logoutLock.current || operationBusy) return;
    logoutLock.current = true;
    version.current += 1;
    setLoggingOut(true);
    setMessage("");
    setAccess({ state: "loading", profile: null }); // Unmount all protected data immediately.
    try {
      const { error } = await getSupabaseClient().auth.signOut({ scope: "local" });
      if (error) throw error;
      setAccess({ state: "signed_out", profile: null });
      router.replace("/staff/login");
      router.refresh();
    } catch {
      setAccess({ state: "error", profile: null });
      setMessage("ออกจากระบบไม่สำเร็จ กรุณาลองออกจากระบบอีกครั้ง");
    } finally { logoutLock.current = false; setLoggingOut(false); }
  }

  const allowed = access.state === "ready" && !loginPage || access.state === "signed_out" && loginPage;
  return <Context.Provider value={{ ...access, setOperationBusy }}>
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-6 text-lg leading-relaxed text-slate-950">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <Link href="/staff" className="min-h-12 py-3 font-bold text-blue-800 underline">ศูนย์เจ้าหน้าที่</Link>
        <button type="button" onClick={logout} disabled={loggingOut || operationBusy || access.state === "signed_out"} className="staff-button border-2 border-slate-600">{loggingOut ? "กำลังออกจากระบบ…" : operationBusy ? "รอบันทึกก่อนออกจากระบบ" : "ออกจากระบบ"}</button>
      </header>
      {message && <p role="alert" className="staff-error">{message}</p>}
      {access.state === "loading" && <p role="status">กำลังตรวจสอบสิทธิ์…</p>}
      {access.state === "error" && <section role="alert" className="space-y-4"><h1 className="text-2xl font-bold">ยังตรวจสอบสิทธิ์ไม่ได้</h1><p>กรุณาตรวจการเชื่อมต่อและการตั้งค่าระบบ แล้วลองอีกครั้ง ข้อมูลคำขอถูกซ่อนไว้</p><button className="staff-button border-2" disabled={loggingOut} onClick={() => { setMessage(""); setRevision(r => r + 1); }}>ลองตรวจสอบสิทธิ์อีกครั้ง</button></section>}
      {access.state === "denied" && <section role="alert"><h1 className="text-2xl font-bold">ไม่มีสิทธิ์เข้าใช้งานสำหรับเจ้าหน้าที่</h1><p>บัญชีนี้ยังไม่มีข้อมูลเจ้าหน้าที่ กรุณาติดต่อผู้ดูแล หรือออกจากระบบเพื่อใช้บัญชีอื่น</p></section>}
      {allowed && children}
    </main>
  </Context.Provider>;
}
