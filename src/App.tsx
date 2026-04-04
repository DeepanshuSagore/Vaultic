import {
  RedirectToSignIn,
  SignedIn,
  SignedOut,
} from '@clerk/clerk-react'
import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import { AuthenticatedLayout } from '@/components/layout-shell'
import { HomeHero } from '@/pages/home-hero'
import { DashboardPage } from '@/pages/dashboard'
import { CategoryViewPage } from '@/pages/category-view'
import { ProfilePage } from '@/pages/profile'
import { AuthPage } from '@/pages/auth'

function ProtectedRoute({
  children,
  redirectUrl,
}: {
  children: ReactNode
  redirectUrl: string
}) {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <RedirectToSignIn redirectUrl={redirectUrl} />
      </SignedOut>
    </>
  )
}

function HomePage() {
  return (
    <>
      <SignedOut>
        <HomeHero />
      </SignedOut>
      <SignedIn>
        <Navigate to="/library" replace />
      </SignedIn>
    </>
  )
}

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/sign-in/*" element={<AuthPage mode="sign-in" />} />
      <Route path="/sign-up/*" element={<AuthPage mode="sign-up" />} />

      {/* Authenticated routes — share a single layout (sidebar + topbar mount ONCE) */}
      <Route
        element={
          <ProtectedRoute redirectUrl="/library">
            <AuthenticatedLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/library" element={<DashboardPage />} />
        <Route path="/library/:categoryRef" element={<CategoryViewPage />} />
        <Route path="/me" element={<ProfilePage />} />
      </Route>

      {/* Legacy redirect */}
      <Route path="/vault" element={<Navigate to="/library" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
