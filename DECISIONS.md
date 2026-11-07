# บันทึกการตัดสินใจทางเทคนิค

วันที่รวบรวม 3 พฤศจิกายน 2026 จากประวัติสนทนา โค้ด ณ HEAD 81202b6 และ docs/reports ไม่ใช่การอนุมัติเปลี่ยนระบบใหม่ ไม่มีค่าความลับในเอกสารนี้

| การตัดสินใจ / สถานะ | เหตุผลและหลักฐาน | ผลตามมา / ข้อจำกัด |
| --- | --- | --- |
| ใช้ Next.js App Router + TypeScript strict + Tailwind (ใช้อยู่) | ผู้ใช้กำหนดในงานตั้งโครง; package.json, tsconfig.json | ต้นแบบ JavaScript เดิมถูกยกเลิก ไม่ควรย้อนนำมาใช้ |
| พัฒนาทีละขอบเขตและ commit ย่อย (คำสั่งผู้ใช้) | งาน 1–3 และ AGENTS.md | แผนที่/PWA/สมัครสมาชิก/จัดการผู้ใช้ยังไม่อนุมัติ ห้ามขยายงานเอง |
| คง schema.sql และ RLS เดิม (ข้อห้ามปัจจุบัน) | ไฟล์ schema จากผู้ใช้; งาน 3 ห้ามแก้ | หากต้องเปลี่ยน schema ต้องหยุดรายงาน ไม่ทำ migrations/policies เอง |
| ใช้ browser-safe publishable key ผ่าน env (ใช้อยู่) | lib/supabase/client.ts; .gitignore ตามรายงาน | ห้ามใส่ secret/service_role หรือค่าจริงลงเอกสาร/commit |
| เปลี่ยน createClient เดิมเป็น createBrowserClient จาก @supabase/ssr (ใช้อยู่ในงาน 3) | แนวทาง Next.js ของ Supabase ที่อ้างในรายงาน 03 | SDK จัดการ session cookies/refresh; ไม่เขียน token ลง storage เอง คุกกี้อ่านโดย JS จึงยังมีความเสี่ยง XSS |
| โหลดข้อมูลเจ้าหน้าที่เฉพาะ Client Components (ใช้อยู่) | components/staff-session.tsx และ app/staff | ไม่มี server client/proxy สำหรับ SSR auth; ถ้าเพิ่ม server reads ต้องออกแบบ auth ใหม่ ไม่ใช้ browser guard แทน |
| ตรวจ getUser และ staff_profiles; guard เป็น UX (ใช้อยู่) | components/staff-session.tsx, schema | RLS เป็นตัวควบคุมการเข้าถึงจริง ต้องตรวจ integration; ไม่มีหลักฐานตรวจฐานข้อมูลจริงล่าสุด |
| Public insert ไม่ต่อ select (ข้อกำหนดและใช้อยู่) | lib/help-request/submit.ts; anonymous ไม่มี SELECT policy | ไม่แสดงรหัสคำขอที่อ่านกลับจากฐานข้อมูล |
| Validate/payload เป็น pure functions และใช้ Vitest (ใช้อยู่) | lib/help-request/validation.ts และ tests | Browser validation ไม่แทน server validation; payload ปล่อย status/assignee ให้ DB default |
| เบอร์ไทยแบบภายในประเทศ และ optional ที่อยู่/รายละเอียด (สมมติฐาน implementation) | validation.ts, รายงาน 02 | รับมือถือ 06/08/09 จำนวน 10 หลัก และบ้าน 02–07 จำนวน 9 หลัก ลบช่องว่าง/ขีด ไม่รับ +66 ไม่ยืนยันว่าเบอร์มีจริง |
| GPS มีทางกรอกพิกัดเอง; ไม่ฝังแผนที่ (คำสั่งผู้ใช้) | components/help-request-form.tsx | รองรับ permission denied/timeout; พิกัดกรอกเองไม่ถูกผล GPS ที่มาช้าเขียนทับ |
| เบอร์สายด่วนเป็น null จนตรวจสอบ (คำสั่งผู้ใช้) | config/emergency.ts | ยังไม่มีเบอร์ที่ยืนยัน ห้ามสร้างค่าจำลองหรือเดา |
| แบ่งหน้าทีละ 20 ด้วย count/head และ range ตาม urgency (ใช้อยู่) | lib/staff/api.ts, domain.ts | ลำดับ critical/urgent/normal ถูกก่อนเก่าสุด ต่างจากเรียง text; count/range ไม่ใช่ snapshot เดียวกัน อาจข้าม/ซ้ำเมื่อข้อมูลเปลี่ยนและต้องวัด performance |
| แสดงชื่อผู้รับผิดชอบตนเอง คนอื่นแสดง UUID (ข้อจำกัด RLS) | policy staff can read own profile; app/staff/page.tsx | ไม่ขยายสิทธิ์อ่าน profile คนอื่น หากต้องการชื่อทุกคนต้องให้ผู้ใช้พิจารณาสิทธิ์ก่อน |
| pending -> assigned -> in_progress -> done; ยกเลิกจากสถานะเปิดพร้อมเหตุผล (ใช้อยู่) | lib/staff/domain.ts และ tests | done/cancelled ปิดถาวรใน UI แต่ไม่ใช่ DB constraint ป้องกัน direct API ทุกกรณี |
| Optimistic update ตรวจ id/status/updated_at/assigned_to เดิม (ใช้อยู่) | lib/staff/api.ts | update select เฉพาะ id เพื่อดู zero-row conflict; SELECT นี้เป็นของ staff ไม่ใช่ public insert; updated_at ถูกกำหนดจากเวลา client |
| Update และ audit แยกสองคำขอ (ข้อกำหนดงาน 3) | api.ts; UI แยก audit_failed/update_unconfirmed | ไม่ atomic ไม่ rollback/retry เงียบ ๆ แสดง warning และโหลดใหม่ แต่ปิดแท็บ/session หมดอายุอาจทำ audit ขาด |
| คำเตือน audit เก็บเฉพาะหน่วยความจำ (ใช้อยู่) | app/staff/page.tsx | warning ไม่ทน refresh/ปิดหน้า; ผู้ดูแลต้องตรวจซ่อม ไม่ได้แก้ปัญหาประวัติถาวรแล้ว |
| ไม่ retry อัตโนมัติเมื่อผลส่งไม่ชัดเจน (ใช้อยู่) | help-request/submit.ts, staff/api.ts | ลดการเขียนซ้ำเงียบ ๆ แต่ไม่มี server idempotency; การส่งใหม่ยังอาจซ้ำ |
| Login error ใช้ข้อความรวมและไม่ log raw error (ใช้อยู่) | loginErrorMessage และ login page | ไม่บอกว่าอีเมลหรือรหัสผ่านผิด ลดการเปิดเผยข้อมูลบัญชี แต่ต้องตรวจพฤติกรรม Auth จริง |
| เวลาไทยใช้ Asia/Bangkok และปี ค.ศ. (ใช้อยู่) | thaiTime ใน domain.ts | ไม่ขึ้นกับ timezone เครื่อง; timezone-less/invalid input แสดงไม่ทราบเวลา |
| ใช้ ESLint 9.39.5 และ Vitest 4.1.12 แบบ pin (ใช้อยู่) | package.json และรายงาน 01–03 | ESLint 10 เคย peer conflict; Vitest 4 เลือกเพื่อรองรับ Node ของโครงเดิม ไม่ได้แปลว่า dependencies ปลอดปัญหาทั้งหมด |
| แยกรัน typecheck กับ build (แนวทางตรวจ) | TS6053 จริงในรายงาน 03 | Next.js สร้าง .next/types ใหม่ระหว่าง build; บนเครื่องใหม่ให้ build สร้าง types ก่อน typecheck |
| เก็บรายงานใน docs/reports พร้อม output จริง (คำสั่งผู้ใช้) | ย้ายสองรายงานด้วย git mv ในงาน 3 | ห้ามใช้ผลเก่าอ้างเป็นการรันใหม่ หรือระบุว่า live integration ผ่านเมื่อมีแค่ mocks |

