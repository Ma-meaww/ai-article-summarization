'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabaseClient'
import './styles/styles.css'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const [inputText, setInputText] = useState('')
  const [summary, setSummary] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [charLimit, setCharLimit] = useState(1000)
  const router = useRouter()

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession()
      const sessionUser = data.session?.user
      setUser(sessionUser)
      setCharLimit(sessionUser ? Infinity : 1000)

      if (sessionUser) {
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', sessionUser.id)
          .maybeSingle()

        if (!error) setProfile(profileData)
      }
    }

    getSession()

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user
      setUser(sessionUser)
      setCharLimit(sessionUser ? Infinity : 1000)

      if (sessionUser) {
        supabase
          .from('profiles')
          .select('full_name')
          .eq('id', sessionUser.id)
          .maybeSingle()
          .then(({ data, error }) => {
            if (!error) setProfile(data)
          })
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user && inputText.length > 1000) {
      alert('*ข้อความเกิน 1000 คำ* กรุณาล็อกอินเพื่อใช้งานแบบไม่จำกัด')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputText }),
      })

      const data = await response.json()
      setSummary(data.summary)

      if (user) {
        const { error } = await supabase.from('summaries').insert([
          {
            user_id: user.id,
            original_text: inputText,
            summary: data.summary,
          }
        ])
        if (error) console.error('Error saving summary:', error.message)
      }
    } catch (error) {
      console.error('Summarization failed:', error)
    }

    setIsLoading(false)
  }

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google' })
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/logout')
  }

  return (
    <>
      <header className="header">
        <div className="header-left">
        <h1
          className="logo"
          onClick={() => window.location.reload()}
        >
          InShort
        </h1>
        </div>
        <div className="header-center">
          <span className="nav-title">Summarizer</span>
        </div>
        <div className="header-right">
          {user ? (
            <>
              <span className="welcome-text">
                Welcome {profile?.full_name || user.user_metadata.full_name || user.email}!
              </span>
              <button className="button" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <button className="button" onClick={handleLogin}>
              Login with Google
            </button>
          )}

          <div className="flower-background" />

        </div>
      </header>

      <main className="container">
        <h2 className="title">เครื่องมือสำหรับสรุปข้อความ</h2>

        <form onSubmit={handleSubmit}>
          <textarea
            className="textarea"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="กรุณาใส่ข้อความที่ต้องการสรุป..."
          />
          <p className="char-count">
            {inputText.length}
            {charLimit !== Infinity ? '/1000' : ''}
          </p>

          <div className="button-row">
            <div className="button-left">
              <button className="button" disabled={isLoading}>
                {isLoading ? 'กำลังสรุป...' : 'Summarize'}
              </button>
              <button
                className="button"
                type="button"
                onClick={() => {
                  setInputText('')
                  setSummary('')
                }}
              >
                Clear
              </button>
            </div>

            {user && (
              <div className="button-right">
                <button
                  className="history-button"
                  type="button"
                  onClick={() => router.push('/history')}
                >
                  History
                </button>
              </div>
            )}
          </div>
        </form>

        {summary && (
          <section className="summary">
            <h2>สรุป:</h2>
              <p>{summary}</p>
          </section>
        )}
      </main>
    </>
  )
}
