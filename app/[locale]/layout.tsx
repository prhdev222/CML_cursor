import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n/request';
import '../globals.css';
import ConditionalNavigation from '@/components/ConditionalNavigation';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  if (!locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className="antialiased min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
        <NextIntlClientProvider messages={messages}>
          <ConditionalNavigation locale={locale}>
            {children}
          </ConditionalNavigation>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
