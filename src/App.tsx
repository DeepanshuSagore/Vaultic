import {
  RedirectToSignIn,
  SignedIn,
  SignedOut,
} from '@clerk/clerk-react'
import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import { PageTransition } from '@/components/page-transition'
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
        <DashboardPage />
      </SignedIn>
    </>
  )
}

function App() {
  return (
    <PageTransition>
      <Routes>
        <Route path="/" element={<HomePage />} />

        <Route
          path="/library"
          element={
            <ProtectedRoute redirectUrl="/library">
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/library/:categoryRef"
          element={
            <ProtectedRoute redirectUrl="/library">
              <CategoryViewPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/me"
          element={
            <ProtectedRoute redirectUrl="/me">
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        <Route path="/vault" element={<Navigate to="/library" replace />} />
        <Route path="/sign-in/*" element={<AuthPage mode="sign-in" />} />
        <Route path="/sign-up/*" element={<AuthPage mode="sign-up" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </PageTransition>
  )
}

export default App
