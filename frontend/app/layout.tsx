import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'
import { ThemeProvider } from '@/components/ThemeProvider'

export const metadata: Metadata = {
  title: 'Curator - Your Personal Style Assistant',
  description: 'AI-powered wardrobe management with personalized styling recommendations',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <Navbar />
          <main className="min-h-screen bg-white dark:bg-black transition-colors duration-smooth">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  )
}

