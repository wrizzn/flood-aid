# รายงานการวางโครงโปรเจกต์

**ระบบสารสนเทศช่วยเหลือผู้ประสบอุทกภัย**

วันที่: 1 พฤศจิกายน 2026 (เขตเวลา Asia/Bangkok)

โฟลเดอร์: `C:\Project\flood-aid`

Git branch: `chore/setup`

> รายงานนี้สรุปการทำงานและผลตรวจจากรอบตั้งโครงที่เสร็จก่อนเขียนรายงาน ไม่ใช่ terminal log ฉบับเต็ม และไม่ได้รัน lint/build ซ้ำระหว่างจัดทำไฟล์นี้

## 1. ขอบเขตและผลการทำงาน

ลบโค้ดต้นแบบรอบเดิมในโฟลเดอร์งาน แล้วสร้าง repository ใหม่สำหรับงานตั้งโครงตามคำสั่งผู้ใช้ โดยทำเฉพาะรายการต่อไปนี้:

1. สร้าง Next.js App Router ด้วย TypeScript แบบ strict และ Tailwind CSS
2. ติดตั้ง `@supabase/supabase-js` และแยก browser client ไว้ใน `lib/supabase/client.ts`
3. สร้าง `.env.example` และ `.env.local` โดยยังไม่กรอกค่าการเชื่อมต่อ และตั้ง Git ignore สำหรับ `.env.local`
4. สร้าง `AGENTS.md` อธิบายบริบท โครงสร้าง คำสั่ง และข้อจำกัด
5. คัดลอกไฟล์ของผู้ใช้ไปที่ `db/schema.sql` โดยไม่แก้เนื้อหาและไม่รันกับฐานข้อมูล
6. หน้าแรกมีชื่อระบบกับลิงก์ไป `/help-request`; หน้าปลายทางมีเพียงหัวข้อ “แจ้งขอความช่วยเหลือ”
7. ตั้งค่า ESLint และสคริปต์ lint, typecheck และ build
8. ทำงานบน branch `chore/setup` และแยก commit เป็นขั้นเล็ก ๆ

ยังไม่มีฟอร์ม ล็อกอิน แดชบอร์ด แผนที่ หรือ PWA ในโครงใหม่นี้

## 2. เวอร์ชันหลัก

| เครื่องมือ | เวอร์ชัน |
| --- | --- |
| Node.js ที่ใช้ทำงาน | 24.22.0 |
| Next.js | 16.4.3 |
| React / React DOM | 19.3.1 |
| TypeScript | 5.9.3 |
| Tailwind CSS / PostCSS plugin | 4.3.3 |
| Supabase JavaScript SDK | 2.118.0 |
| ESLint | 9.39.5 |
| eslint-config-next | 16.4.3 |

บันทึก dependencies พร้อมเวอร์ชันและ `package-lock.json` เพื่อให้ติดตั้งซ้ำได้

## 3. รายการไฟล์

### ไฟล์ที่ติดตามด้วย Git

| ไฟล์ | หน้าที่ |
| --- | --- |
| `.env.example` | ชื่อตัวแปรแวดล้อม โดยไม่มีค่าจริง |
| `.gitattributes` | ป้องกัน Git แปลงบรรทัดของ `db/schema.sql` |
| `.gitignore` | ยกเว้นความลับ dependencies และไฟล์ที่สร้างอัตโนมัติ |
| `AGENTS.md` | บริบท ขอบเขต โครงสร้าง และคำสั่งทำงาน |
| `app/globals.css` | โหลด Tailwind และกำหนด CSS พื้นฐาน |
| `app/layout.tsx` | Root layout ภาษาไทยและชื่อระบบ |
| `app/page.tsx` | หน้าแรกและลิงก์แจ้งขอความช่วยเหลือ |
| `app/help-request/page.tsx` | หน้าปลายทางที่ยังไม่มีฟอร์ม |
| `db/schema.sql` | สำเนา schema ของผู้ใช้ |
| `eslint.config.mjs` | Next.js Core Web Vitals และ TypeScript lint rules |
| `lib/supabase/client.ts` | ฟังก์ชัน `getSupabaseClient()` สร้าง client เมื่อเรียกใช้ |
| `next.config.ts` | การตั้งค่า Next.js พื้นฐาน |
| `package.json` | Dependencies และ scripts |
| `package-lock.json` | เวอร์ชัน dependencies ที่ติดตั้ง |
| `postcss.config.mjs` | การเชื่อม Tailwind กับ PostCSS |
| `tsconfig.json` | การตั้งค่า TypeScript |

