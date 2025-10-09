import './globals.css'
import Navbar from '../components/Navbar'
import { ReactNode } from 'react'

export const metadata = {
  title: 'Cloudify Vaping Lounge',
  description: 'Business Management System',
}

interface RootLayoutProps {
  children: ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
      </body>
    </html>
  )
}