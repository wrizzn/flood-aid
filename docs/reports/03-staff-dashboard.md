# งานที่ 3: ล็อกอินเจ้าหน้าที่และแดชบอร์ดรายการคำขอ

## เป้าหมายและขอบเขตที่ได้รับ

ทำ `/staff/login`, `/staff`, pagination, ตัวกรอง และเปลี่ยนสถานะพร้อม audit log เท่านั้น ไม่ทำแผนที่/PWA/สมัครสมาชิก/จัดการผู้ใช้ และไม่แก้ schema หรือ policies

## บันทึกระหว่างทำงาน

- ตรวจ Git จริง: main รวมงานฟอร์มถึง commit 38fedab แล้ว จึงแตก feat/staff-dashboard จาก main โดยตรง
- อ่าน AGENTS.md และ db/schema.sql ก่อนพัฒนา ย้ายรายงานตามคำสั่งด้วย git mv ไป docs/reports/01-setup.md และ 02-help-request-form.md แล้วอ่านรายงานที่ย้าย
- schema เก็บ urgency เป็น text: ใช้ count แบบ head และดึง range ตามแต่ละระดับ critical/urgent/normal เพื่อให้ pagination เรียงถูกทั้งชุดโดยไม่ดึงทั้งตาราง
- RLS อ่าน staff_profiles เฉพาะตนเอง: แสดงชื่อผู้รับผิดชอบเมื่อตรงกับตนเอง ส่วนคนอื่นแสดงรหัส ไม่เพิ่มสิทธิ์อ่านชื่อคนอื่น
- ไม่จำเป็นต้องแก้ schema สำหรับขอบเขตนี้ การเปลี่ยนสถานะและเพิ่มประวัติเป็นสองคำขอ จะแสดงผลสำเร็จบางส่วนให้ชัดเจน ไม่อ้างว่า atomic
- ใช้ createBrowserClient จาก @supabase/ssr 0.12.7 ตามเอกสาร Next.js ของ Supabase แทน createClient เดิม ให้ SDK จัดการ session cookies/refresh เอง ไม่เก็บ token หรือข้อมูลผู้ประสบภัยด้วย storage ของแอป
- โหลดข้อมูลเฉพาะ Client Components หลัง getUser และ staff_profiles guard จึงไม่ต้องมี server client/proxy เพื่อ refresh SSR ในงานนี้ ไม่มีข้อมูลส่วนบุคคลใน HTML ที่ server render; guard ไม่แทน RLS
- คุกกี้ session ต้องอ่านโดย JavaScript เพื่อ refresh จึงไม่ใช่ HttpOnly และยังต้องป้องกัน XSS ไม่ใช้ dangerouslySetInnerHTML หรือดึงข้อมูลส่วนบุคคลไปใส่ server cache
- เพิ่มเงื่อนไข updated_at และ assigned_to เดิมนอกเหนือจาก status เพื่อป้องกันการรับงานชนกันและการใช้ข้อมูลเก่า
- ขณะบันทึกปิดปุ่มออกจากระบบในแท็บนี้ และไม่ unmount ข้อมูลจาก TOKEN_REFRESHED/การแจ้ง SIGNED_IN ซ้ำของผู้ใช้เดิม เพื่อไม่ให้คำเตือน audit หายระหว่างทำงานตามปกติ

## ไฟล์ที่สร้าง/แก้/ลบ

รายการจาก Git แนบในส่วนผลดิบท้ายรายงาน:

