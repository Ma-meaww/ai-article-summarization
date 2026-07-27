import { Groq } from 'groq-sdk'
import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/utils/supabase/server'

const GUEST_CHAR_LIMIT = 1000
const MEMBER_CHAR_LIMIT = 12000

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: unknown = await request.json()

    if (
      typeof body !== 'object' ||
      body === null ||
      !('inputText' in body) ||
      typeof body.inputText !== 'string'
    ) {
      return NextResponse.json(
        { error: 'รูปแบบข้อมูลไม่ถูกต้อง' },
        { status: 400 },
      )
    }

    const inputText = body.inputText.trim()

    if (!inputText) {
      return NextResponse.json(
        { error: 'กรุณาใส่ข้อความที่ต้องการสรุป' },
        { status: 400 },
      )
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const charLimit = user ? MEMBER_CHAR_LIMIT : GUEST_CHAR_LIMIT

    if (inputText.length > charLimit) {
      return NextResponse.json(
        {
          error: user
            ? `ข้อความยาวเกิน ${MEMBER_CHAR_LIMIT.toLocaleString()} ตัวอักษร`
            : `ผู้ใช้ทั่วไปใส่ข้อความได้ไม่เกิน ${GUEST_CHAR_LIMIT.toLocaleString()} ตัวอักษร`,
        },
        { status: 400 },
      )
    }

    const apiKey = process.env.GROQ_API_KEY

    if (!apiKey) {
      console.error('Missing GROQ_API_KEY')
      return NextResponse.json(
        { error: 'เซิร์ฟเวอร์ยังไม่ได้ตั้งค่า Groq API Key' },
        { status: 500 },
      )
    }

    const groq = new Groq({ apiKey })
    const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'

    const chatCompletion = await groq.chat.completions.create({
      model,
      temperature: 0.25,
      max_completion_tokens: 1200,
      messages: [
        {
          role: 'system',
          content:
            'You are an accurate summarization assistant. Summarize the provided text in the same language as the source. Keep important facts and context, remove repetition, and make the result clear and concise. Use bullet points only when they improve readability. Never invent information that is not present in the source.',
        },
        {
          role: 'user',
          content: `Summarize the following text:\n\n${inputText}`,
        },
      ],
    })

    const summary = chatCompletion.choices[0]?.message?.content?.trim()

    if (!summary) {
      return NextResponse.json(
        { error: 'AI ไม่ได้ส่งผลสรุปกลับมา กรุณาลองใหม่อีกครั้ง' },
        { status: 502 },
      )
    }

    if (user) {
      const { error: saveError } = await supabase.from('summaries').insert({
        user_id: user.id,
        original_text: inputText,
        summary,
      })

      if (saveError) {
        console.error('Failed to save summary:', saveError.message)
      }
    }

    return NextResponse.json({ summary })
  } catch (error) {
    console.error('Groq summarization error:', error)

    const message =
      error instanceof Error && error.message.includes('model')
        ? 'โมเดล AI ที่ตั้งค่าไว้ไม่พร้อมใช้งาน กรุณาตรวจสอบ GROQ_MODEL'
        : 'เกิดข้อผิดพลาดระหว่างสรุปข้อความ กรุณาลองใหม่อีกครั้ง'

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
