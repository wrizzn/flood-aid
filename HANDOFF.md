# ส่งต่อโปรเจกต์ให้ Claude Desktop

## สถานะล่าสุด ณ 7 พฤศจิกายน 2026

- โค้ดอยู่ที่ commit `81202b6` บน branch `feat/staff-dashboard` หลังย้อนงาน GPS และแผนที่ที่เพิ่มภายหลัง ฟอร์มกลับมาใช้ GPS หรือกรอกละติจูดและลองจิจูดได้ตามเดิม
- หลังย้อนโค้ด lint ผ่าน ชุดทดสอบผ่าน 119 รายการ และสร้างเว็บด้วย Webpack สำเร็จ
- สำเนาก่อนย้อนอยู่ที่ `C:\Project\flood-aid-before-gps-rollback-2026-11-04.zip`
- งานถัดไปคือยืนยันโปรเจกต์ Supabase สำหรับทดสอบและเตรียมบัญชีเจ้าหน้าที่ 2 บัญชีกับบัญชีทั่วไป 1 บัญชี การทดสอบส่งคำขอ รับงาน เปลี่ยนสถานะ ตรวจสิทธิ์ และรับงานพร้อมกันบนระบบทดสอบยังค้างอยู่ ดูรายการตรวจในหัวข้อ 10

จัดทำวันที่ 3 พฤศจิกายน 2026 (Asia/Bangkok) จากประวัติแชตที่เข้าถึงได้และไฟล์ปัจจุบันที่ `C:\Project\flood-aid` เอกสารนี้ไม่รวมค่าจาก `.env.local` หรือข้อมูลยืนยันตัวตน

## 1. วัตถุประสงค์และขอบเขต

ระบบสารสนเทศช่วยเหลือผู้ประสบอุทกภัย สำหรับผู้ประสบภัย/ญาติที่ใช้มือถือและอาจมีเน็ตช้า รวมถึงเจ้าหน้าที่/อาสาสมัคร เพื่อรวบรวมคำขอ จัดลำดับ และติดตามสถานะ ใช้ภาษาไทยเป็นหลัก ผู้ใช้แจ้งว่าทำคนเดียวและมีเวลา 5 วันเมื่อเริ่มบทสนทนา ไม่ทราบเวลาส่งที่แน่นอนหรือกำหนดส่งที่เปลี่ยนภายหลัง

โครงร่างเริ่มแรกกล่าวถึงแผนที่และ PWA แต่ผู้ใช้ยกเลิกต้นแบบรอบแรก ให้เริ่มใหม่และทำทีละงาน:

1. ตั้งโครง Next.js/TypeScript/Tailwind/Supabase โดยคง schema ของผู้ใช้
2. ฟอร์มแจ้งขอความช่วยเหลือ
3. ล็อกอินเจ้าหน้าที่ รายการแบบแบ่งหน้า และเปลี่ยนสถานะ

ข้อจำกัดล่าสุด: ห้ามเพิ่มแผนที่ฝังในเว็บ, PWA, สมัครสมาชิก, จัดการผู้ใช้ หรือแก้ `db/schema.sql`/RLS เอง หากจำเป็นต้องแก้ schema ต้องหยุดและรายงานเหตุผล งานส่งต่อครั้งนี้อนุญาตเฉพาะเอกสาร ไม่ใช่อนุมัติฟีเจอร์ถัดไป

## 2. เทคโนโลยี ภาษา และ Framework

ตรวจจาก `package.json` ปัจจุบัน:

| รายการ | เวอร์ชัน/รายละเอียด |
| --- | --- |
| Next.js | 16.4.3, App Router |
| React / React DOM | 19.3.1 |
| TypeScript | 5.9.3, strict |
| Tailwind CSS / PostCSS plugin | 4.3.3 |
| Supabase JavaScript SDK | 2.118.0 |
| Supabase SSR helper | 0.12.7; ใช้ browser client |
| Vitest | 4.1.12, Node environment |
| ESLint / eslint-config-next | 9.39.5 / 16.4.3 |
| ฐานข้อมูลที่ออกแบบไว้ | Supabase PostgreSQL, Auth และ RLS |
| เครื่องมือ | npm, Git; Windows PowerShell ใน workspace นี้ |

package.json ระบุ Node >=20.9.0; รอบพัฒนาก่อนใช้ Node 24.22.0 ตามรายงาน ไม่ได้ตรวจ Node ที่ติดตั้งซ้ำในงานเอกสารนี้ แนะนำใช้ Node 24 ตาม AGENTS.md และตรวจ engines ของ dependencies เมื่อเปลี่ยนเครื่อง