- ย้ายด้วย git mv ตามคำสั่ง: SETUP_REPORT.md -> docs/reports/01-setup.md, HELP_REQUEST_FORM_REPORT.md -> docs/reports/02-help-request-form.md โดยไม่เปลี่ยนเนื้อหา
- สร้าง app/staff/layout.tsx, app/staff/login/page.tsx, app/staff/page.tsx และ components/staff-session.tsx สำหรับ session guard, login, logout และรายการคำขอ
- สร้าง lib/staff/domain.ts, domain.test.ts, api.ts, api.test.ts สำหรับตรรกะบริสุทธิ์/การเข้าถึงข้อมูล/การทดสอบ
- แก้ app/globals.css เพิ่มคลาสฟอร์มและปุ่มที่ใช้ร่วมกัน
- แก้ lib/supabase/client.ts เปลี่ยนไปใช้ createBrowserClient
- แก้ package.json และ package-lock.json เพิ่ม @supabase/ssr แบบ pin เวอร์ชัน ไม่เปลี่ยน scripts npm เพราะ scripts เดิมครอบคลุมแล้ว
- แก้ AGENTS.md ให้ตรงงานปัจจุบัน และเพิ่มรายงานฉบับนี้
- ไม่มีการลบหรือย้ายไฟล์นอกคำสั่ง ไม่แก้ db/schema.sql ไม่แก้ policies หรือฐานข้อมูล

## คำสั่งที่รันจริงและผลลัพธ์ดิบ

### รันแล้ว

- npm view @supabase/ssr version --json: ได้ 0.12.7; npm install --save-exact @supabase/ssr@0.12.7 ติดตั้งสำเร็จ exit code 0 (npm ยังรายงาน moderate 16 รายการ)
- npm run lint, npm run typecheck, npm test, npm run build: ผ่านทั้งหมดในรอบสุดท้าย แบบรันตามลำดับ โดยคัดลอก output จากผลคำสั่งจริงท้ายรายงาน
- tests 4 files, 119 tests รวม tests งานก่อนและงานนี้ การทดสอบ API ใช้ mock ไม่ได้อ้างว่าได้ยืนยันกับ Supabase จริง
- git diff --check, git diff main -- db/schema.sql และค้นหา console/storage/secret patterns ในโค้ดใหม่: ไม่พบการแก้ schema หรือรูปแบบต้องห้ามที่ค้นหา
- ไม่รัน typecheck พร้อม build อีกหลังพบ race ระหว่างไฟล์ types อัตโนมัติ

### ยังไม่ได้รัน

- Login/logout, redirect และสิทธิ์ staff กับ Supabase จริง รวม RLS และการยืนยันข้อมูลในตารางจริง
- Browser/E2E, keyboard, screen reader และอุปกรณ์มือถือจริง
- การชนกันจากเจ้าหน้าที่สองคนและ partial audit failure บนฐานข้อมูลจริง (มีเพียง unit tests ด้วย mock)
- การทดสอบโหลดสูงและประสิทธิภาพ count แบบ exact บนข้อมูลจริง
- ไม่ได้ push branch หรือ merge เข้า main และไม่รัน schema/migrations/policies

## git log --oneline และ git diff --stat เทียบกับ main

แนบผลคำสั่งจริงท้ายรายงาน โดยระบุจุด snapshot ชัดเจน เพราะ commit ที่บันทึก snapshot เองไม่สามารถมี hash ของตนเองในเนื้อหาได้

## ปัญหาที่พบและวิธีแก้

- ผลตรวจงานนี้รันใหม่ทั้งหมด ไม่ใช้ผลก่อนแทน tests และ build รันนอก sandbox ตามข้อจำกัดการเปิด process/ไฟล์ชั่วคราวที่เคยพบ
- typecheck รอบแรกถูกรันพร้อม build ทำให้ .next/types บางไฟล์หายระหว่าง Next.js สร้างใหม่ (TS6053, exit code 1) รัน typecheck หลัง build แยกแล้วผ่าน ไม่ปิด strict หรือข้ามการตรวจ
- ใช้ count/range แยก urgency เพราะการเรียง text ตามตัวอักษรให้ critical/normal/urgent ซึ่งไม่ตรงความต้องการ
- ใช้ updated_at และ assignee เดิมร่วม status สำหรับ optimistic update; select เฉพาะ id หลัง update เพื่อแยก zero-row conflict ไม่อ่านกลับหลัง insert audit
- ไม่ rollback อัตโนมัติเมื่อ audit ล้มเหลว เพราะอาจทับการเปลี่ยนของผู้อื่นหรือสร้าง audit ซ้ำเมื่อคำตอบขาดหาย แสดง warning เด่นและปิดการเปลี่ยนสถานะในหน้านั้นจนตรวจสอบ/refresh

