import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) { // เรียก updateSession เพื่อ sync session ทุกครั้งที่ผู้ใช้เข้าเว็บ
  return await updateSession(request)
}

export const config = { // กำหนด matcher ว่า ไฟล์รูป, static file ไม่ต้องเช็ค session
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}