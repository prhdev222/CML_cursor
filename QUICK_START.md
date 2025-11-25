# 🚀 Quick Start Guide - Supabase Setup

## ขั้นตอนด่วน (5 นาที)

### 1️⃣ สร้าง Supabase Project (2 นาที)

1. ไปที่ https://supabase.com
2. คลิก "Start your project" → Sign up/Sign in
3. คลิก "New Project"
4. กรอกข้อมูล:
   - Name: `cml-management-system`
   - Password: สร้างรหัสผ่าน (เก็บไว้!)
   - Region: `Southeast Asia (Singapore)`
5. รอ 2-3 นาที

### 2️⃣ คัดลอก API Keys (1 นาที)

1. ใน Supabase Dashboard → คลิก **Settings** (⚙️)
2. คลิก **API** (ในเมนูซ้าย)
3. คัดลอก 2 ค่านี้:
   - **Project URL** → คัดลอก (เช่น `https://xxxxx.supabase.co`)
   - **anon public** key → คัดลอก (ยาวมาก เริ่มด้วย `eyJ...`)

### 3️⃣ สร้างไฟล์ .env.local (1 นาที)

```bash
# ใน terminal
cd cml-management-system
cp .env.example .env.local
```

เปิดไฟล์ `.env.local` และแก้ไข:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co  # ใส่ URL ที่คัดลอกมา
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...  # ใส่ key ที่คัดลอกมา
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

### 4️⃣ รัน Database Schema (1 นาที)

1. ใน Supabase Dashboard → คลิก **SQL Editor**
2. คลิก **New query**
3. เปิดไฟล์ `supabase/schema.sql` ในโปรเจกต์
4. คัดลอก SQL ทั้งหมด → วางใน SQL Editor
5. คลิก **Run** (หรือกด Cmd+Enter)

### 5️⃣ รีสตาร์ท Server

```bash
# หยุด server ปัจจุบัน (Ctrl+C)
npm run dev
```

### 6️⃣ ทดสอบ

เปิดเบราว์เซอร์: http://localhost:3001/en/patients

✅ **สำเร็จ!** ถ้าเห็นหน้า Patients โดยไม่มี error

---

## 📝 ตัวอย่างไฟล์ .env.local ที่ถูกต้อง

```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.actual-long-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

---

## ❓ ปัญหาที่พบบ่อย

**Q: หา API keys ไม่เจอ**
- A: Settings → API (ไม่ใช่ Database หรืออื่นๆ)

**Q: รัน SQL แล้ว error**
- A: ตรวจสอบว่า copy SQL ทั้งหมดแล้ว (รวม comments)

**Q: ยังเห็น error "Supabase ไม่ได้ตั้งค่า"**
- A: รีสตาร์ท server (`npm run dev`)

**Q: ต้องการความช่วยเหลือเพิ่มเติม**
- A: ดู SUPABASE_SETUP.md สำหรับรายละเอียดเต็ม