## ข้อสมมติฐานและสิ่งที่ต้องให้ผู้ใช้ตัดสินใจ

- ต้องมีบัญชี Auth และแถว staff_profiles จัดเตรียมโดยผู้ดูแลนอกแอป ไม่มีหน้าสมัครสมาชิกหรือจัดการผู้ใช้
- ยังไม่ยืนยันการทำงานกับ Supabase จริงจนกว่าจะได้ตรวจจริง ไม่อ่านหรือบันทึกค่า .env.local ลงรายงาน
- ทุกบทบาทใน staff_profiles ใช้ workflow เดียวกันตาม RLS เดิม ไม่เพิ่มข้อจำกัดเฉพาะเจ้าของงานที่ฐานข้อมูลไม่ได้บังคับ
- หน้าล็อกอินแสดง error เดียวกันสำหรับ auth/network failures ไม่แยกว่าอีเมลหรือรหัสผ่านผิด
- เวลาแสดงเป็น Asia/Bangkok และปี ค.ศ. โดยกำหนด calendar gregory ชัดเจน ไม่ขึ้นกับ timezone เครื่อง
- ผู้ใช้ต้องยอมรับการแสดงรหัสเจ้าหน้าที่สำหรับผู้รับผิดชอบคนอื่น หากต้องการชื่อทุกคนจะต้องมีการพิจารณาสิทธิ์เพิ่มเติม ซึ่งงานนี้ไม่ได้แก้และไม่ได้จำเป็นต่อการแสดงผู้รับผิดชอบเป็นรหัส
- count และ range ไม่ใช่ snapshot เดียวกัน ขณะมีรายการเข้า/เปลี่ยน status อาจพบข้อมูลซ้ำหรือข้ามระหว่างหน้า ให้โหลดใหม่; exact counts อาจช้าบนตารางใหญ่มาก ต้องวัดจริงก่อนปรับสถาปัตยกรรม
- การ update สถานะกับ insert request_updates เป็นสอง HTTP requests ไม่ atomic แม้ขั้นแรกมี optimistic locking จึงอาจขาด audit เมื่อขั้นสองล้มเหลว/session หมดอายุ/ผู้ใช้ปิดแท็บ ต้องตรวจซ่อมโดยผู้ดูแล ไม่มีอ้างว่า audit ครบแน่นอน
- คำเตือน audit เก็บในหน่วยความจำหน้าเว็บเท่านั้น ไม่ทนต่อ refresh/ปิดแท็บ และไม่เก็บข้อมูลผู้ประสบภัยลง storage; การ logout จากแท็บอื่นหรือปิดหน้าขณะส่งอาจทำให้ไม่เห็น warning
- เงื่อนไขลำดับสถานะเป็น frontend validation ไม่ใช่ constraint ฐานข้อมูล ผู้มี JWT เจ้าหน้าที่อาจเรียก API ข้าม UI ได้ RLS เดิมอนุญาต staff update กว้าง งานนี้ไม่เพิ่ม policy/trigger
- Supabase ใช้ session cookies ที่ SDK จัดการใน browser ไม่มี server-rendered PII; หากจะเพิ่ม Server Components ที่อ่านข้อมูลเจ้าหน้าที่ ต้องเพิ่ม server client/proxy ตามเอกสารก่อน ไม่ใช้ guard นี้เป็น SSR authorization
- ไม่มีการใช้ secret/service_role และไม่มีการจัดเก็บ token/ข้อมูลผู้ประสบภัยลง localStorage ด้วยโค้ดของแอป

## ขั้นตอนทดสอบด้วยมือ

