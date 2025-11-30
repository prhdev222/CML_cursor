# คำแนะนำการ Deploy ไปยัง Vercel

## ขั้นตอนการ Deploy

### 1. เตรียม GitHub Repository
✅ โค้ดของคุณถูก push ไปยัง GitHub แล้ว: `https://github.com/prhdev222/CML_cursor.git`

### 2. สร้าง Vercel Account และ Import Project

1. ไปที่ [Vercel](https://vercel.com) และ Sign up/Login
2. คลิก **"Add New..."** → **"Project"**
3. เลือก **"Import Git Repository"**
4. เลือก repository: `prhdev222/CML_cursor`
5. คลิก **"Import"**

### 3. ตั้งค่า Environment Variables

**สำคัญมาก!** ต้องตั้งค่า Environment Variables ใน Vercel Dashboard:

1. ในหน้า **"Configure Project"** ให้เลื่อนลงไปที่ส่วน **"Environment Variables"**
2. เพิ่ม Environment Variables ต่อไปนี้:

   ```
   NEXT_PUBLIC_SUPABASE_URL = [ใส่ Supabase URL ของคุณ]
   NEXT_PUBLIC_SUPABASE_ANON_KEY = [ใส่ Supabase Anon Key ของคุณ]
   ```

3. เลือก **"Production"**, **"Preview"**, และ **"Development"** สำหรับทั้งสองตัวแปร
4. คลิก **"Save"**

### 4. ตั้งค่า Build Settings

Vercel จะตรวจจับ Next.js อัตโนมัติ แต่ตรวจสอบให้แน่ใจว่า:

- **Framework Preset**: Next.js
- **Build Command**: `npm run build` (default)
- **Output Directory**: `.next` (default)
- **Install Command**: `npm install` (default)
- **Root Directory**: `.` (default)

### 5. Deploy!

1. คลิก **"Deploy"**
2. รอให้ build เสร็จ (ประมาณ 2-5 นาที)
3. เมื่อเสร็จแล้ว Vercel จะให้ URL เช่น `https://cml-cursor.vercel.app`

### 6. ตรวจสอบการ Deploy

1. เปิด URL ที่ Vercel ให้
2. ตรวจสอบว่าเว็บไซต์ทำงานได้ปกติ
3. ตรวจสอบ Console ใน Browser ว่ามี error หรือไม่

## การอัปเดตโค้ด

เมื่อคุณ push โค้ดใหม่ไปยัง GitHub:

1. Vercel จะตรวจจับการเปลี่ยนแปลงอัตโนมัติ
2. จะสร้าง **Preview Deployment** สำหรับทุก Pull Request
3. จะ **Production Deployment** อัตโนมัติเมื่อ push ไปยัง `main` branch

## Troubleshooting

### Build Error: Environment Variables Missing
- ตรวจสอบว่าได้ตั้งค่า `NEXT_PUBLIC_SUPABASE_URL` และ `NEXT_PUBLIC_SUPABASE_ANON_KEY` ใน Vercel Dashboard แล้ว
- ตรวจสอบว่าเลือก **Production**, **Preview**, และ **Development** สำหรับทุกตัวแปร

### Build Error: Module Not Found
- ตรวจสอบว่า `package.json` มี dependencies ครบถ้วน
- ลองรัน `npm install` และ `npm run build` ในเครื่องก่อน

### Runtime Error: Supabase Connection Failed
- ตรวจสอบว่า Supabase URL และ Key ถูกต้อง
- ตรวจสอบว่า Supabase Project ของคุณยังใช้งานได้อยู่
- ตรวจสอบ Network tab ใน Browser Console

### Region Settings
- โปรเจกต์นี้ตั้งค่าให้ใช้ region `bkk1` (Bangkok) ใน `vercel.json`
- หากต้องการเปลี่ยน region สามารถแก้ไขใน `vercel.json` หรือใน Vercel Dashboard

## ข้อมูลเพิ่มเติม

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Environment Variables in Vercel](https://vercel.com/docs/concepts/projects/environment-variables)

