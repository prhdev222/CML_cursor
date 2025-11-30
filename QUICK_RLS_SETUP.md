# ⚡ Quick RLS Security Setup

## ขั้นตอนด่วน (3 ขั้นตอน)

### 1️⃣ เพิ่ม Service Role Key

**ใน Vercel:**
1. ไปที่ Vercel Dashboard → Project → Settings → Environment Variables
2. เพิ่ม:
   - Key: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: [service_role key จาก Supabase Dashboard]
   - Environment: Production, Preview, Development

**ใน Local (.env.local):**
```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2️⃣ Run Migration

1. ไปที่ Supabase Dashboard → SQL Editor
2. Copy เนื้อหาจาก `supabase/migrations/011_apply_secure_rls.sql`
3. Paste และ Run

### 3️⃣ Redeploy

```bash
npx vercel --prod
```

## ⚠️ สิ่งสำคัญ

- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` ปลอดภัยที่จะใส่ใน Vercel (ถูกออกแบบมาให้ใช้ใน client-side)
- 🔒 `SUPABASE_SERVICE_ROLE_KEY` ต้องเก็บเป็นความลับ (server-side only)
- 📝 อ่านรายละเอียดเพิ่มเติมใน `RLS_SECURITY_SETUP.md`

## ✅ หลัง Migration

- Client-side code ที่เรียก `supabase.from('patients')` จะถูกบล็อก
- API routes ที่ใช้ `supabaseAdmin` จะทำงานได้ปกติ
- Public data (hospitals, guidelines) ยังเข้าถึงได้

