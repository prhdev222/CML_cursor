# คู่มือการตั้งค่า Supabase สำหรับ CML Management System

## 📚 สารบัญ
1. [Supabase คืออะไร?](#supabase-คืออะไร)
2. [การสร้าง Supabase Project](#การสร้าง-supabase-project)
3. [การตั้งค่า Environment Variables](#การตั้งค่า-environment-variables)
4. [การรัน Database Schema](#การรัน-database-schema)
5. [การทดสอบการเชื่อมต่อ](#การทดสอบการเชื่อมต่อ)

---

## Supabase คืออะไร?

**Supabase** เป็น open-source alternative ของ Firebase ที่ให้บริการ:
- **PostgreSQL Database** - ฐานข้อมูลแบบ relational
- **Authentication** - ระบบยืนยันตัวตน
- **Real-time** - อัปเดตข้อมูลแบบ real-time
- **Storage** - เก็บไฟล์
- **API** - RESTful API อัตโนมัติ

สำหรับโปรเจกต์นี้ เราใช้ Supabase เป็น **Database** สำหรับเก็บข้อมูลผู้ป่วย CML

---

## การสร้าง Supabase Project

### วิธีที่ 1: ใช้ Supabase Cloud (แนะนำสำหรับเริ่มต้น)

1. **ไปที่เว็บไซต์ Supabase**
   - เปิดเบราว์เซอร์ไปที่: https://supabase.com
   - คลิก "Start your project" หรือ "Sign up"

2. **สร้างบัญชี**
   - ใช้ GitHub, Google, หรือ Email
   - ยืนยันอีเมล (ถ้าจำเป็น)

3. **สร้าง New Project**
   - คลิก "New Project"
   - กรอกข้อมูล:
     - **Name**: `cml-management-system` (หรือชื่อที่ต้องการ)
     - **Database Password**: สร้างรหัสผ่านที่แข็งแกร่ง (เก็บไว้!)
     - **Region**: เลือกที่ใกล้ที่สุด (เช่น `Southeast Asia (Singapore)`)
     - **Pricing Plan**: เลือก Free tier

4. **รอให้ Project สร้างเสร็จ** (ประมาณ 2-3 นาที)

5. **เก็บข้อมูลสำคัญ**
   - ไปที่ **Settings** → **API**
   - คัดลอก:
     - **Project URL** (เช่น `https://xxxxx.supabase.co`)
     - **anon/public key** (ยาวมาก เริ่มต้นด้วย `eyJ...`)

### วิธีที่ 2: Self-hosted Supabase (สำหรับ Coolify)

หากคุณใช้ Coolify บน Hostinger VPS:

1. **ติดตั้ง Supabase บน Coolify**
   - สร้าง Application ใหม่ใน Coolify
   - เลือก "Supabase" template
   - รอให้ติดตั้งเสร็จ

2. **เข้าถึง Supabase Dashboard**
   - ไปที่ URL ที่ Coolify ให้มา
   - Login ด้วย credentials ที่ตั้งค่าไว้

3. **เก็บข้อมูล API**
   - ไปที่ Settings → API
   - คัดลอก URL และ anon key

---

## การตั้งค่า Environment Variables

### ขั้นตอนที่ 1: เข้าใจความแตกต่างระหว่างไฟล์

#### `.env.example` (Template File)
- **ใช้สำหรับ**: แชร์ใน Git repository
- **ไม่ควรมี**: ค่าจริง (ใช้ placeholder)
- **จุดประสงค์**: เป็นตัวอย่างให้คนอื่นรู้ว่าต้องตั้งค่าอะไรบ้าง

#### `.env.local` (Local Development)
- **ใช้สำหรับ**: Development บนเครื่องของคุณ
- **มีค่า**: ค่าจริงจาก Supabase
- **ไม่ควร commit**: ไฟล์นี้อยู่ใน `.gitignore` แล้ว

### ขั้นตอนที่ 2: สร้างไฟล์ `.env.local`

1. **คัดลอกไฟล์ template**
   ```bash
   cd cml-management-system
   cp .env.example .env.local
   ```

2. **เปิดไฟล์ `.env.local` ด้วย text editor**
   ```bash
   # macOS/Linux
   nano .env.local
   # หรือ
   code .env.local  # ถ้าใช้ VS Code
   ```

3. **แก้ไขค่าตามนี้**:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvdXItcHJvamVjdC1pZCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjE2MjM5MDIyLCJleHAiOjE5MzE4MTUwMjJ9.your-actual-key-here
   
   # App Configuration
   NEXT_PUBLIC_APP_URL=http://localhost:3001
   ```

   **⚠️ สำคัญ**: แทนที่ `your-project-id` และ `your-actual-key-here` ด้วยค่าจริงจาก Supabase Dashboard

### ขั้นตอนที่ 3: ตรวจสอบว่าไฟล์ถูกต้อง

ไฟล์ `.env.local` ควรมีลักษณะแบบนี้:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.actual-long-key-here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

---

## การรัน Database Schema

### ขั้นตอนที่ 1: เข้าสู่ Supabase Dashboard

1. ไปที่ https://supabase.com/dashboard
2. เลือก Project ของคุณ
3. ไปที่ **SQL Editor** (เมนูด้านซ้าย)

### ขั้นตอนที่ 2: รัน SQL Script

1. **เปิดไฟล์ schema**
   - เปิดไฟล์ `supabase/schema.sql` ในโปรเจกต์ของคุณ
   - หรือดูเนื้อหาด้านล่าง

2. **คัดลอก SQL ทั้งหมด**
   - เลือกทั้งหมด (Cmd+A / Ctrl+A)
   - คัดลอก (Cmd+C / Ctrl+C)

3. **วางใน SQL Editor**
   - ไปที่ Supabase Dashboard → SQL Editor
   - คลิก "New query"
   - วาง SQL ที่คัดลอกมา (Cmd+V / Ctrl+V)

4. **รัน SQL**
   - คลิก "Run" หรือกด Cmd+Enter / Ctrl+Enter
   - รอให้เสร็จ (ควรเห็น "Success. No rows returned")

### ขั้นตอนที่ 3: ตรวจสอบ Tables

1. ไปที่ **Table Editor** (เมนูด้านซ้าย)
2. คุณควรเห็น tables ต่อไปนี้:
   - ✅ `patients`
   - ✅ `tki_records`
   - ✅ `test_results`
   - ✅ `alerts`

---

## การทดสอบการเชื่อมต่อ

### ขั้นตอนที่ 1: รีสตาร์ท Development Server

```bash
# หยุด server ปัจจุบัน (กด Ctrl+C)
# แล้วรันใหม่
npm run dev
```

### ขั้นตอนที่ 2: เปิดแอปในเบราว์เซอร์

1. ไปที่ http://localhost:3001/en/patients
2. คุณควรเห็น:
   - ✅ ไม่มี error ใน console
   - ✅ ไม่มีข้อความ "Supabase ไม่ได้ตั้งค่า"
   - ✅ สามารถเพิ่มผู้ป่วยได้

### ขั้นตอนที่ 3: ทดสอบเพิ่มข้อมูล

1. คลิก "Add New Patient"
2. กรอกข้อมูล:
   - Patient ID: `TEST001`
   - Name: `Test Patient`
   - Age: `45`
   - Gender: `Male`
   - Diagnosis Date: เลือกวันที่
   - Current TKI: `Imatinib`
   - Phase: `Chronic Phase`
3. คลิก "Save"
4. ตรวจสอบใน Supabase Dashboard → Table Editor → `patients`
   - คุณควรเห็นข้อมูลที่เพิ่มเข้าไป

---

## 🔒 ความปลอดภัย

### สิ่งที่ควรทำ:
- ✅ เก็บ `.env.local` เป็นความลับ (ไม่ commit ไป Git)
- ✅ ใช้ `anon key` สำหรับ client-side (ปลอดภัย)
- ✅ ใช้ `service_role key` เฉพาะ server-side เท่านั้น

### สิ่งที่ไม่ควรทำ:
- ❌ ไม่ commit `.env.local` ไป Git
- ❌ ไม่แชร์ `anon key` หรือ `service_role key` ใน public
- ❌ ไม่ใช้ `service_role key` ใน client-side code

---

## 🐛 Troubleshooting

### ปัญหา: "Supabase environment variables are not set"

**วิธีแก้**:
1. ตรวจสอบว่าไฟล์ `.env.local` มีอยู่จริง
2. ตรวจสอบว่าค่าถูกต้อง (ไม่มี space หรือ quote เพิ่มเติม)
3. รีสตาร์ท development server

### ปัญหา: "Failed to fetch" หรือ Network Error

**วิธีแก้**:
1. ตรวจสอบว่า Supabase URL ถูกต้อง
2. ตรวจสอบ internet connection
3. ตรวจสอบว่า Supabase project ยัง active อยู่

### ปัญหา: "relation does not exist"

**วิธีแก้**:
1. ตรวจสอบว่าได้รัน SQL schema แล้ว
2. ไปที่ Table Editor ตรวจสอบว่า tables มีอยู่จริง
3. รัน SQL schema อีกครั้ง

### ปัญหา: "new row violates row-level security policy"

**วิธีแก้**:
1. ไปที่ Supabase Dashboard → Authentication → Policies
2. ตรวจสอบว่า RLS policies ถูกตั้งค่าถูกต้อง
3. หรือปิด RLS ชั่วคราวสำหรับ testing (ไม่แนะนำสำหรับ production)

---

## 📝 ตัวอย่างไฟล์ `.env.local` ที่ถูกต้อง

```env
# ============================================
# Supabase Configuration
# ============================================
# คัดลอกจาก Supabase Dashboard → Settings → API
# Project URL
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co

# anon/public key (สำหรับ client-side)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.actual-long-key-here

# ============================================
# App Configuration
# ============================================
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

---

## 🎯 ขั้นตอนสรุป (Quick Start)

1. ✅ สร้าง Supabase project ที่ https://supabase.com
2. ✅ คัดลอก URL และ anon key จาก Settings → API
3. ✅ สร้างไฟล์ `.env.local` และใส่ค่าจริง
4. ✅ รัน SQL schema จาก `supabase/schema.sql` ใน SQL Editor
5. ✅ รีสตาร์ท development server (`npm run dev`)
6. ✅ ทดสอบที่ http://localhost:3001/en/patients

---

## 📚 เอกสารเพิ่มเติม

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)

---

**คำถาม?** ตรวจสอบ Troubleshooting section หรือดูใน README.md



