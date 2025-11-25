# CML Management System

ระบบสนับสนุนการตัดสินใจทางคลินิก (CDSS) สำหรับการจัดการผู้ป่วยโรคมะเร็งเม็ดเลือดขาวชนิดเรื้อรังแบบมัยอีลอยด์ (Chronic Myeloid Leukemia - CML)

## Features

- 📋 **Patient Management**: จัดการข้อมูลผู้ป่วย CML
- 📊 **Monitoring & Alerts**: ติดตามผลการตรวจ BCR-ABL1, CBC, และ Cytogenetic
- 💊 **TKI Management**: จัดการการเปลี่ยนยา TKI ตามเกณฑ์ ELN 2020
- 📖 **Clinical Guidelines**: ลิงก์ไปยังแนวทาง NCCN และ ELN 2020
- 📚 **Research Papers**: งานวิจัยล่าสุดเกี่ยวกับ CML
- 🌐 **Multi-language**: รองรับทั้งภาษาไทยและอังกฤษ
- 📱 **Responsive Design**: รองรับทั้ง Desktop และ Mobile

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Internationalization**: next-intl
- **State Management**: Zustand
- **Date Handling**: date-fns

## Getting Started

### Prerequisites

- Node.js 20 or higher
- npm or yarn
- Supabase account (self-hosted or cloud)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd cml-management-system
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Set up Supabase database:
   - Go to your Supabase SQL Editor
   - Run the SQL script from `supabase/schema.sql`

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

### Deploy to Coolify (Self-hosted on Hostinger VPS)

1. Push your code to GitHub
2. In Coolify, create a new application
3. Connect your GitHub repository
4. Set environment variables in Coolify:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Deploy!

### Deploy to Vercel (Free Tier)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!

### Deploy using Docker

1. Build the Docker image:
```bash
docker build -t cml-management-system .
```

2. Run the container:
```bash
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=your_url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key \
  cml-management-system
```

## Project Structure

```
cml-management-system/
├── app/
│   └── [locale]/          # Internationalized routes
│       ├── layout.tsx
│       ├── page.tsx
│       ├── patients/
│       ├── monitoring/
│       ├── tki/
│       ├── guidelines/
│       └── research/
├── components/
│   ├── patients/          # Patient management components
│   ├── monitoring/        # Monitoring components
│   ├── tki/               # TKI management components
│   └── ui/                # Reusable UI components
├── lib/
│   └── supabase.ts        # Supabase client
├── messages/              # Translation files
│   ├── en.json
│   └── th.json
├── supabase/
│   └── schema.sql         # Database schema
└── public/                # Static assets
```

## Key Features Implementation

### ELN 2020 Milestones
- 3 months: BCR-ABL1 IS ≤ 10%
- 6 months: BCR-ABL1 IS ≤ 1% (CCyR)
- 12 months: BCR-ABL1 IS ≤ 0.1% (MMR)
- After 12 months: Maintain BCR-ABL1 IS ≤ 0.1%

### Monitoring Frequency
- Year 1: RQ-PCR every 3 months
- Year 2: RQ-PCR every 3 months (after CCyR)
- After 2 years: RQ-PCR every 3-6 months
- CBC: Every 15 days until CHR, then every 3 months

### TKI Management
- Track TKI switches based on molecular failure or intolerance
- Alert system for TKI switch requirements
- Side effect monitoring

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, please open an issue in the GitHub repository.

## Acknowledgments

- European LeukemiaNet (ELN) 2020 Recommendations
- NCCN Clinical Practice Guidelines
- All researchers and clinicians working on CML treatment
