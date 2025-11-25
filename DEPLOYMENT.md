# Deployment Guide

คู่มือการ deploy ระบบ CML Management System ไปยัง Coolify (Self-hosted) และ Vercel

## Prerequisites

- GitHub account
- Supabase account (self-hosted หรือ cloud)
- Coolify instance บน Hostinger VPS (สำหรับ self-hosted)
- หรือ Vercel account (สำหรับ free tier)

## 1. Setup Supabase Database

### Self-hosted Supabase on Coolify

1. ติดตั้ง Supabase บน Coolify
2. สร้างโปรเจกต์ใหม่
3. ไปที่ SQL Editor
4. รัน SQL script จาก `supabase/schema.sql`

### Cloud Supabase

1. สร้างโปรเจกต์ใหม่ที่ [supabase.com](https://supabase.com)
2. ไปที่ SQL Editor
3. รัน SQL script จาก `supabase/schema.sql`
4. เก็บ URL และ Anon Key ไว้สำหรับใช้ใน environment variables

## 2. Deploy to Coolify (Self-hosted on Hostinger VPS)

### Step 1: Push to GitHub

```bash
cd cml-management-system
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git push -u origin main
```

### Step 2: Setup Coolify

1. เข้าสู่ระบบ Coolify บน VPS ของคุณ
2. สร้าง Application ใหม่
3. เลือก "GitHub" เป็น source
4. เชื่อมต่อ GitHub repository ของคุณ
5. เลือก branch `main`

### Step 3: Configure Environment Variables

ใน Coolify, เพิ่ม environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NODE_ENV=production
```

### Step 4: Configure Build Settings

- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Port**: `3000`

### Step 5: Deploy

คลิก "Deploy" และรอให้ build เสร็จ

## 3. Deploy to Vercel (Free Tier)

### Step 1: Push to GitHub

```bash
cd cml-management-system
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git push -u origin main
```

### Step 2: Import to Vercel

1. ไปที่ [vercel.com](https://vercel.com)
2. คลิก "Add New Project"
3. เลือก GitHub repository ของคุณ
4. Vercel จะ detect Next.js อัตโนมัติ

### Step 3: Configure Environment Variables

ใน Vercel dashboard:

1. ไปที่ Settings > Environment Variables
2. เพิ่ม:
   - `NEXT_PUBLIC_SUPABASE_URL` = your_supabase_url
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your_supabase_anon_key

### Step 4: Deploy

คลิก "Deploy" และรอให้ build เสร็จ

## 4. Deploy using Docker

### Build Docker Image

```bash
cd cml-management-system
docker build -t cml-management-system .
```

### Run Container

```bash
docker run -d \
  -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=your_supabase_url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key \
  -e NODE_ENV=production \
  --name cml-management-system \
  cml-management-system
```

## 5. GitHub Actions (Optional)

ไฟล์ `.github/workflows/deploy.yml` พร้อมใช้งานแล้วสำหรับ automated deployment

### Setup Secrets

ใน GitHub repository:
1. ไปที่ Settings > Secrets and variables > Actions
2. เพิ่ม secrets:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `COOLIFY_HOST` (สำหรับ Coolify deployment)
   - `COOLIFY_USER` (สำหรับ Coolify deployment)
   - `COOLIFY_SSH_KEY` (สำหรับ Coolify deployment)

## Troubleshooting

### Build Errors

- ตรวจสอบว่า environment variables ถูกตั้งค่าถูกต้อง
- ตรวจสอบว่า Supabase database schema ถูกสร้างแล้ว
- ตรวจสอบ logs ใน Coolify/Vercel dashboard

### Runtime Errors

- ตรวจสอบว่า Supabase URL และ Key ถูกต้อง
- ตรวจสอบว่า Row Level Security (RLS) policies ถูกตั้งค่าถูกต้อง
- ตรวจสอบ network connectivity ระหว่าง application และ Supabase

### Database Connection Issues

- ตรวจสอบว่า Supabase instance ทำงานอยู่
- ตรวจสอบ firewall rules
- ตรวจสอบ connection string

## Post-Deployment Checklist

- [ ] ตรวจสอบว่า application ทำงานได้ปกติ
- [ ] ทดสอบการเพิ่มผู้ป่วย
- [ ] ทดสอบการบันทึกผลการตรวจ
- [ ] ทดสอบการเปลี่ยนภาษา (EN/TH)
- [ ] ทดสอบ responsive design บน mobile
- [ ] ตั้งค่า custom domain (ถ้าต้องการ)
- [ ] ตั้งค่า SSL certificate (Coolify/Vercel ทำอัตโนมัติ)

## Maintenance

### Update Application

```bash
git pull origin main
# ใน Coolify: คลิก Redeploy
# ใน Vercel: จะ auto-deploy เมื่อ push ไปที่ main branch
```

### Database Backup

ทำการ backup Supabase database เป็นประจำ:
- Supabase Dashboard > Settings > Database > Backups

### Monitoring

- ใช้ Vercel Analytics (ถ้า deploy บน Vercel)
- ใช้ Coolify logs (ถ้า deploy บน Coolify)
- ตั้งค่า error tracking (Sentry, etc.)



