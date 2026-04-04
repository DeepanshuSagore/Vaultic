import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import { ThemeProvider } from 'next-themes'
import { BrowserRouter } from 'react-router-dom'
import { ReactLenis } from 'lenis/react'
import './index.css'
import App from './App.tsx'

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!publishableKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env.local')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider publishableKey={publishableKey}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <ReactLenis root options={{ lerp: 0.08, duration: 1.2 }}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ReactLenis>
      </ThemeProvider>
    </ClerkProvider>
  </StrictMode>,
)
