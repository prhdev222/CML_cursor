'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Users, Activity, Pill, BookOpen, FileText, Sparkles, Heart, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.1,
      duration: 0.6,
      type: 'spring' as const,
      stiffness: 100,
    },
  }),
} as const;

const iconMap = {
  patients: Users,
  monitoring: Activity,
  tki: Pill,
  guidelines: BookOpen,
  research: FileText,
};

const gradientColors = [
  'from-blue-500 via-cyan-500 to-blue-600',
  'from-purple-500 via-pink-500 to-rose-600',
  'from-emerald-500 via-green-500 to-teal-600',
  'from-orange-500 via-red-500 to-pink-600',
  'from-indigo-500 via-purple-500 to-pink-600',
];

export default function HomePage() {
  const t = useTranslations();
  const locale = useLocale();

  const features = [
    {
      key: 'guidelines',
      title: t('common.guidelines'),
      description: t('guidelines.title'),
      detail: 'Access NCCN and ELN 2020 clinical guidelines',
      href: '/guidelines',
      gradient: gradientColors[0],
      icon: BookOpen,
    },
    {
      key: 'research',
      title: t('common.research'),
      description: t('research.title'),
      detail: 'Latest research papers and publications on CML',
      href: '/research',
      gradient: gradientColors[1],
      icon: FileText,
    },
  ];

  return (
    <div className="space-y-16 animate-fade-in">
      {/* Hero Section with Enhanced Design */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        className="text-center space-y-6 relative"
      >
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"></div>
          <div className="absolute top-0 right-0 w-72 h-72 bg-purple-400/20 rounded-full blur-3xl"></div>
        </div>

        <div className="flex items-center justify-center gap-4 mb-6 flex-wrap">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Sparkles className="w-10 h-10 md:w-12 md:h-12 text-blue-900 drop-shadow-lg flex-shrink-0" />
          </motion.div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black text-gray-950 tracking-tight break-words drop-shadow-lg leading-tight">
            {t('common.appName')}
          </h1>
        </div>
        
        <p className="text-2xl md:text-3xl text-gray-800 max-w-4xl mx-auto font-semibold leading-relaxed">
          {t('common.welcome')}
        </p>
        <p className="text-lg md:text-xl text-gray-700 max-w-2xl mx-auto font-medium">
          Clinical Decision Support System for CML Management
        </p>
        
        {/* Enhanced Decorative Line */}
        <div className="flex items-center justify-center gap-3 mt-8">
          <div className="h-1.5 w-16 bg-gradient-to-r from-transparent via-blue-600 to-purple-600 rounded-full"></div>
          <Heart className="w-5 h-5 text-pink-500 animate-pulse" />
          <div className="h-1.5 w-16 bg-gradient-to-r from-purple-600 via-pink-600 to-transparent rounded-full"></div>
        </div>
      </motion.div>

      {/* Features Grid with Enhanced Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={feature.key}
              custom={index}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              whileHover={{ scale: 1.02 }}
            >
              <Link href={feature.href} className="block h-full">
                <Card hover className="h-full group relative overflow-hidden border-2 border-transparent hover:border-blue-200 transition-all duration-300 flex flex-col">
                  {/* Gradient Background on Hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
                  
                  <CardHeader className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <motion.div
                        className={`p-4 rounded-2xl bg-gradient-to-br ${feature.gradient} shadow-xl group-hover:shadow-2xl transition-all duration-300`}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                      >
                        <Icon className="w-7 h-7 text-white" />
                      </motion.div>
                      <div className="px-3 py-1.5 bg-gray-100 rounded-full text-xs font-bold text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-700 transition-colors">
                        {String(index + 1).padStart(2, '0')}
                      </div>
                    </div>
                    <CardTitle className="text-2xl group-hover:gradient-text transition-all duration-300">
                      {feature.title}
                    </CardTitle>
                    <CardDescription className="text-base mt-2">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="relative z-10 flex-1 flex flex-col">
                    <p className="text-sm text-gray-600 leading-relaxed mb-6 flex-1">
                      {feature.detail}
                    </p>
                    <div className="flex items-center text-blue-600 font-semibold text-sm group-hover:gap-3 transition-all duration-300 mt-auto">
                      <span>Explore Feature</span>
                      <motion.svg
                        className="w-5 h-5 ml-2"
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
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </motion.svg>
                    </div>
                  </CardContent>
                  
                  {/* Shine Effect */}
                  <div className="absolute inset-0 -z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Enhanced Stats Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.8 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <motion.div
          whileHover={{ scale: 1.05, y: -5 }}
          className="bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 rounded-2xl p-8 border-2 border-blue-200 shadow-lg hover:shadow-xl transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">ELN 2020</p>
              <p className="text-sm text-gray-600 font-medium">Compliant</p>
            </div>
            <CheckCircle2 className="w-6 h-6 text-green-500 ml-auto" />
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05, y: -5 }}
          className="bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 rounded-2xl p-8 border-2 border-purple-200 shadow-lg hover:shadow-xl transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl shadow-lg">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">NCCN</p>
              <p className="text-sm text-gray-600 font-medium">Guidelines</p>
            </div>
            <CheckCircle2 className="w-6 h-6 text-green-500 ml-auto" />
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05, y: -5 }}
          className="bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 rounded-2xl p-8 border-2 border-emerald-200 shadow-lg hover:shadow-xl transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-emerald-600 to-green-600 rounded-xl shadow-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">Research</p>
              <p className="text-sm text-gray-600 font-medium">Papers</p>
            </div>
            <CheckCircle2 className="w-6 h-6 text-green-500 ml-auto" />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
