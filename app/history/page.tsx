'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabaseClient';
import { useRouter } from 'next/navigation';

type Summary = {
  id: string;
  original_text: string;
  summary: string;
  created_at: string;
};

export default function HistoryPage() {
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchSummaries = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error('Error getting user:', userError.message);
        setLoading(false);
        return;
      }

      if (!user) {
        console.warn('No user found. Are you logged in?');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('summaries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching summaries:', error);
        alert('Failed to fetch summaries. Please try again later.');
      } else {
        const filteredData = (data || []).filter(
          (item) => item.summary && item.summary.trim() !== ''
        );
        setSummaries(filteredData);
      }

      setLoading(false);
    };

    fetchSummaries();
  }, []);

  return (
    <div className="min-h-screen bg-[#fff0f5] p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-[#ff69b4]">📝 ประวัติการสรุปข้อความ</h1>
        <button
          onClick={() => router.push('/')}
          className="
            inline-block
            px-6 py-2.5
            bg-[#ff69b4] hover:bg-[#ff4da6]
            text-white
            rounded-full
            text-base
            font-medium
            cursor-pointer
            transition-colors duration-200
          "
        >
          ⬅ Go Back
        </button>
      </div>

      {loading ? (
        <p className="text-[#ff69b4]">Loading...</p>
      ) : summaries.length === 0 ? (
        <p className="text-gray-600">ยังไม่มีประวัติการสรุปข้อความ</p>
      ) : (
        <div className="grid gap-4">
          {summaries.map((summary) => (
            <div
              key={summary.id}
              className="bg-white rounded-2xl shadow-md p-5 border-l-4 border-[#ff69b4]"
            >
              <p className="mb-2 text-gray-800">
                <span className="font-semibold text-[#ff69b4]">Original:</span>{' '}
                {summary.original_text}
              </p>
              <p className="mb-2 text-gray-800">
                <span className="font-semibold text-[#ff69b4]">Summary:</span>{' '}
                {summary.summary}
              </p>
              <p className="text-sm text-gray-400">
                📅 {new Date(summary.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
