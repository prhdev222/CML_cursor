# 📖 คู่มือ Environment Variables (.env.example vs .env.local)

## 🎯 ความแตกต่างหลัก

### `.env.example` (Template File)
```
✅ แชร์ใน Git repository
✅ ไม่มีค่าจริง (ใช้ placeholder)
✅ เป็นตัวอย่างให้คนอื่นรู้ว่าต้องตั้งค่าอะไร
✅ ปลอดภัยที่จะ commit
```

### `.env.local` (Your Actual Config)
```
❌ ไม่ commit ไป Git (อยู่ใน .gitignore)
✅ มีค่าจริงจาก Supabase
✅ ใช้สำหรับ development บนเครื่องคุณ
✅ ต้องสร้างเอง (คัดลอกจาก .env.example)
```

---

## 📝 ตัวอย่างไฟล์

### `.env.example` (Template)
```env
# Template - ไม่มีค่าจริง
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

### `.env.local` (Your Real Values)
```env
# ค่าจริงจาก Supabase Dashboard
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.actual-long-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

---

## 🚀 วิธีใช้งาน

### ขั้นตอนที่ 1: สร้างไฟล์ .env.local

```bash
# คัดลอกไฟล์ template
cp .env.example .env.local
```

### ขั้นตอนที่ 2: แก้ไขค่าจริง

เปิดไฟล์ `.env.local` และแทนที่:

1. `your_supabase_url_here` → URL จริงจาก Supabase
2. `your_supabase_anon_key_here` → Key จริงจาก Supabase

### ขั้นตอนที่ 3: รีสตาร์ท Server

```bash
npm run dev
```

---

## 🔍 วิธีหา Supabase Credentials

### 1. ไปที่ Supabase Dashboard
https://supabase.com/dashboard

### 2. เลือก Project ของคุณ

### 3. ไปที่ Settings → API

### 4. คัดลอก 2 ค่านี้:

#### Project URL
```
https://abcdefghijklmnop.supabase.co
```
- คัดลอกทั้ง URL
- ใส่ใน `NEXT_PUBLIC_SUPABASE_URL`

#### anon public key
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.actual-long-key-here
```
- คัดลอกทั้ง key (ยาวมาก)
- ใส่ใน `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## ✅ Checklist

- [ ] สร้าง Supabase project แล้ว
- [ ] คัดลอก Project URL แล้ว
- [ ] คัดลอก anon key แล้ว
- [ ] สร้างไฟล์ `.env.local` แล้ว
- [ ] แก้ไขค่าจริงใน `.env.local` แล้ว
- [ ] รีสตาร์ท server แล้ว (`npm run dev`)
- [ ] ทดสอบแล้ว (เปิด http://localhost:3001/en/patients)

---

## ⚠️ สิ่งสำคัญ

### ✅ ควรทำ:
- เก็บ `.env.local` เป็นความลับ
- ใช้ `.env.example` เป็น template
- Commit `.env.example` ไป Git
- **ไม่** commit `.env.local` ไป Git

### ❌ ไม่ควรทำ:
- ไม่ commit `.env.local` ไป Git
- ไม่แชร์ keys ใน public
- ไม่ใช้ `service_role` key ใน client-side

---

## 🐛 Troubleshooting

### ปัญหา: "Supabase environment variables are not set"

**สาเหตุ**: ไฟล์ `.env.local` ไม่มี หรือค่าผิด

**วิธีแก้**:
1. ตรวจสอบว่าไฟล์ `.env.local` มีอยู่
2. ตรวจสอบว่าค่าถูกต้อง (ไม่มี space หรือ quote)
3. รีสตาร์ท server

### ปัญหา: "Failed to fetch"

**สาเหตุ**: Supabase URL หรือ Key ผิด

**วิธีแก้**:
1. ตรวจสอบว่า URL ถูกต้อง (เริ่มด้วย `https://`)
2. ตรวจสอบว่า Key ถูกต้อง (ยาวมาก เริ่มด้วย `eyJ`)
3. ตรวจสอบว่า Supabase project ยัง active

---

## 📚 เอกสารเพิ่มเติม

- ดู `SUPABASE_SETUP.md` สำหรับรายละเอียดเต็ม
- ดู `QUICK_START.md` สำหรับขั้นตอนด่วน
- [Supabase Docs](https://supabase.com/docs)



