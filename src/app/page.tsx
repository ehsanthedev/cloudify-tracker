'use client'
import SalesTracker from '../components/SalesTracker'
import { ReactElement } from 'react'

export default function Home(): ReactElement {
  return (
    <div style={containerStyles}>
      <header style={headerStyles}>
        <h1>CLOUDIFY VAPING LOUNGE - SALES TRACKER</h1>
      </header>
      <SalesTracker />
    </div>
  )
}

// Styles with TypeScript types
const containerStyles: React.CSSProperties = {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '20px'
}

const headerStyles: React.CSSProperties = {
  textAlign: 'center',
  padding: '20px 0',
  marginBottom: '30px',
  background: 'linear-gradient(135deg, #4a6fa5, #2c3e50)',
  color: 'white',
  borderRadius: '10px',
  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
}