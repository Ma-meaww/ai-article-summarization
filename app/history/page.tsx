'use client'

import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  Check,
  Clipboard,
  Clock3,
  FileText,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

import { supabase } from '@/utils/supabaseClient'
import '../styles/styles.css'

type Summary = {
  id: string
  original_text: string
  summary: string
  created_at: string
}

export default function HistoryPage() {
  const [summaries, setSummaries] = useState<Summary[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const router = useRouter()

  useEffect(() => {
    const fetchSummaries = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.replace('/')
        return
      }

      const { data, error } = await supabase
        .from('summaries')
        .select('id, original_text, summary, created_at')
        .order('created_at', { ascending: false })

      if (error) {
        setErrorMessage('ไม่สามารถโหลดประวัติได้')
      } else {
        setSummaries(data ?? [])
      }

      setLoading(false)
    }

    fetchSummaries()
  }, [router])

  const copySummary = async (item: Summary) => {
    await navigator.clipboard.writeText(item.summary)
    setCopiedId(item.id)
    window.setTimeout(() => setCopiedId(null), 1500)
  }

  const deleteSummary = async (id: string) => {
    const confirmed = window.confirm('ต้องการลบประวัติรายการนี้หรือไม่?')
    if (!confirmed) return

    const { error } = await supabase.from('summaries').delete().eq('id', id)

    if (error) {
      setErrorMessage('ไม่สามารถลบรายการได้')
      return
    }

    setSummaries((current) => current.filter((item) => item.id !== id))
  }

  return (
    <div className="history-shell">
      <header className="history-topbar">
        <button
          className="brand"
          type="button"
          onClick={() => router.push('/')}
        >
          <span className="brand-icon">
            <Sparkles size={19} />
          </span>
          <span>InShort</span>
        </button>

        <button
          className="nav-button"
          type="button"
          onClick={() => router.push('/')}
        >
          <ArrowLeft size={17} />
          กลับหน้าหลัก
        </button>
      </header>

      <main className="history-main">
        <section className="history-heading">
          <span className="history-heading-icon">
            <Clock3 size={22} />
          </span>
          <div>
            <span className="card-kicker">Your summaries</span>
            <h1>ประวัติการสรุปข้อความ</h1>
            <p>รายการที่สรุปขณะเข้าสู่ระบบจะถูกบันทึกไว้ที่นี่</p>
          </div>
        </section>

        {errorMessage && (
          <p className="error-message" role="alert">
            {errorMessage}
          </p>
        )}

        {loading ? (
          <div className="history-empty">
            <span className="spinner spinner-purple" />
            <p>กำลังโหลดประวัติ...</p>
          </div>
        ) : summaries.length === 0 ? (
          <div className="history-empty">
            <span className="result-placeholder">
              <FileText size={28} />
            </span>
            <h2>ยังไม่มีประวัติ</h2>
            <p>กลับไปสรุปข้อความรายการแรกของคุณได้เลย</p>
          </div>
        ) : (
          <div className="history-list">
            {summaries.map((item) => (
              <article className="history-card" key={item.id}>
                <div className="history-card-top">
                  <time>
                    {new Date(item.created_at).toLocaleString('th-TH')}
                  </time>

                  <div className="history-card-actions">
                    <button
                      className="icon-button"
                      type="button"
                      onClick={() => copySummary(item)}
                      title="คัดลอกผลสรุป"
                    >
                      {copiedId === item.id ? (
                        <Check size={18} />
                      ) : (
                        <Clipboard size={18} />
                      )}
                    </button>

                    <button
                      className="icon-button icon-button-danger"
                      type="button"
                      onClick={() => deleteSummary(item.id)}
                      title="ลบรายการ"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="history-columns">
                  <section>
                    <span className="history-label">ข้อความต้นฉบับ</span>
                    <p>{item.original_text}</p>
                  </section>

                  <section className="history-summary">
                    <span className="history-label">ผลสรุป</span>
                    <p>{item.summary}</p>
                  </section>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
