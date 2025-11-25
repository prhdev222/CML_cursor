'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import Link from 'next/link';
import { BookOpen, FileText, Globe, Award } from 'lucide-react';
import { motion } from 'framer-motion';

export default function GuidelinesPage() {
  const t = useTranslations();

  const guidelines = [
    {
      id: 'nccn',
      title: t('guidelines.nccn'),
      description: 'NCCN Clinical Practice Guidelines in Oncology - Chronic Myeloid Leukemia',
      url: 'https://jnccn.org/abstract/journals/jnccn/22/1/article-p43.xml',
      icon: BookOpen,
      gradient: 'from-blue-500 to-cyan-500',
      organization: 'NCCN',
    },
    {
      id: 'eln',
      title: t('guidelines.eln'),
      description: 'European LeukemiaNet 2020 recommendations for treating chronic myeloid leukemia',
      url: 'https://pubmed.ncbi.nlm.nih.gov/32127639/',
      icon: FileText,
      gradient: 'from-purple-500 to-pink-500',
      organization: 'ELN',
    },
    {
      id: 'tsh',
      title: t('guidelines.tsh'),
      description: 'แนวทางสมาคมโลหิตวิทยาประเทศไทย สำหรับการจัดการโรคมะเร็งเม็ดเลือดขาวชนิดเรื้อรังแบบมัยอีลอยด์',
      descriptionEn: 'Thai Society of Hematology Guidelines for Chronic Myeloid Leukemia Management',
      url: 'https://www.thaiclinicalguidelines.org/', // Placeholder - update with actual TSH CML guideline URL
      icon: Award,
      gradient: 'from-emerald-500 to-teal-500',
      organization: 'TSH',
      isThai: true,
    },
  ];

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
      },
    }),
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-3">
          {t('guidelines.title')}
        </h1>
        <p className="text-xl text-gray-600">
          {t('guidelines.description')}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {guidelines.map((guideline, index) => {
          const Icon = guideline.icon;
          return (
            <motion.div
              key={guideline.id}
              custom={index}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
            >
              <Card hover className="h-full group">
                <CardHeader>
                  <div className="flex items-start justify-between mb-4">
                    <motion.div
                      className={`p-4 rounded-2xl bg-gradient-to-br ${guideline.gradient} shadow-lg group-hover:shadow-xl transition-all duration-300`}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      <Icon className="w-7 h-7 text-white" />
                    </motion.div>
                    {guideline.isThai && (
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">
                        🇹🇭 TH
                      </span>
                    )}
                  </div>
                  <CardTitle className="text-xl group-hover:text-blue-600 transition-colors">
                    {guideline.title}
                  </CardTitle>
                  <CardDescription className="text-sm mt-2">
                    {guideline.isThai ? guideline.description : guideline.descriptionEn || guideline.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link
                    href={guideline.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold group/link"
                  >
                    <span>{t('guidelines.viewGuideline')}</span>
                    <motion.svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </motion.svg>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Enhanced Summary Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        <Card className="mt-8 border-2 border-blue-100">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle>Key Recommendations Summary</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                  ELN 2020 Milestones:
                </h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-gray-700 ml-4">
                  <li><strong>3 months:</strong> BCR-ABL1 IS ≤ 10%</li>
                  <li><strong>6 months:</strong> BCR-ABL1 IS ≤ 1% (CCyR)</li>
                  <li><strong>12 months:</strong> BCR-ABL1 IS ≤ 0.1% (MMR)</li>
                  <li><strong>After 12 months:</strong> Maintain BCR-ABL1 IS ≤ 0.1%</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
                  Monitoring Frequency:
                </h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-gray-700 ml-4">
                  <li><strong>Year 1:</strong> RQ-PCR every 3 months</li>
                  <li><strong>Year 2:</strong> RQ-PCR every 3 months (after CCyR)</li>
                  <li><strong>After 2 years:</strong> RQ-PCR every 3-6 months</li>
                  <li><strong>CBC:</strong> Every 15 days until CHR, then every 3 months</li>
                </ul>
              </div>
            </div>
            
            {/* Thai Guidelines Note */}
            <div className="mt-6 p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-r-lg">
              <div className="flex items-start gap-3">
                <Award className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-emerald-900 mb-1">
                    แนวทางสมาคมโลหิตวิทยาประเทศไทย
                  </h4>
                  <p className="text-sm text-emerald-800">
                    แนวทางสมาคมโลหิตวิทยาประเทศไทยสำหรับการจัดการ CML ได้รับการปรับปรุงให้สอดคล้องกับแนวทางสากล 
                    โดยคำนึงถึงบริบทและข้อจำกัดทางการแพทย์ในประเทศไทย รวมถึงการเข้าถึงยาและการเบิกจ่าย
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
