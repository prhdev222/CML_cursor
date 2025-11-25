import createMiddleware from 'next-intl/middleware';
import { locales } from './i18n/request';
import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale: 'th',
  localePrefix: 'as-needed' // Only show locale prefix for non-default locale
});

export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Redirect /en/* to root (without locale, since 'th' is default)
  if (pathname.startsWith('/en')) {
    const newUrl = pathname.replace('/en', '') || '/';
    const url = new URL(newUrl, request.url);
    url.search = request.nextUrl.search; // Preserve query params
    return NextResponse.redirect(url);
  }
  
  // Redirect /th/* to root (without locale prefix)
  if (pathname.startsWith('/th')) {
    const newUrl = pathname.replace('/th', '') || '/';
    const url = new URL(newUrl, request.url);
    url.search = request.nextUrl.search; // Preserve query params
    return NextResponse.redirect(url);
  }
  
  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};

