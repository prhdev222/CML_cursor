'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations();

  const switchLocale = (newLocale: string) => {
    const newPathname = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPathname);
  };

  return (
    <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
      <Globe className="w-4 h-4 text-gray-600 ml-2" />
      <button
        onClick={() => switchLocale('en')}
        className={`relative px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
          locale === 'en'
            ? 'bg-white text-blue-600 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        {t('common.english')}
        {locale === 'en' && (
          <motion.div
            layoutId="activeLang"
            className="absolute inset-0 bg-white rounded-md shadow-sm"
            initial={false}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        )}
        <span className="relative z-10">{t('common.english')}</span>
      </button>
      <button
        onClick={() => switchLocale('th')}
        className={`relative px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
          locale === 'th'
            ? 'bg-white text-blue-600 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        {locale === 'th' && (
          <motion.div
            layoutId="activeLang"
            className="absolute inset-0 bg-white rounded-md shadow-sm"
            initial={false}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        )}
        <span className="relative z-10">{t('common.thai')}</span>
      </button>
    </div>
  );
}
