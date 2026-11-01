# รายงานงานที่ 2: ฟอร์มแจ้งขอความช่วยเหลือ

วันที่ 1 พฤศจิกายน 2026 (Asia/Bangkok) — branch `feat/help-request-form` แตกจาก `main`

## 1. ไฟล์ที่สร้าง/แก้

| ไฟล์ | รายการ |
| --- | --- |
| `app/help-request/page.tsx` | แสดงฟอร์มที่ `/help-request` |
| `components/help-request-form.tsx` | ฟอร์มภาษาไทย, validation errors, GPS, พิกัดกรอกเอง, สถานะการส่งและลองใหม่ |
| `config/emergency.ts` | ค่าคงที่เบอร์สายด่วนเป็น `null` พร้อม TODO รอตรวจสอบ ไม่เดาเบอร์ |
| `lib/help-request/validation.ts` | ชนิดข้อมูล ตัวเลือก ตรวจข้อมูล และแปลง payload ให้ตรง schema |
| `lib/help-request/validation.test.ts` | Unit tests 54 กรณี: ข้อมูลถูก/ผิด/ค่าขอบเขต และ payload |
| `lib/help-request/submit.ts` | ส่งด้วย Supabase insert ไม่ต่อ select พร้อม timeout 30 วินาที |
| `lib/help-request/submit.test.ts` | Unit tests 6 กรณีด้วย mock: insert ไม่อ่านกลับ, invalid input, backend/network/config errors, timeout |
| `vitest.config.mjs` | ตั้ง Vitest ใน Node environment |
| `package.json`, `package-lock.json` | เพิ่ม Vitest 4.1.12 แบบ pin เวอร์ชัน และ `npm test` |
| `AGENTS.md` | อัปเดตขอบเขต โครงสร้าง คำสั่ง และพฤติกรรมฟอร์ม |
| `HELP_REQUEST_FORM_REPORT.md` | รายงานฉบับนี้ |

ไม่ได้แก้ `db/schema.sql` และไม่ได้เพิ่มล็อกอิน แดชบอร์ด แผนที่ หรือ PWA

## 2. คำสั่งที่รันจริงและผล

| คำสั่ง/การตรวจ | สถานะ | ผล |
| --- | --- | --- |
| `git switch main` และ `git switch -c feat/help-request-form` | รันแล้ว | สร้าง branch ใหม่จาก main |
| `npm view vitest version engines --json` และ `npm view vitest@4 version engines --json` | รันแล้ว | เลือก Vitest 4 เพื่อรองรับ Node.js ของโครงเดิม |
| `npm install --save-dev --save-exact vitest@4.1.12` | รันแล้ว | ติดตั้งสำเร็จ; npm รายงาน moderate 16 รายการ |
| `npm run lint` | รันแล้ว | ผ่าน exit code 0 ไม่มี warnings |
| `npm run typecheck` | รันแล้ว | ผ่าน exit code 0 |
| `npm test` | รันแล้วนอก sandbox | 2 test files, 60 tests ผ่านทั้งหมด exit code 0 |
| `npm run build` | รันแล้วนอก sandbox | ผ่าน exit code 0; สร้าง routes `/`, `/help-request`, `/_not-found` |
| `git diff --cached --check` สำหรับ commits ของโค้ด | รันแล้ว | ผ่าน |
| `git diff main -- db/schema.sql` | รันแล้ว | ไม่มีการเปลี่ยน schema |
| Browser/E2E, GPS จริง, keyboard และ screen reader จริง | ยังไม่ได้รัน | มีขั้นตอนทดสอบด้วยมือด้านล่าง |
| Anonymous insert กับ Supabase จริงและตรวจ RLS | ยังไม่ได้รัน | ไม่มีค่าการเชื่อมต่อที่ตรวจสอบแล้ว |
| ทดสอบมือถือ/อินเทอร์เน็ตช้าจริง และโหลดสูง | ยังไม่ได้รัน | ยังไม่มีผลยืนยัน |

Vitest ครั้งแรกใน sandbox เริ่ม tests ไม่ได้เนื่องจาก EPERM ตอนเปลี่ยนชื่อไฟล์ชั่วคราว จึงรันนอก sandbox แล้วผ่าน หลังแยกฟังก์ชันส่งข้อมูล ได้รัน test, lint, typecheck และ build อีกครั้งกับโค้ดล่าสุดแล้ว ผลในตารางเป็นผลสุดท้าย

