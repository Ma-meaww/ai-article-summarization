import type { Metadata } from 'next'
import { Geist, Geist_Mono, Noto_Sans_Thai } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const notoSansThai = Noto_Sans_Thai({
  variable: '--font-thai',
  subsets: ['thai'],
})

export const metadata: Metadata = {
  title: 'InShort - AI Summarizer',
  description: 'สรุปบทความและข้อความด้วย AI',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="th">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${notoSansThai.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  )
}