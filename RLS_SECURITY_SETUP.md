# 🔒 คู่มือการตั้งค่า RLS Security

## 📋 สรุป

Migration นี้จะปรับปรุงความปลอดภัยของระบบโดย:
1. **บล็อกการเข้าถึงข้อมูล sensitive จาก client-side** (patients, test_results, tki_records, alerts, admins, doctors, tki_medications)
2. **อนุญาตให้เข้าถึงข้อมูลสาธารณะ** (hospitals, guidelines, protocols, research_papers, patient_education)
3. **ใช้ API routes ที่มี service_role key** สำหรับเข้าถึงข้อมูล sensitive

## ⚠️ สิ่งสำคัญ

### 1. Environment Variable ใหม่

**ต้องเพิ่ม `SUPABASE_SERVICE_ROLE_KEY` ใน:**
- `.env.local` (local development)
- Vercel Environment Variables (production)

**วิธีหา Service Role Key:**
1. ไปที่ Supabase Dashboard → Project Settings → API
2. คัดลอก **service_role key** (ไม่ใช่ anon key!)
3. ⚠️ **อย่าแชร์ key นี้กับใคร และอย่า commit ไป Git**

### 2. ขั้นตอนการ Migration

#### Step 1: เพิ่ม Environment Variable

**Local Development:**
```bash
# เพิ่มใน .env.local
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (service_role key ของคุณ)
```

**Vercel:**
1. ไปที่ Vercel Dashboard → Project → Settings → Environment Variables
2. เพิ่ม:
   - Key: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: [service_role key ของคุณ]
   - Environment: Production, Preview, Development (เลือกทั้งหมด)
3. **Redeploy** application หลังจากเพิ่ม environment variable

#### Step 2: ตรวจสอบ API Routes

ตรวจสอบว่า API routes ทั้งหมดใช้ `supabaseAdmin` (service_role key) แทน `supabase` (anon key):

✅ **ถูกต้อง:**
```typescript
import { supabaseAdmin } from '@/lib/supabase-admin';

// ใน API route
const { data } = await supabaseAdmin.from('patients').select('*');
```

❌ **ผิด:**
```typescript
import { supabase } from '@/lib/supabase';

// ใน API route - จะถูกบล็อกโดย RLS!
const { data } = await supabase.from('patients').select('*');
```

#### Step 3: รัน Migration

1. ไปที่ Supabase Dashboard → SQL Editor
2. เปิดไฟล์ `supabase/migrations/011_apply_secure_rls.sql`
3. Copy ทั้งหมดและ paste ลงใน SQL Editor
4. คลิก **Run**

#### Step 4: ตรวจสอบผลลัพธ์

หลังจาก run migration:
- ✅ Client-side code ที่เรียก `supabase.from('patients')` จะถูกบล็อก
- ✅ API routes ที่ใช้ `supabaseAdmin` จะทำงานได้ปกติ
- ✅ Public data (hospitals, guidelines) ยังเข้าถึงได้จาก client-side

## 🔍 การตรวจสอบ

### ตรวจสอบว่า RLS ทำงาน

1. เปิด Browser Console
2. พยายามเรียก `supabase.from('patients').select('*')` จาก client-side
3. ควรจะได้ error หรือ empty result

### ตรวจสอบ API Routes

1. ตรวจสอบ Network tab ใน Browser DevTools
2. API routes ควรทำงานได้ปกติ
3. ตรวจสอบว่า response มีข้อมูล

## 📝 สิ่งที่ต้องทำหลังจาก Migration

### 1. อัปเดต Client-Side Code

**ปัจจุบัน (จะถูกบล็อก):**
```typescript
// ❌ จะไม่ทำงานหลังจาก migration
const { data } = await supabase.from('patients').select('*');
```

**ต้องเปลี่ยนเป็น:**
```typescript
// ✅ ใช้ API route แทน
const response = await fetch('/api/patients');
const data = await response.json();
```

### 2. สร้าง API Routes (ถ้ายังไม่มี)

สำหรับ operations ที่ยังไม่มี API route:

**ตัวอย่าง: `/app/api/patients/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabaseAdmin
      .from('patients')
      .select('*, hospital:hospitals(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data, error } = await supabaseAdmin
      .from('patients')
      .insert([body])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

## 🚨 Troubleshooting

### Error: "new row violates row-level security policy"

**สาเหตุ:** Client-side code พยายามเข้าถึงข้อมูลที่ถูกบล็อก

**แก้ไข:**
1. ตรวจสอบว่าใช้ API route แทนการเรียก supabase โดยตรง
2. ตรวจสอบว่า API route ใช้ `supabaseAdmin` ไม่ใช่ `supabase`

### Error: "Invalid API key"

**สาเหตุ:** `SUPABASE_SERVICE_ROLE_KEY` ไม่ถูกต้องหรือไม่ได้ตั้งค่า

**แก้ไข:**
1. ตรวจสอบว่า environment variable ถูกตั้งค่าแล้ว
2. ตรวจสอบว่า key ถูกต้อง (ต้องเป็น service_role key ไม่ใช่ anon key)
3. Restart development server หรือ redeploy

### API Routes ไม่ทำงาน

**สาเหตุ:** อาจใช้ `supabase` แทน `supabaseAdmin`

**แก้ไข:**
1. ตรวจสอบ imports ใน API routes
2. เปลี่ยนจาก `supabase` เป็น `supabaseAdmin`
3. ตรวจสอบว่า `lib/supabase-admin.ts` มีอยู่และถูกต้อง

## 📚 เอกสารเพิ่มเติม

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Service Role Key Security](https://supabase.com/docs/guides/api/api-keys)

## ✅ Checklist

ก่อน run migration:
- [ ] เพิ่ม `SUPABASE_SERVICE_ROLE_KEY` ใน `.env.local`
- [ ] เพิ่ม `SUPABASE_SERVICE_ROLE_KEY` ใน Vercel Environment Variables
- [ ] ตรวจสอบว่า API routes ใช้ `supabaseAdmin`
- [ ] ทดสอบ API routes ว่าทำงานได้

หลัง run migration:
- [ ] ตรวจสอบว่า client-side access ถูกบล็อก
- [ ] ตรวจสอบว่า API routes ยังทำงานได้
- [ ] ทดสอบการทำงานของ application
- [ ] Redeploy บน Vercel (ถ้าจำเป็น)

