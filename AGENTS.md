# ระบบสารสนเทศช่วยเหลือผู้ประสบอุทกภัย

## บริบทและขอบเขตปัจจุบัน
- ผู้ใช้หลัก: ผู้ประสบภัยที่ใช้มือถือและอาจมีอินเทอร์เน็ตช้า รวมถึงเจ้าหน้าที่และอาสาสมัคร
- เทคโนโลยี: Next.js App Router, TypeScript (strict), Tailwind CSS และ @supabase/supabase-js
- งานปัจจุบัน: `/staff/login` และ `/staff` สำหรับล็อกอิน รายการแบบ pagination และเปลี่ยนสถานะพร้อม audit เท่านั้น ห้ามทำแผนที่ PWA สมัครสมาชิก จัดการผู้ใช้ หรือแก้ db/schema.sql/RLS
- งานฟอร์มรวมเข้า `main` แล้ว งานปัจจุบันอยู่บน `feat/staff-dashboard` แตกจาก main; commit เป็นขั้นเล็ก ๆ ไม่ merge หรือ push เอง
- ถ้าจำเป็นต้องแก้ schema ให้หยุดและรายงานเหตุผล ห้ามแก้เอง

## โครงสร้างโฟลเดอร์
```text
app/
  layout.tsx                 # Root layout ภาษาไทยและ metadata
  globals.css                # Tailwind และ CSS พื้นฐาน
  page.tsx                   # ชื่อระบบและลิงก์แจ้งขอความช่วยเหลือ
  help-request/page.tsx      # หน้าฟอร์มแจ้งขอความช่วยเหลือ
  staff/layout.tsx          # ครอบทุกหน้าเจ้าหน้าที่ด้วย session guard และปุ่มออกจากระบบ
  staff/login/page.tsx      # อีเมล/รหัสผ่าน ไม่มีสมัครสมาชิก
  staff/page.tsx            # รายการ ตัวกรอง pagination และเปลี่ยนสถานะ
components/staff-session.tsx # ตรวจ Auth user และแถว staff_profiles
lib/staff/domain.ts         # ลำดับสถานะ การเรียง เวลาไทย ลิงก์ Maps และแผน pagination
lib/staff/api.ts            # count/range และ optimistic update + audit
lib/staff/*.test.ts         # Unit tests และ mock ของ API
docs/reports/               # รายงาน 01-setup.md, 02-help-request-form.md, 03-staff-dashboard.md
components/help-request-form.tsx # ฟอร์มฝั่งผู้ใช้, GPS และการส่งข้อมูล
config/emergency.ts          # เบอร์สายด่วนยังเป็น null พร้อม TODO รอตรวจสอบ
lib/help-request/validation.ts # ตรวจข้อมูลและสร้าง payload ตรง schema
lib/help-request/validation.test.ts # Unit tests ของ validation และ payload
lib/help-request/submit.ts   # insert โดยไม่อ่านกลับ พร้อม timeout
lib/help-request/submit.test.ts # ทดสอบ insert/error/timeout ด้วย mock ไม่ใช่ฐานข้อมูลจริง
lib/supabase/client.ts       # SDK createBrowserClient จาก @supabase/ssr
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
- `npm test` — Vitest แบบรันครั้งเดียว ตรวจฟอร์มและ workflow เจ้าหน้าที่ รวม mock API; ไม่ใช่ browser/E2E หรือการทดสอบฐานข้อมูลจริง
- อย่ารัน typecheck พร้อม build เพราะ Next.js เขียนไฟล์ .next/types ใหม่ระหว่าง build ให้รันแยกตามลำดับ

## Environment และ Supabase
- คัดลอก `.env.example` เป็น `.env.local` แล้วกรอก URL กับ publishable key ของ Supabase เมื่อต้องเชื่อมต่อจริง
- `NEXT_PUBLIC_` ส่งถึงเบราว์เซอร์ได้ จึงห้ามใส่ secret หรือ service_role key
- ห้าม commit `.env.local` หรือความลับ ไฟล์นี้ถูก ignore อยู่แล้ว
- เว็บ build ได้โดยยังไม่กรอกค่า แต่การกดส่งฟอร์มต้องมีค่าการเชื่อมต่อ Supabase ที่ถูกต้อง
- เรียก `getSupabaseClient()` จาก Client Component โดยใช้ createBrowserClient ตามเอกสาร Next.js ของ Supabase ให้ SDK เก็บ/refresh session cookies เอง ห้ามเขียน token หรือข้อมูลผู้ประสบภัยลง localStorage/sessionStorage เอง
- ข้อมูลเจ้าหน้าที่โหลดเฉพาะ browser ไม่มีข้อมูลส่วนบุคคลใน server-rendered HTML จึงยังไม่เพิ่ม server client/proxy สำหรับ SSR authentication; ถ้าเพิ่มการอ่านข้อมูลใน server ต้องออกแบบใหม่ตามเอกสารทางการ
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

## พฤติกรรมหน้าที่เจ้าหน้าที่
- Guard ตรวจ auth.getUser() แล้วอ่าน staff_profiles ที่ id ตรง user; ไม่มี session ไป login, มี session แต่ไม่มี profile แสดงไม่มีสิทธิ์พร้อมออกจากระบบ
- Guard เป็น UX เท่านั้น ตัวป้องกันจริงคือ RLS เดิม ไม่เพิ่ม/แก้ policies
- Pagination หน้าละ 20: count แบบ head แยก critical/urgent/normal แล้วดึงเฉพาะ range ที่ต้องใช้ เรียง created_at และ id เป็นตัวตัดสินเมื่อเวลาเท่ากัน ไม่ดึงทั้งตาราง
- ผู้รับผิดชอบคนอื่นแสดง UUID เพราะ RLS อ่านชื่อ profile ได้เฉพาะตนเอง ไม่ขยายสิทธิ์
- pending -> assigned/cancelled; assigned -> in_progress/cancelled; in_progress -> done/cancelled; done/cancelled ปิดถาวร รับงานตั้ง assigned_to เป็นตนเอง
- เปลี่ยนสถานะด้วยเงื่อนไข id + status + updated_at + assigned_to เดิม และ select เฉพาะ id เพื่อตรวจ zero-row conflict (เฉพาะ staff ที่มีสิทธิ์ SELECT)
- อัปเดตสถานะกับ insert request_updates ไม่ atomic: แสดงคำเตือนเด่นเมื่อ audit ล้มเหลวหรือ update ยังไม่ยืนยัน โหลดรายการใหม่ และปิดปุ่มเปลี่ยนสถานะจนตรวจสอบ/refresh หน้า ไม่ rollback หรือ retry เงียบ ๆ
- ไม่ log ข้อมูลส่วนบุคคลหรือ raw auth/backend errors; logout ซ่อนข้อมูลทันทีและปิดระหว่างบันทึกตามปกติ
- คำเตือน audit ไม่อยู่ถาวรเมื่อปิดหน้า และการปิดแท็บหรือหมด session ระหว่างสองคำขออาจทำให้ประวัติขาด ต้องให้ผู้ดูแลตรวจสอบ

## ข้อจำกัดของเครื่องมือตั้งต้น
- ใช้ ESLint 9.39.5 เพราะปลั๊กอิน react/import/jsx-a11y ในชุดตั้งค่า Next.js นี้ยังไม่รองรับ peer dependency ของ ESLint 10 แม้ ESLint 9 จะมีคำเตือนหมดช่วงสนับสนุน
- ผล `npm audit` ตอนตั้งโครง (1 พฤศจิกายน 2026): moderate 16 รายการ อยู่ในสาย dependencies ของ ESLint; high/critical 0 รายการ ยังไม่ได้ใช้ `npm audit fix --force` เพราะข้อเสนออัตโนมัติเปลี่ยน major versions
- ยังไม่มีค่าการเชื่อมต่อ Supabase จึงยังไม่ได้ทดสอบ query กับฐานข้อมูลจริง

## เอกสารทางการที่ใช้ตั้งโครง
- https://nextjs.org/docs/app/getting-started/installation
- https://nextjs.org/docs/app/api-reference/config/eslint
- https://tailwindcss.com/docs/installation/framework-guides/nextjs
- https://supabase.com/docs/reference/javascript/initializing
- https://supabase.com/docs/guides/auth/server-side/nextjs
- https://supabase.com/docs/reference/javascript/auth-getuser
- https://supabase.com/docs/reference/javascript/auth-onauthstatechange