การทดสอบ submit ใช้ mock ทั้งหมด จึงยืนยันได้เฉพาะเส้นทางโค้ด ไม่ได้ยืนยันการบันทึกในฐานข้อมูลจริง ส่วน accessibility และ responsive เป็นการจัดโครงสร้างโค้ด ยังไม่ได้รับรองจากการใช้อุปกรณ์หรือ screen reader จริง

## 3. ขั้นตอนทดสอบด้วยมือ

### เตรียม

1. ใช้ฐานข้อมูล Supabase สำหรับทดสอบ กรอก `NEXT_PUBLIC_SUPABASE_URL` และ `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` ใน `.env.local` แล้ว restart server ห้ามใส่ service_role/secret key
2. หากยังไม่มีตาราง ให้ตรวจและตั้ง schema ตาม `db/schema.sql` ในโปรเจกต์ทดสอบด้วยตนเอง ตรวจสิทธิ์ INSERT ของ anonymous role และ RLS ก่อนทดสอบ ระบบงานนี้ยังไม่ได้รัน SQL ให้
3. รัน `npm run dev` แล้วเปิด `http://localhost:3000/help-request` หรือใช้ HTTPS เมื่อลองจากมือถือ เพราะ GPS ต้องใช้ secure context (localhost ใช้ทดสอบได้)
4. ใช้ข้อมูลสมมติเท่านั้น และเปิด Developer Tools แท็บ Network สำหรับดูจำนวนคำขอ โดยไม่เผยแพร่ข้อมูลส่วนบุคคล

### ตรวจฟอร์มและ validation

1. ส่งฟอร์มเปล่า: ต้องพบข้อความไทยสรุปข้อผิดพลาด โฟกัสย้ายไปสรุป และมีลิงก์ไปช่องที่ต้องแก้
2. ลองเบอร์ผิด เช่น `123` และเบอร์มือถือจำลองที่ตรงแพตเทิร์น 10 หลักขึ้นต้น 06/08/09 ลองช่องว่างและขีด รวมทั้งโทรศัพท์บ้าน 9 หลัก
3. ลอง lat `-90`, `90`, lng `-180`, `180` และ `0, 0`: ต้องผ่าน ส่วนค่าว่าง ตัวอักษร และค่าที่เกินช่วงต้องไม่ผ่าน
4. ลองจำนวนคน `0`, `-1`, `1.5`: ต้องไม่ผ่าน; `1` ต้องผ่าน
5. ไม่เลือกสิ่งที่ต้องการต้องไม่ผ่าน เลือกหลายประเภทได้ และเลือกความเร่งด่วนได้ทั้ง 3 ระดับ
6. ตรวจ checkbox กลุ่มเปราะบาง และกรอกหมายเหตุที่อยู่/รายละเอียดโดยใช้ข้อมูลสมมติ

### ตรวจ GPS

1. กด “ใช้ตำแหน่งปัจจุบัน” และอนุญาตสิทธิ์: ต้องเห็นกำลังค้นหา จากนั้นสำเร็จพร้อมพิกัดและความคลาดเคลื่อน
2. เปลี่ยน permission เป็นปฏิเสธ: ต้องเห็นข้อความถูกปฏิเสธ และกรอก lat/lng เองได้
3. จำลองตำแหน่งไม่พร้อม/timeout: ต้องมีข้อความให้ลองใหม่หรือกรอกเอง
4. ระหว่างค้นหา ให้กรอกพิกัดเอง: ผล GPS ที่กลับมาทีหลังต้องไม่เขียนทับค่าที่กรอกเอง

### ตรวจการส่งและข้อผิดพลาด