## การตัดสินใจที่ยังไม่มีคำตอบ

- ไม่ทราบการตั้งค่า/สถานะฐานข้อมูลจริงและ hosting ปัจจุบัน
- ยังไม่ได้ตัดสินใจอนุมัติ schema change สำหรับ atomic audit, server-enforced transitions หรือ idempotency
- ยังไม่มีเบอร์ฉุกเฉินที่ตรวจสอบแล้ว ไม่มีขอบเขตฟีเจอร์ถัดไปที่อนุมัติหลังงาน 3
- ยังไม่มีหลักฐาน merge/push งานเจ้าหน้าที่ในผล Git ปัจจุบัน; remote สดไม่ได้ตรวจในงานส่งต่อ
- npm audit ล่าสุดในประวัติรายงาน moderate 16 รายการ ไม่ได้ตรวจใหม่วันที่จัดทำเอกสาร จึงไม่ทราบจำนวนปัจจุบัน

## แหล่งอ้างอิงภายใน

- AGENTS.md — ข้อจำกัดและวิธีทำงานปัจจุบัน
- db/schema.sql — ตาราง ชื่อคอลัมน์ ค่าที่อนุญาต และ policies ต้นฉบับ
- docs/reports/01-setup.md — การตั้งโครงและปัญหา dependencies
- docs/reports/02-help-request-form.md — ฟอร์ม สมมติฐาน และวิธีทดสอบ
- docs/reports/03-staff-dashboard.md — session, pagination, concurrency, audit และผลตรวจดิบ
- HANDOFF.md — สถานะที่ตรวจล่าสุดและลำดับงานต่อที่เสนอ