## 3. โครงสร้างและไฟล์สำคัญ

```text
app/
  layout.tsx, globals.css, page.tsx
  help-request/page.tsx
  staff/layout.tsx
  staff/login/page.tsx
  staff/page.tsx
components/
  help-request-form.tsx
  staff-session.tsx
lib/
  supabase/client.ts
  help-request/{validation,submit}.ts
  help-request/{validation,submit}.test.ts
  staff/{domain,api}.ts
  staff/{domain,api}.test.ts
config/emergency.ts
db/schema.sql
docs/reports/
  01-setup.md
  02-help-request-form.md
  03-staff-dashboard.md
AGENTS.md
DECISIONS.md
HANDOFF.md
.env.example
package.json, package-lock.json
tsconfig.json, next.config.ts, eslint.config.mjs
postcss.config.mjs, vitest.config.mjs
```

`db/schema.sql` มี `help_requests`, `staff_profiles`, `request_updates` และ policies เดิม ชื่อสถานะปิดงานคือ `done` ไม่ใช่ `completed` จากต้นแบบที่ถูกลบแล้ว ให้อ้างอิง schema จริง

อ่าน AGENTS.md ก่อนทำงาน รายงาน 01/02 เป็นประวัติ ณ เวลานั้น เช่น 01 บอกว่ายังไม่มี tests ซึ่งถูกแทนที่ด้วยงานถัดมา รายงาน 03 มี output ดิบและขั้นตอนตรวจด้วยมือ

## 4. ฟีเจอร์ที่พัฒนาโค้ดแล้ว

คำว่า “พัฒนาแล้ว” ในส่วนนี้หมายถึงมี implementation และหลักฐานการตรวจอัตโนมัติเดิม ไม่เท่ากับยืนยันใช้งานกับฐานข้อมูลจริง

- `/`: ชื่อระบบและลิงก์ไปฟอร์ม
- `/help-request`: ชื่อ เบอร์โทร ที่อยู่ GPS/กรอกพิกัดเอง จำนวนคน กลุ่มเปราะบาง ความต้องการ ความเร่งด่วน และรายละเอียด; validation ภาษาไทย, ป้องกันกดซ้ำ, ข้อความผลและลองใหม่
- ฟอร์มส่ง insert โดยไม่ต่อ select ให้ค่าเริ่มต้น status/assignee มาจากฐานข้อมูล มี timeout และไม่ retry อัตโนมัติ
- `/staff/login`: อีเมล/รหัสผ่าน Supabase Auth, error รวมไม่บอกว่าช่องใดผิด ไม่มีสมัครสมาชิก
- `/staff`: ตรวจ getUser และ staff_profiles, redirect ผู้ไม่มี session, แสดงไม่มีสิทธิ์สำหรับบัญชีที่ไม่มี profile, logout
- รายการหน้าละ 20 พร้อมตัวกรอง เรียง critical/urgent/normal แล้วเก่าสุดก่อน แสดงข้อมูลตามงานที่ 3 และลิงก์พิกัด Google Maps แท็บใหม่
- รับงานเป็นตนเอง เปลี่ยนสถานะตามลำดับ ยกเลิกต้องมีหมายเหตุ ตรวจชนกันด้วยค่าเดิมก่อน update และเพิ่ม audit แยกอีกคำขอ
- แสดงคำเตือนผลบางส่วนหรือผลยังยืนยันไม่ได้ และโหลดรายการใหม่
- Unit tests รวม validation, payload, transitions, sorting, pagination, Maps URL, เวลาไทย, login errors และ API mocks

## 5. สิ่งที่ยังไม่เสร็จ/ยังไม่ยืนยัน

- ยังไม่มีหลักฐานทดสอบ end-to-end กับ Supabase จริง: anonymous insert, Auth, RLS, update/audit และการชนกันจริง
- ไม่ทราบสถานะฐานข้อมูลที่ deploy จริง บัญชีทดสอบ หรือค่าการเชื่อมต่อปัจจุบัน งานนี้ไม่อ่าน `.env.local`
- Browser/E2E, มือถือ, keyboard, screen reader, GPS จริง และ load tests ยังไม่ผ่านการยืนยันตามรายงานล่าสุด
- เบอร์สายด่วนใน `config/emergency.ts` ยังเป็น null พร้อม TODO รอตรวจสอบ ห้ามเดา
- Audit สองขั้นตอนยังไม่ atomic และไม่มีระบบซ่อม audit ในแอป; คำเตือนหายเมื่อปิดหน้า
- การส่งฟอร์มยังไม่มี server-side idempotency; การลองใหม่หลังคำตอบสูญหายอาจเกิดคำขอซ้ำ
- แผนที่ฝัง/PWA/offline/ศูนย์พักพิง/บริจาค/AI/รายงานสถิติเป็นแนวคิดเดิม ไม่ได้พัฒนาและยังไม่ได้รับอนุมัติให้ทำต่อ
- ไม่ทราบว่ามี deployment ของโค้ดชุดปัจจุบันหรือไม่ ไม่มีหลักฐาน URL เว็บใช้งานจริงในงานล่าสุด

