'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Check,
  Clipboard,
  Clock3,
  FileText,
  LogIn,
  LogOut,
  Sparkles,
  Trash2,
  WandSparkles,
} from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

import { supabase } from '@/utils/supabaseClient'
import './styles/styles.css'

const GUEST_CHAR_LIMIT = 1000
const MEMBER_CHAR_LIMIT = 12000

type Profile = {
  full_name: string | null
}

export default function HomePage() {
  const [inputText, setInputText] = useState('')
  const [summary, setSummary] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  const router = useRouter()

  const charLimit = user ? MEMBER_CHAR_LIMIT : GUEST_CHAR_LIMIT

  const displayName = useMemo(() => {
    return (
      profile?.full_name ||
      user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      user?.email?.split('@')[0] ||
      'ผู้ใช้'
    )
  }, [profile, user])

  useEffect(() => {
    const loadProfile = async (sessionUser: User | null) => {
      setUser(sessionUser)

      if (!sessionUser) {
        setProfile(null)
        setAuthLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', sessionUser.id)
        .maybeSingle()

      if (!error) {
        setProfile(data)
      }

      setAuthLoading(false)
    }

    const getSession = async () => {
      const { data } = await supabase.auth.getSession()
      await loadProfile(data.session?.user ?? null)
    }

    getSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      loadProfile(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogin = async () => {
    setErrorMessage('')

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setErrorMessage('ไม่สามารถเข้าสู่ระบบด้วย Google ได้')
    }
  }

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()

    if (error) {
      setErrorMessage('ไม่สามารถออกจากระบบได้')
      return
    }

    setUser(null)
    setProfile(null)
    setInputText('')
    setSummary('')
    router.refresh()
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedText = inputText.trim()

    if (!trimmedText) {
      setErrorMessage('กรุณาใส่ข้อความที่ต้องการสรุปก่อน')
      return
    }

    if (trimmedText.length > charLimit) {
      setErrorMessage(
        user
          ? `ข้อความยาวเกิน ${MEMBER_CHAR_LIMIT.toLocaleString()} ตัวอักษร`
          : `ผู้ใช้ทั่วไปใส่ข้อความได้ไม่เกิน ${GUEST_CHAR_LIMIT.toLocaleString()} ตัวอักษร กรุณาเข้าสู่ระบบเพื่อเพิ่มขีดจำกัด`,
      )
      return
    }

    setErrorMessage('')
    setSummary('')
    setCopied(false)
    setIsLoading(true)

    try {
      const response = await fetch('/api/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputText: trimmedText }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'ไม่สามารถสรุปข้อความได้')
      }

      if (!data.summary) {
        throw new Error('ไม่พบผลสรุป กรุณาลองใหม่อีกครั้ง')
      }

      setSummary(data.summary)
    } catch (error) {
      console.error('Summarization failed:', error)
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง',
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleClear = () => {
    setInputText('')
    setSummary('')
    setCopied(false)
    setErrorMessage('')
  }

  const handleCopy = async () => {
    if (!summary) return

    try {
      await navigator.clipboard.writeText(summary)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setErrorMessage('ไม่สามารถคัดลอกข้อความได้')
    }
  }

  return (
    <div className="site-shell">
      <div className="background-orb background-orb-one" />
      <div className="background-orb background-orb-two" />

      <header className="topbar">
        <button
          className="brand"
          type="button"
          onClick={() => router.push('/')}
          aria-label="กลับไปหน้าหลัก"
        >
          <span className="brand-icon">
            <Sparkles size={19} strokeWidth={2.2} />
          </span>
          <span>InShort</span>
        </button>

        <nav className="topbar-actions" aria-label="เมนูหลัก">
          {user && (
            <button
              className="nav-button"
              type="button"
              onClick={() => router.push('/history')}
            >
              <Clock3 size={17} />
              <span>ประวัติ</span>
            </button>
          )}

          {!authLoading &&
            (user ? (
              <>
                <div className="user-chip" title={user.email ?? displayName}>
                  <span className="user-avatar">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                  <span className="user-name">{displayName}</span>
                </div>

                <button
                  className="nav-button nav-button-strong"
                  type="button"
                  onClick={handleLogout}
                >
                  <LogOut size={17} />
                  <span>ออกจากระบบ</span>
                </button>
              </>
            ) : (
              <button
                className="nav-button nav-button-strong"
                type="button"
                onClick={handleLogin}
              >
                <LogIn size={17} />
                <span>เข้าสู่ระบบด้วย Google</span>
              </button>
            ))}
        </nav>
      </header>

      <main className="home-main">
        <section className="hero">
          <div className="eyebrow">
            <WandSparkles size={16} />
            <span>AI Article Summarizer</span>
          </div>

          <h1>
            เปลี่ยนบทความยาว
            <span> ให้เข้าใจได้ในไม่กี่วินาที</span>
          </h1>

          <p>
            วางข้อความของคุณ แล้วให้ AI ช่วยดึงประเด็นสำคัญออกมา
            เพื่อให้อ่านง่าย กระชับ และประหยัดเวลา
          </p>

          <div className="guest-note">
            {user
              ? `เข้าสู่ระบบแล้ว ใช้งานได้สูงสุด ${MEMBER_CHAR_LIMIT.toLocaleString()} ตัวอักษร และบันทึกประวัติอัตโนมัติ`
              : `ใช้งานได้สูงสุด ${GUEST_CHAR_LIMIT.toLocaleString()} ตัวอักษร หรือเข้าสู่ระบบเพื่อเพิ่มขีดจำกัดและบันทึกประวัติ`}
          </div>
        </section>

        <section className="workspace">
          <form className="workspace-card input-card" onSubmit={handleSubmit}>
            <div className="card-heading">
              <div>
                <span className="card-kicker">ข้อความต้นฉบับ</span>
                <h2>วางบทความที่ต้องการสรุป</h2>
              </div>

              <span className="card-icon">
                <FileText size={20} />
              </span>
            </div>

            <div className="textarea-wrapper">
              <textarea
                className="textarea"
                value={inputText}
                onChange={(event) => {
                  setInputText(event.target.value)
                  if (errorMessage) setErrorMessage('')
                }}
                maxLength={charLimit}
                placeholder="วางบทความ ข่าว โน้ตการเรียน หรือข้อความที่ต้องการสรุปที่นี่..."
                aria-label="ข้อความที่ต้องการสรุป"
              />

              <div className="textarea-meta">
                <span>
                  {inputText.trim()
                    ? `${inputText.trim().split(/\s+/).length.toLocaleString()} คำ`
                    : 'เริ่มพิมพ์หรือวางข้อความ'}
                </span>

                <span>
                  {inputText.length.toLocaleString()} /{' '}
                  {charLimit.toLocaleString()} ตัวอักษร
                </span>
              </div>
            </div>

            {errorMessage && (
              <p className="error-message" role="alert">
                {errorMessage}
              </p>
            )}

            <div className="form-actions">
              <button
                className="secondary-button"
                type="button"
                onClick={handleClear}
                disabled={!inputText && !summary}
              >
                <Trash2 size={17} />
                ล้างข้อความ
              </button>

              <button
                className="primary-button"
                type="submit"
                disabled={isLoading || !inputText.trim()}
              >
                {isLoading ? (
                  <>
                    <span className="spinner" aria-hidden="true" />
                    กำลังสรุป...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    สรุปข้อความ
                  </>
                )}
              </button>
            </div>
          </form>

          <section className="workspace-card output-card" aria-live="polite">
            <div className="card-heading">
              <div>
                <span className="card-kicker">ผลลัพธ์จาก AI</span>
                <h2>สรุปแบบกระชับ</h2>
              </div>

              {summary && (
                <button
                  className="icon-button"
                  type="button"
                  onClick={handleCopy}
                  aria-label="คัดลอกผลสรุป"
                  title="คัดลอกผลสรุป"
                >
                  {copied ? <Check size={19} /> : <Clipboard size={19} />}
                </button>
              )}
            </div>

            <div className="result-area">
              {isLoading ? (
                <div className="result-state">
                  <span className="result-loader">
                    <Sparkles size={26} />
                  </span>
                  <h3>AI กำลังอ่านเนื้อหา</h3>
                  <p>กำลังค้นหาประเด็นสำคัญและเรียบเรียงให้อ่านง่าย</p>
                </div>
              ) : summary ? (
                <div className="summary-content">
                  <p>{summary}</p>

                  <div className="summary-footer">
                    <span>
                      สร้างจากข้อความ {inputText.length.toLocaleString()} ตัวอักษร
                    </span>
                    {copied && <strong>คัดลอกแล้ว</strong>}
                  </div>
                </div>
              ) : (
                <div className="result-state">
                  <span className="result-placeholder">
                    <WandSparkles size={28} />
                  </span>
                  <h3>ผลสรุปจะแสดงที่นี่</h3>
                  <p>
                    ใส่ข้อความทางด้านซ้าย แล้วกด “สรุปข้อความ”
                    เพื่อเริ่มใช้งาน
                  </p>
                </div>
              )}
            </div>
          </section>
        </section>

        <p className="privacy-note">
          โปรดตรวจสอบข้อมูลสำคัญอีกครั้ง เพราะผลลัพธ์จาก AI
          อาจมีข้อผิดพลาดได้
        </p>
      </main>
    </div>
  )
}