1. เตรียม Supabase สำหรับทดสอบด้วย schema เดิมและบัญชี Auth 3 แบบผ่านผู้ดูแล: staff A, staff B (มีแถว staff_profiles ที่ id ตรง Auth) และบัญชีที่ไม่มี staff profile ใช้ข้อมูลสมมติ ห้ามส่งรหัสผ่านหรือคีย์ลงรายงาน
2. ตั้ง URL/publishable key ใน .env.local ด้วยตนเอง restart npm run dev แล้วเปิด /staff ขณะไม่ล็อกอิน ต้องไป /staff/login ไม่มีลิงก์สมัครสมาชิก ตรวจ error ของอีเมลผิด/รหัสผ่านผิดต้องเหมือนกัน
3. ล็อกอินบัญชีไม่มี profile ต้องเห็นไม่มีสิทธิ์และปุ่มออกจากระบบ ไม่มีการโหลดรายการผู้ประสบภัย ล็อกอิน staff A จึงเห็นรายการ; ออกจากระบบจาก /staff และกรณีไม่มีสิทธิ์แล้วต้องไม่เห็นข้อมูลเก่า
4. เตรียมข้อมูลจำลองมากกว่า 20 รายการ กระจาย critical/urgent/normal และเวลาเก่าใหม่ ตรวจลำดับข้ามหน้าและทั้งสองตัวกรอง ใน Network ต้องเห็น HEAD count และ GET แบบ Range ไม่ใช่ดึงข้อมูลทั้งตาราง
5. ตรวจชื่อ เบอร์ จำนวนคน กลุ่มเปราะบาง สิ่งที่ต้องการ เวลาไทย และผู้รับผิดชอบครบ ผู้รับผิดชอบเป็นตนเองแสดงชื่อ ส่วน staff B แสดงรหัสตาม RLS
6. เปิดพิกัด ตรวจว่าเป็น Google Maps แท็บใหม่ มีเฉพาะ lat/lng ใน URL ไม่มีการฝังแผนที่ ไม่มีชื่อ/โทรศัพท์ในลิงก์
7. รับงาน pending ด้วย staff A ตรวจ assigned_to = A, status = assigned และ audit old_status/new_status/note/staff_id/request_id; ต่อ assigned -> in_progress -> done ตรวจ audit ทุกครั้ง และ done ไม่มีปุ่มเปลี่ยนต่อ
8. ยกเลิกด้วยหมายเหตุว่าง/ช่องว่างต้องไม่ผ่าน ใส่เหตุผลแล้วส่งต้องเป็น cancelled และไม่เปลี่ยนต่อ
9. เปิดคำขอเดียวกันสอง browser sessions: ให้ A รับงานก่อน แล้ว B กดจากข้อมูลเก่า ต้องเห็น conflict และโหลดใหม่ โดยไม่เขียน audit สำหรับขั้น update ที่ไม่ได้เปลี่ยนแถว
10. จำลองให้เฉพาะ POST request_updates ล้มเหลวด้วยเครื่องมือ network interception ของการทดสอบ (ไม่แก้ schema หรือ policies): ตรวจว่าขั้น update สำเร็จจริงแต่ UI เตือนประวัติไม่ครบ โหลดรายการใหม่ และปิดปุ่มเปลี่ยนสถานะไว้ให้ผู้ดูแลตรวจสอบ
11. จำลอง offline/timeout ตอน PATCH: ต้องเห็นว่ายังยืนยันผลไม่ได้และอาจขาด audit ไม่แสดงว่าสำเร็จหรือ retry เงียบ ๆ
12. ลอง refresh หน้าเพื่อยืนยัน session ที่ SDK จัดการ และ logout อีกแท็บว่าหน้าข้อมูลถูกซ่อน ตรวจด้วย anonymous API โดยตรงว่าการอ่าน/แก้ไขถูก RLS ปฏิเสธ (ต้องตรวจจริง ไม่ถือว่า guard เป็นหลักฐาน)
13. ตรวจหน้าจอแคบ 320–390 px, zoom 200%, Tab/Shift+Tab, Space/arrow สำหรับ select, labels และ status/alert ด้วย screen reader ตรวจ console ไม่มี PII ถูก log

## เอกสารทางการและเหตุผลเรื่อง session

