# Prisma Guide สำหรับ CML Management System

## 🤔 Prisma คืออะไร?

**Prisma** เป็น ORM (Object-Relational Mapping) ที่ช่วย:
- จัดการ database schema ด้วย code
- สร้าง migrations อัตโนมัติ
- Type-safe database queries
- Auto-generate TypeScript types

## ✅ ข้อดีของ Prisma

1. **Type Safety**: TypeScript types อัตโนมัติ
2. **Migration Management**: จัดการ migrations ง่าย
3. **Developer Experience**: เขียน code ง่ายขึ้น
4. **Auto-completion**: IDE support ดี
5. **Database Agnostic**: เปลี่ยน database ได้ง่าย

## ❌ ข้อเสียของ Prisma

1. **Learning Curve**: ต้องเรียนรู้ syntax ใหม่
2. **Setup Time**: ต้อง setup เพิ่มเติม
3. **File Size**: เพิ่ม bundle size
4. **Supabase**: อาจไม่จำเป็นถ้าใช้ Supabase client โดยตรง

## 🎯 คำแนะนำ

### ใช้ Prisma ถ้า:
- ✅ ต้องการ type safety สูง
- ✅ มี schema ที่ซับซ้อน
- ✅ ต้องการ migration system ที่ดี
- ✅ ทีมใหญ่ ต้องการ consistency

### ไม่ใช้ Prisma ถ้า:
- ❌ ใช้ Supabase client อยู่แล้ว (เหมือนโปรเจกต์นี้)
- ❌ ต้องการความเรียบง่าย
- ❌ Schema ไม่ซับซ้อน
- ❌ ต้องการ control SQL โดยตรง

## 📊 เปรียบเทียบ

| Feature | SQL Scripts | Prisma |
|---------|-------------|--------|
| ง่าย | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Type Safety | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| Migration | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Control | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Setup | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| Supabase | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

## 💡 คำแนะนำสำหรับโปรเจกต์นี้

**แนะนำ: ใช้ SQL Scripts** เพราะ:
1. ใช้ Supabase client อยู่แล้ว
2. Schema ไม่ซับซ้อนมาก
3. ต้องการ control SQL โดยตรง
4. ง่ายกว่า setup

**แต่ถ้าต้องการ Prisma** ก็ทำได้! ดูขั้นตอนด้านล่าง

---

## 🚀 Setup Prisma (ถ้าต้องการ)

### 1. ติดตั้ง Prisma

```bash
npm install prisma @prisma/client
npx prisma init
```

### 2. สร้าง Schema

สร้างไฟล์ `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Hospital {
  id        String   @id @default(uuid())
  name      String   @unique
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  patients  Patient[]

  @@map("hospitals")
}

model Patient {
  id            String      @id @default(uuid())
  patientId     String      @unique @map("patient_id")
  name          String
  age           Int
  gender        String
  diagnosisDate DateTime    @map("diagnosis_date")
  hospitalId    String?     @map("hospital_id")
  hospital      Hospital?   @relation(fields: [hospitalId], references: [id])
  currentTki    String?     @map("current_tki")
  phase         String      @default("chronic")
  createdAt     DateTime    @default(now()) @map("created_at")
  updatedAt     DateTime    @updatedAt @map("updated_at")

  @@map("patients")
}
```

### 3. สร้าง Migration

```bash
npx prisma migrate dev --name init
```

### 4. Generate Client

```bash
npx prisma generate
```

### 5. ใช้ใน Code

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Query
const patients = await prisma.patient.findMany({
  include: { hospital: true }
});
```

---

## 📝 สรุป

**สำหรับโปรเจกต์นี้:**
- ✅ **แนะนำ**: ใช้ SQL Scripts (`schema_production.sql`)
- ✅ **ง่ายกว่า**: Setup น้อยกว่า
- ✅ **เหมาะกับ**: Supabase client ที่ใช้อยู่แล้ว

**ถ้าต้องการ Prisma:**
- ⚠️ **ต้อง setup**: เพิ่มเติม
- ⚠️ **Learning curve**: ต้องเรียนรู้
- ✅ **ได้ประโยชน์**: Type safety และ migration system

**คำแนะนำสุดท้าย**: ใช้ SQL Scripts ไปก่อน ถ้าต้องการ type safety หรือ migration system ที่ดีขึ้น ค่อยพิจารณา Prisma ทีหลัง