1. กรอกข้อมูลถูกต้องแล้วส่งแบบไม่ล็อกอิน: ต้องมี POST ไปตาราง `help_requests` โดยไม่มีการร้องขออ่านข้อมูลกลับ (`select`/`return=representation`)
2. ใช้ Network throttling ให้ส่งช้า: ปุ่มและช่องกรอกต้องถูกปิดระหว่างส่ง กดซ้ำหรือ Enter ซ้ำต้องไม่ทำให้เกิด POST เพิ่มในช่วงคำขอเดิมยังทำงาน
3. เมื่อสำเร็จต้องเห็นข้อความระบบได้รับคำขอ และฟอร์มถูกล็อก ป้องกันส่งข้อมูลเดิมซ้ำ
4. ตรวจใน Supabase Dashboard ด้วยสิทธิ์ผู้ดูแลว่ามีแถวใหม่ตรงกับฟอร์ม ค่า `status` เป็น `pending` และ `assigned_to` เป็น `null` ตาม default
5. จำลอง offline หรือ backend error: ต้องมีข้อความล้มเหลว ข้อมูลยังอยู่ ปุ่มเปลี่ยนเป็น “ลองส่งคำขออีกครั้ง” เชื่อมต่อใหม่แล้วลองส่งได้
6. ถ้ารอเกิน 30 วินาที ต้องกลับสู่สถานะลองส่งใหม่ได้ ไม่มี retry อัตโนมัติ ระวังคำขอซ้ำหาก server รับข้อมูลแล้วแต่คำตอบขาดหาย
7. ตรวจ console ว่าไม่มีการ log ชื่อ เบอร์โทร พิกัด ที่อยู่ หรือรายละเอียดจากโค้ดฟอร์ม

### ตรวจการเข้าถึง

1. ทดสอบหน้าจอแคบประมาณ 320–390 px และซูมข้อความ 200% ตรวจว่ากรอกและกดปุ่มได้โดยไม่มีข้อมูลถูกตัด
2. ใช้ Tab/Shift+Tab ไปทุกช่อง Space เลือก checkbox และลูกศรเปลี่ยน radio ตรวจ focus ที่มองเห็น
3. ใช้ screen reader ตรวจ label, legend ของกลุ่ม checkbox/radio, ข้อผิดพลาดรายช่อง และข้อความ GPS/ส่งข้อมูล
4. ตรวจข้อความเตือนฉุกเฉินด้านบน ต้องไม่มีเบอร์โทรที่ยังไม่ได้ตรวจสอบหรือปุ่มโทรที่มีค่าจำลอง

## 4. สมมติฐานและสิ่งที่ยังไม่แน่ใจ

- รับเบอร์โทรไทยภายในประเทศเท่านั้น: มือถือ 10 หลักเริ่ม 06/08/09 หรือโทรศัพท์บ้าน 9 หลักเริ่ม 02–07 โดยลบช่องว่างและขีดก่อนตรวจ ยังไม่รับ `+66` และยังไม่ได้ยืนยันว่าเบอร์ใช้งานจริง
- ที่อยู่/จุดสังเกตและรายละเอียดเป็น optional ตาม schema ส่วนจำนวนคนสูงสุดอิง PostgreSQL int (2,147,483,647)
- เบอร์สายด่วนยังเป็น `null` พร้อม TODO ต้องให้ผู้รับผิดชอบตรวจสอบก่อนกำหนดค่า
- ไม่มีการอ่านกลับหลัง insert จึงไม่แสดงรหัสคำขอ และไม่เพิ่มสิทธิ์ SELECT ให้ anonymous user
- การป้องกันกดซ้ำใช้ได้ระหว่างรอส่งและหลังสำเร็จในหน้าปัจจุบัน ยังไม่ป้องกันการส่งซ้ำจากหลายแท็บ/refresh หรือการลองใหม่หลังคำตอบเครือข่ายสูญหาย ต้องมี idempotency ฝั่ง server หากต้องการรองรับกรณีเหล่านี้ ซึ่งอยู่นอกงานนี้
- Browser validation ไม่แทนการตรวจข้อมูล/ป้องกันสแปมฝั่ง server ไม่ได้แก้ schema หรือเพิ่ม backend ในขอบเขตนี้
- ยังไม่ merge เข้า main และยังไม่ push branch นี้ขึ้น GitHub ในงานนี้

## เอกสารอ้างอิง

- [Supabase JavaScript insert](https://supabase.com/docs/reference/javascript/insert)
- [Vitest Getting Started](https://vitest.dev/guide/)
- [MDN Geolocation getCurrentPosition](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/getCurrentPosition)