- [Supabase สำหรับ Next.js: สร้าง browser/server clients](https://supabase.com/docs/guides/auth/server-side/nextjs): ใช้ createBrowserClient จาก @supabase/ssr ซึ่งจัดการ cookie session ตามแนวทาง Next.js โดยไม่เขียน storage เอง
- [getUser](https://supabase.com/docs/reference/javascript/auth-getuser): ตรวจผู้ใช้กับ Auth server ก่อนอ่าน profile ไม่เชื่อเฉพาะข้อมูล session ที่เก็บใน browser
- [onAuthStateChange](https://supabase.com/docs/reference/javascript/auth-onauthstatechange): callback ไม่ await Supabase query แต่เลื่อนไปงานถัดไปเพื่อหลีกเลี่ยง lock ของ SDK
- [range](https://supabase.com/docs/reference/javascript/range): ใช้ช่วง inclusive ร่วม order และ filters สำหรับแบ่งหน้า
- เลือก client-side staff pages เพื่อลดความซับซ้อนของ SSR session/proxy ในงานนี้ แต่ RLS ตรวจ JWT กับทุก data request เช่นเดิม ไม่อ้างว่า URL guard เป็นระบบ authorization

## ผลลัพธ์ดิบจากคำสั่งตรวจจริง

คัดลอกจากผลเครื่องมือของรอบสุดท้ายหลังแก้โค้ดทั้งหมด (ไม่ได้สร้าง output ขึ้นเอง) ชื่อไฟล์ .env.local ใน build เป็นเพียงชื่อไฟล์ ไม่รวมค่าในไฟล์

### npm run lint — รันแล้ว

```text
> flood-aid@0.1.0 lint
> eslint . --max-warnings=0
exit code: 0
```

### npm run typecheck — รันแล้ว

```text
> flood-aid@0.1.0 typecheck
> tsc --noEmit
exit code: 0
```

### npm test — รันแล้ว

```text
> flood-aid@0.1.0 test
> vitest run


 RUN  v4.1.12 C:/Project/flood-aid


 Test Files  4 passed (4)
      Tests  119 passed (119)
   Start at  14:53:29
   Duration  274ms (transform 163ms, setup 0ms, import 253ms, tests 48ms, environment 0ms)
exit code: 0
```

### npm run build — รันแล้ว

```text
> flood-aid@0.1.0 build
> next build

▲ Next.js 16.4.3 (Turbopack)
- Environments: .env.local
✓ Running next.config.ts took 29ms

  Creating an optimized production build ...
✓ Compiled successfully in 555ms
  Running TypeScript ...
  Finished TypeScript in 1858ms ...
  Collecting page data using 7 workers ...
  Generating static pages using 7 workers (0/6) ...
  Generating static pages using 7 workers (1/6) 
  Generating static pages using 7 workers (2/6) 
  Generating static pages using 7 workers (4/6) 
✓ Generating static pages using 7 workers (6/6) in 682ms
  Finalizing page optimization ...

Route (app)
┌ ○ /
├ ○ /help-request
├ ○ /_not-found
├ ○ /staff
└ ○ /staff/login


○  (Static)  prerendered as static content
exit code: 0
```

### typecheck รอบแรกที่ชนกับ build — รันแล้วและล้มเหลว

```text
> flood-aid@0.1.0 typecheck
> tsc --noEmit

error TS6053: File 'C:/Project/flood-aid/.next/types/cache-life.d.ts' not found.
  The file is in the program because:
    Matched by include pattern '.next/types/**/*.ts' in 'C:/Project/flood-aid/tsconfig.json'
error TS6053: File 'C:/Project/flood-aid/.next/types/root-params.d.ts' not found.
  The file is in the program because:
    Matched by include pattern '.next/types/**/*.ts' in 'C:/Project/flood-aid/tsconfig.json'
error TS6053: File 'C:/Project/flood-aid/.next/types/routes.d.ts' not found.
  The file is in the program because:
    Matched by include pattern '.next/types/**/*.ts' in 'C:/Project/flood-aid/tsconfig.json'
error TS6053: File 'C:/Project/flood-aid/.next/types/validator.ts' not found.
  The file is in the program because:
    Matched by include pattern '.next/types/**/*.ts' in 'C:/Project/flood-aid/tsconfig.json'
exit code: 1
```

แก้โดยรันตามลำดับ ผลรอบสุดท้ายด้านบนผ่าน exit code 0

