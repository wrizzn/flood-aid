# ระบบสารสนเทศช่วยเหลือผู้ประสบอุทกภัย

## บริบทและขอบเขตปัจจุบัน
- ผู้ใช้หลัก: ผู้ประสบภัยที่ใช้มือถือและอาจมีอินเทอร์เน็ตช้า รวมถึงเจ้าหน้าที่และอาสาสมัคร
- เทคโนโลยี: Next.js App Router, TypeScript (strict), Tailwind CSS และ @supabase/supabase-js
- งานปัจจุบัน: ฟอร์มแจ้งขอความช่วยเหลือที่ `/help-request` เท่านั้น ห้ามเพิ่มล็อกอิน แดชบอร์ด แผนที่ PWA หรือฟีเจอร์อื่นโดยไม่มีคำสั่งจากผู้ใช้
- งานตั้งต้นรวมเข้า `main` แล้ว งานฟอร์มอยู่บน branch `feat/help-request-form` ที่แตกจาก `main` ให้ commit เป็นขั้นเล็ก ๆ และไม่ merge เอง

## โครงสร้างโฟลเดอร์
```text
app/
  layout.tsx                 # Root layout ภาษาไทยและ metadata
  globals.css                # Tailwind และ CSS พื้นฐาน
  page.tsx                   # ชื่อระบบและลิงก์แจ้งขอความช่วยเหลือ
  help-request/page.tsx      # หน้าฟอร์มแจ้งขอความช่วยเหลือ
components/help-request-form.tsx # ฟอร์มฝั่งผู้ใช้, GPS และการส่งข้อมูล
config/emergency.ts          # เบอร์สายด่วนยังเป็น null พร้อม TODO รอตรวจสอบ
lib/help-request/validation.ts # ตรวจข้อมูลและสร้าง payload ตรง schema
lib/help-request/validation.test.ts # Unit tests ของ validation และ payload
lib/help-request/submit.ts   # insert โดยไม่อ่านกลับ พร้อม timeout
lib/help-request/submit.test.ts # ทดสอบ insert/error/timeout ด้วย mock ไม่ใช่ฐานข้อมูลจริง
lib/supabase/client.ts       # Browser client แบบสร้างเมื่อเรียกใช้
db/schema.sql               # สำเนาไฟล์ของผู้ใช้ ห้ามแก้เนื้อหาโดยไม่ได้รับคำสั่ง
.env.example                # รายชื่อตัวแปร ไม่ใส่ค่าจริง
.env.local                  # ตั้งค่าเฉพาะเครื่อง ถูก Git ignore
vitest.config.mjs            # Vitest แบบ Node environment
```

## คำสั่ง
รันจาก root ของโปรเจกต์ โดยใช้ Node.js >=20.9 (แนะนำ Node.js 24 LTS) และ npm
- `npm ci` — ติดตั้งตาม package-lock.json
- `npm run dev` — development server ที่ http://localhost:3000
- `npm run lint` — ESLint; ไม่ยอมให้มี warnings
- `npm run typecheck` — ตรวจ TypeScript โดยไม่สร้าง output
- `npm run build` — production build และตรวจ TypeScript โดย Next.js
- `npm start` — เปิด production server หลัง build
- `npm test` — Vitest แบบรันครั้งเดียว ตรวจ validation, ค่าขอบเขต และ payload; ยังไม่ใช่ browser/E2E หรือการทดสอบฐานข้อมูลจริง

## Environment และ Supabase
- คัดลอก `.env.example` เป็น `.env.local` แล้วกรอก URL กับ publishable key ของ Supabase เมื่อต้องเชื่อมต่อจริง
- `NEXT_PUBLIC_` ส่งถึงเบราว์เซอร์ได้ จึงห้ามใส่ secret หรือ service_role key
- ห้าม commit `.env.local` หรือความลับ ไฟล์นี้ถูก ignore อยู่แล้ว
- เว็บ build ได้โดยยังไม่กรอกค่า แต่การกดส่งฟอร์มต้องมีค่าการเชื่อมต่อ Supabase ที่ถูกต้อง
- เรียก `getSupabaseClient()` จาก Client Component เมื่อพัฒนาฟีเจอร์ในอนาคต ไม่ใช้ browser client นี้แทน server-side authentication
- `db/schema.sql` คัดลอกตามต้นฉบับเท่านั้น ยังไม่ได้รันกับฐานข้อมูลและยังไม่ได้ตรวจรับรองสิทธิ์ RLS สำหรับใช้งานจริง
- ถ้าไม่แน่ใจ API หรือเวอร์ชัน ให้ตรวจเอกสารทางการ หากข้อมูลจำเป็นไม่ครบให้ถามผู้ใช้ก่อนลงมือ