ไฟล์ `SETUP_REPORT.md` นี้เพิ่มภายหลังตามคำขอให้ส่งรายงานเป็น Markdown

### ไฟล์เฉพาะเครื่องและผลลัพธ์อัตโนมัติ

- `.env.local` — ตัวแปรยังว่าง และไม่ถูก commit
- `next-env.d.ts` — Type declarations ที่ Next.js ดูแล ถูก Git ignore
- `node_modules/`, `.next/`, `tsconfig.tsbuildinfo` — ผลจากการติดตั้งและตรวจ/build ถูก Git ignore

## 4. Environment และ Supabase

ใช้ตัวแปรต่อไปนี้ใน `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

หน้าโครงโปรเจกต์ยังไม่เรียก client จึงเปิดหน้าเว็บและ build ได้แม้ยังไม่กรอกค่า เมื่อเรียก `getSupabaseClient()` โดยขาดค่าจำเป็น จะได้รับข้อความแจ้งให้ตั้งค่า

ตัวแปร `NEXT_PUBLIC_` ถูกส่งถึงเบราว์เซอร์ได้ ห้ามใส่ secret key หรือ service_role key การตั้งค่านี้เป็น browser client เท่านั้น ยังไม่ได้ทำ server-side authentication หรือทดสอบ query กับ Supabase จริง

## 5. คำสั่งติดตั้งและรัน

รันจากโฟลเดอร์โปรเจกต์:

```powershell
cd C:\Project\flood-aid
npm ci
npm run dev
```

เปิด `http://localhost:3000` สำหรับ development

ตรวจและเปิด production server:

```powershell
npm run lint
npm run typecheck
npm run build
npm start
```

ในรอบตั้งโครงใช้ `npm install` ติดตั้งชุดเริ่มต้น และ `npm install --save-exact @supabase/supabase-js@2.118.0` เพิ่ม SDK ส่วน `npm ci` เป็นคำสั่งสำหรับติดตั้งซ้ำตาม lockfile ไม่ได้ตรวจรันแยกในรอบดังกล่าว

ยังไม่มี test runner หรือสคริปต์ `npm test` เนื่องจากขอบเขตนี้ยังไม่มีตรรกะฟีเจอร์ให้ทดสอบ

## 6. ผลตรวจที่รันในรอบตั้งโครง

| การตรวจ | ผล |
| --- | --- |
| `npm run lint` | ผ่าน, exit code 0, ไม่มี errors หรือ warnings |
| `npm run typecheck` | ผ่าน, exit code 0 |
| `npm run build` | ผ่าน, exit code 0 เมื่อรันนอก sandbox |
| Production server: `npm start -- --port 3101` | เริ่มทำงานได้ และปิดหลังตรวจเสร็จ |
| HTTP GET `/` | 200 |
| HTTP GET `/help-request` | 200 |
| ตรวจลิงก์ในหน้าแรก | พบ `href="/help-request"` |
| ตรวจหน้าปลายทาง | ไม่พบ `<form` |
| `git check-ignore .env.local` | ยืนยันว่าไฟล์ถูก ignore |
| `git diff --check` | ไม่พบข้อผิดพลาด whitespace; Git แจ้งการแปลง LF/CRLF ของไฟล์ข้อความบางไฟล์ |
| ตรวจ bytes ของ schema ใน Git commit | ตรงกับต้นฉบับ |
| Git working tree ก่อนเพิ่มรายงาน | สะอาด |

