# 🔒 RLS Security Migration Guide

## 📋 สรุป

Migration นี้จะปรับปรุงความปลอดภัยของระบบโดย:
1. **บล็อกการเข้าถึงข้อมูล sensitive จาก client-side** (patients, test_results, tki_records, alerts, admins, doctors)
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

### 2. Migration Steps

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

#### Step 2: รัน Migration

1. ไปที่ Supabase Dashboard → SQL Editor
2. เปิดไฟล์ `supabase/migrations/010_secure_rls_policies.sql`
3. Copy ทั้งหมดและ paste ลงใน SQL Editor
4. คลิก **Run**

#### Step 3: ตรวจสอบผลลัพธ์

หลังจากรัน migration:
- ✅ Client-side queries ไปยังข้อมูล sensitive จะถูกบล็อก
- ✅ API routes ที่ใช้ `supabaseAdmin` จะยังทำงานได้ปกติ
- ✅ ข้อมูลสาธารณะ (guidelines, research, etc.) ยังเข้าถึงได้จาก client-side

## 🔧 API Routes ที่อัปเดตแล้ว

API routes ต่อไปนี้ถูกอัปเดตให้ใช้ `supabaseAdmin` แล้ว:
- ✅ `app/api/admin/login/route.ts`
- ✅ `app/api/admin/init/route.ts`
- ✅ `app/api/doctor/login/route.ts`
- ✅ `app/api/patient/login/route.ts`
- ✅ `app/api/patient/set-password/route.ts`
- ✅ `app/api/patient/reset-password/route.ts`

## ⚠️ Client-Side Code ที่ต้องอัปเดต

**หมายเหตุ:** หลังจากรัน migration แล้ว client-side code ต่อไปนี้จะไม่สามารถเข้าถึงข้อมูลได้โดยตรง:

### 1. Admin Pages
- `app/[locale]/admin/alerts/page.tsx` - ต้องสร้าง API route สำหรับ alerts
- `app/[locale]/admin/monitoring/page.tsx` - ต้องสร้าง API route สำหรับ test_results
- `components/admin/PatientDetailModal.tsx` - ต้องสร้าง API route สำหรับ patient details

### 2. Doctor Pages
- `app/[locale]/doctor/dashboard/page.tsx` - ต้องสร้าง API route สำหรับ dashboard stats
- `app/[locale]/doctor/patients/page.tsx` - ต้องสร้าง API route สำหรับ patients
- `app/[locale]/doctor/alerts/page.tsx` - ต้องสร้าง API route สำหรับ alerts

### 3. Patient Portal
- `app/[locale]/patient/[patientId]/page.tsx` - ต้องสร้าง API route สำหรับ patient data

## 🚀 ขั้นตอนต่อไป (Optional)

หากต้องการให้ระบบทำงานได้เต็มที่ ควรสร้าง API routes สำหรับ:

1. **Patients API** (`/api/patients`)
   - GET: ดึงรายชื่อ patients
   - GET /:id: ดึงข้อมูล patient เฉพาะ
   - POST: สร้าง patient ใหม่
   - PUT /:id: อัปเดต patient
   - DELETE /:id: ลบ patient

2. **Test Results API** (`/api/test-results`)
   - GET: ดึง test results (พร้อม filters)
   - POST: สร้าง test result ใหม่
   - PUT /:id: อัปเดต test result

3. **Alerts API** (`/api/alerts`)
   - GET: ดึง alerts (พร้อม filters)
   - POST: สร้าง alert ใหม่
   - PUT /:id: อัปเดต alert (เช่น resolved)

4. **Dashboard API** (`/api/dashboard`)
   - GET /stats: ดึงสถิติสำหรับ dashboard

## 📝 ตัวอย่างการสร้าง API Route

```typescript
// app/api/patients/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    // ตรวจสอบ authentication (เพิ่ม logic ตามต้องการ)
    // const session = await getSession(request);
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const { data, error } = await supabaseAdmin
      .from('patients')
      .select('*')
      .order('patient_id', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

## ✅ Checklist

- [ ] เพิ่ม `SUPABASE_SERVICE_ROLE_KEY` ใน `.env.local`
- [ ] เพิ่ม `SUPABASE_SERVICE_ROLE_KEY` ใน Vercel Environment Variables
- [ ] รัน migration `010_secure_rls_policies.sql` ใน Supabase
- [ ] ทดสอบ API routes ที่อัปเดตแล้ว
- [ ] สร้าง API routes สำหรับ client-side code ที่ยังใช้ direct queries (optional)
- [ ] อัปเดต client-side code ให้ใช้ API routes แทน direct queries (optional)

## 🔍 วิธีทดสอบ

### ทดสอบว่า RLS ทำงาน:

1. **ทดสอบ Client-Side Query (ควรล้มเหลว):**
```typescript
// ใน browser console หรือ client component
const { data, error } = await supabase
  .from('patients')
  .select('*');
// ควรได้ error: "new row violates row-level security policy"
```

2. **ทดสอบ API Route (ควรสำเร็จ):**
```bash
# ทดสอบ login API
curl -X POST http://localhost:3001/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

## 🆘 Troubleshooting

### ปัญหา: "new row violates row-level security policy"

**สาเหตุ:** Client-side code พยายามเข้าถึงข้อมูลที่ถูกบล็อกโดย RLS

**วิธีแก้:**
1. ตรวจสอบว่า API route ใช้ `supabaseAdmin` แทน `supabase`
2. สร้าง API route สำหรับข้อมูลนั้น
3. อัปเดต client-side code ให้เรียก API route แทน direct query

### ปัญหา: API routes ไม่ทำงาน

**สาเหตุ:** `SUPABASE_SERVICE_ROLE_KEY` ไม่ถูกตั้งค่าหรือผิด

**วิธีแก้:**
1. ตรวจสอบว่า environment variable ถูกตั้งค่าแล้ว
2. ตรวจสอบว่า key ถูกต้อง (ต้องเป็น service_role key ไม่ใช่ anon key)
3. รีสตาร์ท development server

## 📚 เอกสารเพิ่มเติม

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Service Role Key](https://supabase.com/docs/guides/api/api-keys)

