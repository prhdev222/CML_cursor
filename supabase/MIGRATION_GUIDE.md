# Migration Guide - เพิ่ม hospital_id column

## ปัญหา
หากคุณได้รับ error: `column "hospital_id" does not exist` แสดงว่าตาราง `patients` มีอยู่แล้วแต่ยังไม่มี column `hospital_id`

## วิธีแก้ไข

### วิธีที่ 1: ใช้ Migration Script (แนะนำ)

1. เปิด Supabase Dashboard → SQL Editor
2. คัดลอกเนื้อหาทั้งหมดจากไฟล์ `supabase/migration_add_hospital_id.sql`
3. วางใน SQL Editor และคลิก **Run**
4. ตรวจสอบว่า migration สำเร็จ (ควรเห็นข้อความ "Column hospital_id added successfully")

### วิธีที่ 2: เพิ่ม Column แบบ Manual

หากวิธีที่ 1 ไม่ได้ผล ให้รัน SQL นี้:

```sql
-- เพิ่ม hospital_id column
ALTER TABLE patients 
ADD COLUMN hospital_id UUID REFERENCES hospitals(id) ON DELETE SET NULL;

-- สร้าง index
CREATE INDEX IF NOT EXISTS idx_patients_hospital_id ON patients(hospital_id);
```

### วิธีที่ 3: สร้างตารางใหม่ทั้งหมด (ถ้ายังไม่มีข้อมูลสำคัญ)

หากยังไม่มีข้อมูลผู้ป่วยในระบบ สามารถรัน schema.sql ทั้งหมดใหม่ได้:

1. เปิด Supabase Dashboard → SQL Editor
2. คัดลอกเนื้อหาทั้งหมดจากไฟล์ `supabase/schema.sql`
3. วางใน SQL Editor และคลิก **Run**

**คำเตือน:** วิธีนี้จะลบข้อมูลทั้งหมดที่มีอยู่!

## ตรวจสอบผลลัพธ์

หลังจาก migration สำเร็จ ให้ตรวจสอบว่า:

1. Column `hospital_id` มีอยู่ในตาราง `patients`:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'patients' AND column_name = 'hospital_id';
   ```

2. ตาราง `hospitals` มีอยู่:
   ```sql
   SELECT * FROM hospitals;
   ```

3. ตาราง `admins` มีอยู่:
   ```sql
   SELECT * FROM admins;
   ```

## สร้าง Admin User

หลังจาก migration สำเร็จ ให้สร้าง admin user:

### วิธีที่ 1: ใช้ API (แนะนำ)
เปิดเบราว์เซอร์ไปที่: `http://localhost:3001/api/admin/init`

### วิธีที่ 2: ใช้ SQL (ต้อง hash password ก่อน)
```sql
-- ใช้ bcrypt hash สำหรับ password 'admin123'
-- หรือใช้ API endpoint ข้างบนจะสะดวกกว่า
```

## Troubleshooting

### Error: relation "hospitals" does not exist
- รัน migration script อีกครั้ง หรือสร้างตาราง hospitals ก่อน

### Error: duplicate key value violates unique constraint
- แสดงว่ามีข้อมูลอยู่แล้ว ไม่เป็นปัญหา

### Error: column already exists
- แสดงว่า column มีอยู่แล้ว ไม่ต้องทำอะไร



