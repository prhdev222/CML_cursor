# 🔧 แก้ไขปัญหา "Failed to fetch" จาก Supabase

## สาเหตุที่พบบ่อย

### 1. ไฟล์ .env.local ไม่มีหรือค่าผิด

**ตรวจสอบ:**
```bash
# ตรวจสอบว่ามีไฟล์ .env.local
ls .env.local

# ดูเนื้อหา (ระวัง: อาจมีข้อมูลสำคัญ)
cat .env.local
```

**แก้ไข:**
1. สร้างไฟล์ `.env.local` ใน root directory
2. เพิ่มค่าดังนี้:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

### 2. Supabase URL หรือ Key ไม่ถูกต้อง

**ตรวจสอบ:**
- URL ต้องเริ่มด้วย `https://`
- URL ต้องลงท้ายด้วย `.supabase.co`
- Key ต้องเริ่มด้วย `eyJ` (JWT token)

**วิธีหา:**
1. ไปที่ https://supabase.com/dashboard
2. เลือก project ของคุณ
3. ไปที่ Settings → API
4. คัดลอก:
   - **Project URL** → ใส่ใน `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → ใส่ใน `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. ยังไม่ได้รีสตาร์ท Server

**แก้ไข:**
```bash
# หยุด server (Ctrl+C)
# แล้วรันใหม่
npm run dev
```

### 4. ปัญหา Network หรือ CORS

**ตรวจสอบ:**
- เช็คการเชื่อมต่ออินเทอร์เน็ต
- ลองเปิด Supabase Dashboard ดูว่าเข้าถึงได้หรือไม่
- ตรวจสอบ Browser Console สำหรับ error เพิ่มเติม

### 5. Supabase Project Paused หรือ Suspended

**ตรวจสอบ:**
- ไปที่ Supabase Dashboard
- ดูว่า project ยัง active อยู่หรือไม่
- ถ้า paused ให้ resume project

## ขั้นตอนแก้ไขแบบละเอียด

### Step 1: ตรวจสอบไฟล์ .env.local

```bash
# Windows PowerShell
if (Test-Path .env.local) {
    Write-Host "✅ File exists"
    Get-Content .env.local
} else {
    Write-Host "❌ File does not exist - creating template..."
    @"
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3001
"@ | Out-File -FilePath .env.local -Encoding utf8
}
```

### Step 2: ตรวจสอบค่าใน .env.local

เปิดไฟล์ `.env.local` และตรวจสอบว่า:
- ✅ ไม่มีช่องว่างหน้า/หลัง URL และ Key
- ✅ ไม่มีเครื่องหมาย `"` หรือ `'` ล้อมรอบค่า
- ✅ URL เริ่มด้วย `https://`
- ✅ Key เริ่มด้วย `eyJ`

### Step 3: รีสตาร์ท Development Server

```bash
# หยุด server ปัจจุบัน (Ctrl+C)
# รันใหม่
npm run dev
```

### Step 4: ตรวจสอบ Browser Console

1. เปิด Browser Developer Tools (F12)
2. ไปที่ tab "Console"
3. ดู error messages
4. ตรวจสอบว่า Supabase client initialized หรือไม่

### Step 5: ทดสอบการเชื่อมต่อ

ลองเปิดหน้า:
- http://localhost:3001/admin/login
- ดูว่า error ยังมีอยู่หรือไม่

## ตัวอย่าง .env.local ที่ถูกต้อง

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.actual-long-key-here

# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3001
NEXT_PUBLIC_BASE_URL=http://localhost:3001

# Server Port
PORT=3001
```

## ถ้ายังแก้ไม่ได้

1. ตรวจสอบ Supabase Dashboard ว่า project ยัง active
2. ลองสร้าง Supabase project ใหม่
3. ตรวจสอบ firewall หรือ proxy settings
4. ลองใช้ browser อื่น
5. ลอง clear browser cache

## ข้อมูลเพิ่มเติม

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)