### การตรวจ schema

เปรียบเทียบต้นฉบับ `C:\Users\HP\Downloads\schema.sql` กับ `db/schema.sql` ได้ SHA-256 ตรงกัน:

```text
991753834096E3D9415551E2C1953EB26DC351673EF8B0A88E39294BD2B1E296
```

ตรวจเนื้อหา schema ที่อยู่ใน commit เทียบกับต้นฉบับอีกครั้ง ได้ผล `true`

### ปัญหาที่พบระหว่างตรวจและการจัดการ

- lint ครั้งแรกพบ warning จากการ export object โดยตรงใน `postcss.config.mjs` แก้ให้กำหนดตัวแปรก่อน export แล้วตรวจผ่าน
- ทดลอง ESLint 10 แล้วพบ peer dependency ของปลั๊กอินบางตัวในชุด Next.js ไม่รองรับ จึงกลับมาใช้ ESLint 9.39.5
- build ใน sandbox ล้มเหลวตอน Turbopack เปิด child process เพื่อแปลง CSS จึงรันคำสั่งเดิมนอก sandbox แล้วผ่าน
- การตรวจ HTTP ใน sandbox ถูกปฏิเสธ socket จึงเปิดและตรวจ production server นอก sandbox ผ่าน loopback แล้วได้ HTTP 200 ทั้งสองหน้า
- ยังไม่ได้ตรวจด้วย browser automation หรือทดสอบกับอุปกรณ์มือถือจริง

## 7. ประวัติ commits ของงานตั้งโครง

| Commit | รายการ |
| --- | --- |
| `2ff1cc9` | `chore: scaffold Next.js TypeScript and Tailwind with ESLint` |
| `40cde02` | `chore: configure Supabase browser client and environment template` |
| `8156c7c` | `docs: add project instructions and unchanged database schema` |
| `5cd533b` | `chore: finalize lint configuration and record setup limitations` |

รายการนี้อ้างอิงสถานะก่อนเพิ่มไฟล์รายงาน ไม่รวม commit ของรายงานฉบับนี้

## 8. ข้อจำกัดและสิ่งที่ต้องตัดสินใจภายหลัง

1. ต้องระบุ Supabase URL และ publishable key ใน `.env.local` ก่อนทดสอบฐานข้อมูลจริง ห้ามส่ง secret/service_role key มาใช้ใน browser client
2. ยังไม่ได้รัน `db/schema.sql` และยังไม่ได้ตรวจรับรอง RLS หรือสิทธิ์กับฐานข้อมูลจริง งานนี้คงไฟล์ตามต้นฉบับเท่านั้น
3. `npm audit` รายงาน moderate 16 รายการในสาย dependencies ของ ESLint; high และ critical เป็น 0 ยังไม่ได้ใช้ `npm audit fix --force` เพราะข้อเสนอเปลี่ยน major versions ต้องพิจารณาการแก้ dependency ในงานถัดไป
4. ESLint 9.39.5 มีคำเตือนหมดช่วงสนับสนุน แต่ใช้เพื่อให้ตรงกับ peer dependencies ของปลั๊กอินชุดนี้
5. รายการ Sites ว่างที่ลงทะเบียนไว้จากงานรอบก่อนยังอยู่ แต่ไม่ได้เผยแพร่ เครื่องมือที่มีไม่มีคำสั่งลบรายการดังกล่าว โครงโปรเจกต์ใหม่นี้ไม่ได้ผูกหรือเผยแพร่ผ่าน Sites

## 9. เอกสารทางการที่ใช้

- [Next.js: Installation](https://nextjs.org/docs/app/getting-started/installation)
- [Next.js: ESLint](https://nextjs.org/docs/app/api-reference/config/eslint)
- [Tailwind CSS: Next.js](https://tailwindcss.com/docs/installation/framework-guides/nextjs)
- [Supabase JavaScript: Initializing](https://supabase.com/docs/reference/javascript/initializing)
