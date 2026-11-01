# ระบบสารสนเทศช่วยเหลือผู้ประสบอุทกภัย

## บริบทและขอบเขตปัจจุบัน
- ผู้ใช้หลัก: ผู้ประสบภัยที่ใช้มือถือและอาจมีอินเทอร์เน็ตช้า รวมถึงเจ้าหน้าที่และอาสาสมัคร
- เทคโนโลยี: Next.js App Router, TypeScript (strict), Tailwind CSS และ @supabase/supabase-js
- งานปัจจุบันเป็นการวางโครงโปรเจกต์เท่านั้น ห้ามเพิ่มฟอร์ม ล็อกอิน แดชบอร์ด แผนที่ PWA หรือฟีเจอร์อื่นโดยไม่มีคำสั่งจากผู้ใช้
- ทำงานบน branch `chore/setup` สำหรับงานตั้งต้นนี้ และ commit เป็นขั้นเล็ก ๆ

## โครงสร้างโฟลเดอร์
```text
app/
  layout.tsx                 # Root layout ภาษาไทยและ metadata
  globals.css                # Tailwind และ CSS พื้นฐาน
  page.tsx                   # ชื่อระบบและลิงก์แจ้งขอความช่วยเหลือ
  help-request/page.tsx      # หน้าปลายทางเปล่า มีเพียงชื่อหน้า
lib/supabase/client.ts       # Browser client แบบสร้างเมื่อเรียกใช้
db/schema.sql               # สำเนาไฟล์ของผู้ใช้ ห้ามแก้เนื้อหาโดยไม่ได้รับคำสั่ง
.env.example                # รายชื่อตัวแปร ไม่ใส่ค่าจริง
.env.local                  # ตั้งค่าเฉพาะเครื่อง ถูก Git ignore
```

## คำสั่ง
รันจาก root ของโปรเจกต์ โดยใช้ Node.js >=20.9 (แนะนำ Node.js 24 LTS) และ npm
- `npm ci` — ติดตั้งตาม package-lock.json
- `npm run dev` — development server ที่ http://localhost:3000
- `npm run lint` — ESLint; ไม่ยอมให้มี warnings
- `npm run typecheck` — ตรวจ TypeScript โดยไม่สร้าง output
- `npm run build` — production build และตรวจ TypeScript โดย Next.js
- `npm start` — เปิด production server หลัง build
- Tests: ยังไม่มี test runner หรือ `npm test` ในงานตั้งโครงนี้ ให้ใช้ lint, typecheck, build และตรวจหน้า `/` กับ `/help-request` เมื่อเพิ่มตรรกะสำคัญค่อยเพิ่ม tests ที่เหมาะสมตามขอบเขตที่ผู้ใช้อนุมัติ

## Environment และ Supabase
- คัดลอก `.env.example` เป็น `.env.local` แล้วกรอก URL กับ publishable key ของ Supabase เมื่อต้องเชื่อมต่อจริง
- `NEXT_PUBLIC_` ส่งถึงเบราว์เซอร์ได้ จึงห้ามใส่ secret หรือ service_role key
- ห้าม commit `.env.local` หรือความลับ ไฟล์นี้ถูก ignore อยู่แล้ว
- หน้าโครงโปรเจกต์ไม่เรียก Supabase จึง build ได้โดยยังไม่กรอกค่า
- เรียก `getSupabaseClient()` จาก Client Component เมื่อพัฒนาฟีเจอร์ในอนาคต ไม่ใช้ browser client นี้แทน server-side authentication
- `db/schema.sql` คัดลอกตามต้นฉบับเท่านั้น ยังไม่ได้รันกับฐานข้อมูลและยังไม่ได้ตรวจรับรองสิทธิ์ RLS สำหรับใช้งานจริง
- ถ้าไม่แน่ใจ API หรือเวอร์ชัน ให้ตรวจเอกสารทางการ หากข้อมูลจำเป็นไม่ครบให้ถามผู้ใช้ก่อนลงมือ

## เอกสารทางการที่ใช้ตั้งโครง
- https://nextjs.org/docs/app/getting-started/installation
- https://nextjs.org/docs/app/api-reference/config/eslint
- https://tailwindcss.com/docs/installation/framework-guides/nextjs
- https://supabase.com/docs/reference/javascript/initializing