## 6. ปัญหาที่เคยพบและวิธีจัดการ

- ต้นแบบรอบแรกเกินขอบเขตที่ผู้ใช้ต้องการ: ผู้ใช้สั่งลบและเริ่มใหม่ จึงไม่ควรนำโค้ด/ชื่อสถานะจากต้นแบบกลับมา
- ESLint 10 ชน peer dependencies ของปลั๊กอิน: กลับมาใช้ 9.39.5; ยังมีข้อจำกัดเรื่องหมดช่วงสนับสนุน
- npm audit เคยรายงาน moderate 16 รายการในสาย ESLint ไม่ใช้ force fix เพราะเปลี่ยน major; ไม่ได้ตรวจ audit ใหม่ในงานเอกสารนี้
- PostCSS default export เคยเกิด lint warning: แยกตัวแปร config ก่อน export แล้วผ่าน
- Turbopack และ Vitest ใน sandbox เคยล้มเหลวจาก child process/temp-file permissions: รันนอก sandbox ที่ได้รับอนุญาตแล้วผ่าน
- typecheck พร้อม build เคย TS6053 เพราะ .next/types กำลังถูกสร้างใหม่: ให้รันตามลำดับ
- urgency เป็น text เรียงตามตัวอักษรไม่ตรงความต้องการ: ใช้ count/range แยกกลุ่มความเร่งด่วน
- RLS อ่าน profile คนอื่นไม่ได้: แสดง UUID ผู้รับผิดชอบคนอื่น ไม่แก้ policy
- update สำเร็จแต่ audit ล้มเหลว: แจ้งผู้ใช้เด่นชัด ไม่ rollback/retry เงียบ ๆ

## 7. การตัดสินใจสำคัญ

อ่าน [DECISIONS.md](DECISIONS.md) สำหรับเหตุผลและผลตามมา โดยเฉพาะ SDK-managed cookies, guard เป็น UX, pagination แยก urgency, optimistic update และข้อจำกัด audit ที่ไม่ atomic ข้อจำกัดบางข้อเป็นคำสั่งผู้ใช้ ไม่ใช่การรับรองว่าเหมาะกับ production

## 8. สถานะล่าสุดที่ตรวจได้

ตรวจ Git บนเครื่องวันที่ 3 พฤศจิกายน 2026 ก่อนสร้างเอกสารสองไฟล์:

- branch ปัจจุบัน `feat/staff-dashboard`, HEAD `81202b6`
- main อยู่ `38fedab` (รวมงานฟอร์มแล้ว) งานเจ้าหน้าที่อยู่เหนือ main 5 commits
- working tree สะอาดก่อนงานเอกสารนี้
- origin ชี้ไป `https://github.com/wrizzn/flood-aid.git`
- ในประวัติได้สร้าง repo แบบ private และสำรอง main/งานตั้งต้นแล้ว แต่วันนี้ไม่ได้เรียก GitHub ตรวจ visibility หรือ fetch ใหม่ จึงไม่ทราบสถานะ remote สด
- local remote-tracking origin/main อยู่ `38fedab`; ไม่พบ tracking branch ของ feat/staff-dashboard ในผล Git ที่ตรวจ
- เอกสารสองไฟล์นี้สร้างบน branch เดิม ยังไม่ commit/push/merge ในงานส่งต่อ

หลักฐานตรวจล่าสุดจากงานที่ 3 (ไม่ใช่ผลรันใหม่วันนี้): lint/typecheck/test/build exit code 0; Vitest 4 files / 119 tests ผ่าน ดู output ใน `docs/reports/03-staff-dashboard.md` ยังไม่ยืนยันกับ Supabase จริง งานนี้ตรวจเฉพาะเอกสาร/สถานะไฟล์ ไม่รันชุดทดสอบซ้ำ