## พฤติกรรมฟอร์ม
- ส่งด้วย `getSupabaseClient().from('help_requests').insert(...)` โดยห้ามต่อ `.select()` เนื่องจาก anonymous user ไม่มีสิทธิ์อ่านคำขอ
- ไม่ส่ง status, assigned_to, id หรือ timestamps จากฟอร์ม ใช้ค่าเริ่มต้นในฐานข้อมูล
- ห้าม log ชื่อ เบอร์โทร ที่อยู่ พิกัด รายละเอียด หรือ raw backend error ที่อาจมีข้อมูลส่วนบุคคล
- ต้องมีชื่อ เบอร์โทร พิกัด จำนวนคนอย่างน้อย 1 และประเภทความต้องการอย่างน้อย 1 รายการ; ที่อยู่และรายละเอียดไม่บังคับ
- รองรับเบอร์ไทยภายในประเทศ: มือถือ 10 หลักขึ้นต้น 06/08/09 หรือโทรศัพท์บ้าน 9 หลักขึ้นต้น 02–07 อนุญาตช่องว่างและขีด แต่ยังไม่รับรูปแบบ +66
- พิกัดรองรับ -90 ถึง 90 และ -180 ถึง 180 รวมศูนย์และขอบเขต; จำนวนคนสูงสุดตาม PostgreSQL int (2,147,483,647)
- GPS ต้องใช้ HTTPS หรือ localhost; มี timeout 15 วินาทีและกรอกพิกัดเองได้ หากกรอกเองระหว่างค้นหา ให้เพิกเฉยผล GPS ที่กลับมาทีหลัง
- ระหว่างส่งล็อกการแก้ข้อมูลและกดซ้ำด้วย state และ ref; ส่งสำเร็จล็อกฟอร์มไว้ ไม่ล้างข้อมูลเงียบ ๆ
- ส่งข้อมูลมี timeout 30 วินาที ไม่ retry อัตโนมัติ; ล้มเหลวยังคงค่าให้ลองส่งใหม่ พร้อมเตือนว่าการตอบกลับขาดหายอาจทำให้คำขอซ้ำ ยังไม่มี idempotency ฝั่ง server
- เบอร์สายด่วนใน `config/emergency.ts` เป็น null จนกว่าจะได้รับการตรวจสอบ ห้ามเดาหรือใส่เบอร์เอง

## ข้อจำกัดของเครื่องมือตั้งต้น
- ใช้ ESLint 9.39.5 เพราะปลั๊กอิน react/import/jsx-a11y ในชุดตั้งค่า Next.js นี้ยังไม่รองรับ peer dependency ของ ESLint 10 แม้ ESLint 9 จะมีคำเตือนหมดช่วงสนับสนุน
- ผล `npm audit` ตอนตั้งโครง (1 พฤศจิกายน 2026): moderate 16 รายการ อยู่ในสาย dependencies ของ ESLint; high/critical 0 รายการ ยังไม่ได้ใช้ `npm audit fix --force` เพราะข้อเสนออัตโนมัติเปลี่ยน major versions
- ยังไม่มีค่าการเชื่อมต่อ Supabase จึงยังไม่ได้ทดสอบ query กับฐานข้อมูลจริง

## เอกสารทางการที่ใช้ตั้งโครง
- https://nextjs.org/docs/app/getting-started/installation
- https://nextjs.org/docs/app/api-reference/config/eslint
- https://tailwindcss.com/docs/installation/framework-guides/nextjs
- https://supabase.com/docs/reference/javascript/initializing
