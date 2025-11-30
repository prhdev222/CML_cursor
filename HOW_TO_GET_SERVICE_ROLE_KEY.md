# 🔑 วิธีหา Service Role Key จาก Supabase

## 📋 ขั้นตอนการหา Service Role Key

### 1. เข้าสู่ Supabase Dashboard

1. ไปที่ [https://supabase.com](https://supabase.com)
2. Login เข้าสู่ระบบ
3. เลือก Project ของคุณ (CML Management System)

### 2. ไปที่ Project Settings

1. คลิกที่ **⚙️ Settings** (ไอคอนเฟือง) ที่แถบด้านซ้าย
2. หรือคลิกที่ชื่อ Project → **Settings**

### 3. ไปที่หน้า API

1. ในเมนู Settings ด้านซ้าย ให้คลิก **API**
2. หรือไปที่: `https://supabase.com/dashboard/project/[YOUR_PROJECT_ID]/settings/api`

### 4. หา Service Role Key

ในหน้า API Settings คุณจะเห็น:

#### 🔵 **anon/public key** (อันนี้ไม่ใช่!)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvdXJwcm9qZWN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxMjM0NTYsImV4cCI6MTk2MDY5OTQ1Nn0...
```
- ตัวนี้คือ **anon key** (ใช้ใน client-side)
- ตัวนี้คือที่คุณใช้ใน `NEXT_PUBLIC_SUPABASE_ANON_KEY`

#### 🔴 **service_role key** (อันนี้แหละ!)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvdXJwcm9qZWN0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY0NTEyMzQ1NiwiZXhwIjoxOTYwNjk5NDU2fQ...
```
- ตัวนี้คือ **service_role key** (ใช้ใน server-side เท่านั้น!)
- ตัวนี้คือที่คุณต้องใช้ใน `SUPABASE_SERVICE_ROLE_KEY`

### 5. คัดลอก Service Role Key

1. หาส่วน **"service_role"** หรือ **"service_role key"**
2. คลิกที่ปุ่ม **👁️ Reveal** หรือ **📋 Copy** เพื่อแสดง key
3. คัดลอก key ทั้งหมด (จะยาวมาก เริ่มต้นด้วย `eyJ...`)

### 6. ใส่ใน Vercel

1. ไปที่ Vercel Dashboard → Project → Settings → Environment Variables
2. คลิก **Add New**
3. ใส่:
   - **Key**: `SUPABASE_SERVICE_ROLE_KEY`
   - **Value**: [paste service_role key ที่คัดลอกมา]
   - **Environment**: เลือก Production, Preview, Development (เลือกทั้งหมด)
4. คลิก **Save**

### 7. ใส่ใน Local (.env.local)

สร้างหรือแก้ไขไฟล์ `.env.local` ในโปรเจกต์:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... (anon key)
SUPABASE_SERVICE_ROLE_KEY=eyJ... (service_role key)
```

## ⚠️ คำเตือนสำคัญ

### ✅ ปลอดภัย
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - ใส่ใน Vercel ได้ (ออกแบบมาให้ใช้ใน client-side)
- `NEXT_PUBLIC_SUPABASE_URL` - ใส่ใน Vercel ได้ (public URL)

### 🔒 ต้องเก็บเป็นความลับ
- `SUPABASE_SERVICE_ROLE_KEY` - **อย่าแชร์กับใคร!**
- `SUPABASE_SERVICE_ROLE_KEY` - **อย่า commit ไป Git!**
- `SUPABASE_SERVICE_ROLE_KEY` - **ใช้ใน server-side เท่านั้น!**

## 🔍 วิธีแยกแยะ Key

### Anon Key
- มี `"role":"anon"` ใน payload (ถ้า decode JWT)
- ใช้ใน client-side code
- ถูกจำกัดโดย RLS policies

### Service Role Key
- มี `"role":"service_role"` ใน payload (ถ้า decode JWT)
- ใช้ใน server-side code เท่านั้น (API routes)
- **bypass RLS policies** (เข้าถึงข้อมูลได้ทั้งหมด!)

## 📸 ตัวอย่างตำแหน่งใน Supabase Dashboard

```
Supabase Dashboard
├── Project: [Your Project Name]
│   ├── Settings ⚙️
│   │   ├── General
│   │   ├── API ← ไปที่หน้านี้!
│   │   │   ├── Project URL
│   │   │   ├── anon public key (👁️ Reveal)
│   │   │   └── service_role key (👁️ Reveal) ← อันนี้!
│   │   ├── Database
│   │   └── ...
```

## ✅ Checklist

- [ ] เข้า Supabase Dashboard
- [ ] ไปที่ Settings → API
- [ ] คัดลอก **service_role key** (ไม่ใช่ anon key!)
- [ ] ใส่ใน Vercel Environment Variables
- [ ] ใส่ใน `.env.local` (local development)
- [ ] ตรวจสอบว่า key เริ่มต้นด้วย `eyJ`
- [ ] Redeploy application

## 🆘 ปัญหาที่พบบ่อย

### Q: หา service_role key ไม่เจอ
**A:** 
- ตรวจสอบว่าคุณเป็น Project Owner หรือมีสิทธิ์ Admin
- ลองคลิกที่ปุ่ม "Reveal" หรือ "Show" ใกล้ๆ service_role key
- บางครั้งอาจซ่อนอยู่ด้านล่างของหน้า API Settings

### Q: Key ไม่ทำงาน
**A:**
- ตรวจสอบว่าคัดลอก key ทั้งหมด (ยาวมาก)
- ตรวจสอบว่าไม่มี space หรือ newline ติดมาด้วย
- ตรวจสอบว่าใช้ service_role key ไม่ใช่ anon key

### Q: กลัวว่า key จะรั่วไหล
**A:**
- Service Role Key ควรเก็บใน Environment Variables เท่านั้น
- ตรวจสอบว่า `.env.local` อยู่ใน `.gitignore`
- ตรวจสอบว่าไม่ได้ commit key ไป Git
- ถ้า key รั่วไหล ให้รีเซ็ตใหม่ใน Supabase Dashboard

## 📚 เอกสารเพิ่มเติม

- [Supabase API Keys Documentation](https://supabase.com/docs/guides/api/api-keys)
- [Service Role Key Security](https://supabase.com/docs/guides/api/api-keys#the-service-role-key)