มีรายการ Sites ว่างจากต้นแบบในประวัติที่ไม่เคยเผยแพร่ และตอนนั้นไม่มีเครื่องมือลบ ไม่ทราบสถานะปัจจุบันของรายการนั้น ไม่เกี่ยวกับโค้ดที่ส่งต่อนี้

## 9. ติดตั้ง รัน และทดสอบ

เปิด PowerShell ที่โฟลเดอร์โปรเจกต์ ตรวจ branch ก่อนเริ่ม และอย่าทับการแก้ไขที่ยังไม่ commit:

```powershell
cd C:\Project\flood-aid
git status --short --branch
npm ci
```

ถ้ายังไม่มี `.env.local` ให้คัดลอกจาก `.env.example` โดยไม่ทับไฟล์ที่มีอยู่ ให้ผู้ใช้ตั้งค่าผ่านช่องทางส่วนตัว ตัวแปรที่โค้ดต้องการคือ `NEXT_PUBLIC_SUPABASE_URL` และ `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` เท่านั้น ไม่ใส่ค่าลงแชต/รายงาน/commit ไม่ใช้ secret หรือ service_role

```powershell
npm run dev
```

เปิด localhost:3000; ฟอร์มอยู่ `/help-request`, เจ้าหน้าที่อยู่ `/staff/login` และ `/staff` การส่ง/ล็อกอินต้องมี Supabase ที่ตั้งค่าถูกต้องและผู้ดูแลเตรียมบัญชีพร้อม staff_profiles ในฐานข้อมูล ไม่มีหน้าสร้างบัญชีในแอป ห้ามรัน SQL กับฐานข้อมูลโดยสมมติว่าได้รับอนุมัติแล้ว

ตรวจตามลำดับ (อย่ารัน typecheck พร้อม build):

```powershell
npm run lint
npm run build
npm run typecheck
npm test
npm start
```

วาง build ก่อน typecheck บนเครื่องใหม่เพื่อสร้าง Next.js generated types; build ตรวจ TypeScript ด้วย คำสั่งเหล่านี้เป็นวิธีรัน ไม่ใช่หลักฐานว่า Claude ได้รันแล้ว ต้องบันทึก output/exit code ของการรันจริงแยกจากประวัติ

## 10. สิ่งที่ Claude ควรทำต่อ

1. อ่าน AGENTS.md, schema, DECISIONS.md และรายงาน 03 ตรวจ branch/working tree ใหม่ก่อนเปลี่ยนไฟล์; อย่าสันนิษฐานว่า main มีงานเจ้าหน้าที่แล้ว
2. สรุปสถานะนี้กับผู้ใช้และรับขอบเขตงานถัดไป ขั้นต่อไปที่แนะนำคือการตรวจ integration มากกว่าการเพิ่มฟีเจอร์ แต่ยังไม่ใช่คำอนุมัติให้แก้ schema หรือ deploy
3. ให้ผู้ใช้ยืนยัน Supabase สำหรับทดสอบและเตรียมบัญชี staff สองบัญชีกับ non-staff ผ่านช่องทางส่วนตัว ตรวจสิทธิ์โดยไม่เปิดเผยค่าใน env
4. รันชุดตรวจใหม่และเก็บ output จากเครื่องที่ Claude ใช้ แก้ปัญหาในขอบเขตที่อนุมัติเท่านั้น
5. ทำ manual/E2E ตามรายงาน 02/03: ฟอร์ม, GPS, Auth, ไม่มีสิทธิ์, RLS โดยตรง, pagination ข้ามหน้า, รับงานชนกัน, audit failure และ logout หลายแท็บ
6. ตรวจเบอร์ฉุกเฉินกับหน่วยงานที่รับผิดชอบก่อนตั้งค่าคงที่ ห้ามเดา
7. รายงานความเสี่ยง audit/idempotency/RLS หากต้องแก้ schema ให้หยุดเสนอเหตุผลและขอขอบเขตใหม่ตามคำสั่งเดิม
8. เมื่อผู้ใช้อนุมัติจึง merge/push สำรอง branch เจ้าหน้าที่และเอกสารตามที่ตกลง ห้ามอ้างว่าสำรองขึ้น GitHub แล้วเพียงเพราะมีไฟล์บนเครื่อง

เอกสารส่งต่อไม่เปิดสิทธิ์ให้ Claude Desktop เข้าถึง filesystem หรือบัญชีภายนอกโดยอัตโนมัติ ไม่ทราบว่าผู้ใช้ตั้ง connector/สิทธิ์ใน Claude แล้วหรือยัง
