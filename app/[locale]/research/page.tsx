'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

interface ResearchPaper {
  id: string;
  title_th: string;
  authors_th?: string;
  journal_th?: string;
  year?: number;
  description_th?: string;
  url?: string;
}

export default function ResearchPage() {
  const t = useTranslations();
  const [searchQuery, setSearchQuery] = useState('');
  const [papers, setPapers] = useState<ResearchPaper[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPapers();
  }, []);

  const fetchPapers = async () => {
    try {
      const { data, error } = await supabase
        .from('research_papers')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Supabase error:', error);
        // Check if table doesn't exist
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.warn('Table research_papers does not exist. Please run the migration SQL.');
          setPapers([]);
          return;
        }
        throw error;
      }
      setPapers(data || []);
    } catch (error: any) {
      console.error('Error fetching research papers:', error);
      console.error('Error details:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
      });
      setPapers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredPapers = papers.filter((paper) =>
    paper.title_th.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (paper.authors_th && paper.authors_th.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t('research.title')}
        </h1>
        <p className="text-gray-600">
          {t('research.latestPapers')}
        </p>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder={t('research.searchPapers')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {loading ? (
        <div className="text-center py-12">กำลังโหลด...</div>
      ) : filteredPapers.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-gray-600">ไม่พบผลการค้นหา</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredPapers.map((paper) => (
            <Card key={paper.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{paper.title_th}</CardTitle>
                <CardDescription>
                  {paper.authors_th && `${paper.authors_th} - `}
                  {paper.journal_th && `${paper.journal_th}`}
                  {paper.year && ` (${paper.year})`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {paper.description_th && (
                  <p className="text-sm text-gray-700 mb-4">{paper.description_th}</p>
                )}
                {paper.url && (
                  <Link
                    href={paper.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium text-sm"
                  >
                    อ่านบทความเต็ม
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}



