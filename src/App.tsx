import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Navbar } from './components/Navbar'
import { Footer } from './components/Footer'

// Pages
import { Home } from './pages/Home'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Dashboard } from './pages/Dashboard'
import { Vocabulary } from './pages/Vocabulary'
import { Tests } from './pages/Tests'
import { ProficiencyTest } from './pages/ProficiencyTest'
import { Competition } from './pages/Competition'
import { Profile } from './pages/Profile'
import { Admin } from './pages/Admin'
import { AdminVocabulary } from './pages/admin/Vocabulary'
import { AdminTopics } from './pages/admin/Topics'
import { AdminLevels } from './pages/admin/Levels'
import { AdminLayout } from './layouts/AdminLayout'
import { AdminReports } from './pages/admin/Reports'
import { AdminTests as AdminTestsPage } from './pages/admin/Tests'
import { AdminCompetitions } from './pages/admin/Competitions'
import { AdminUsers } from './pages/admin/Users'
import { AdminAnalytics } from './pages/admin/Analytics'
import { AdminSettings } from './pages/admin/Settings'

// Help pages
import { HelpCenter } from './pages/HelpCenter'
import { FAQ } from './pages/FAQ'
import { Contact } from './pages/Contact'
import { Feedback } from './pages/Feedback'
import { PrivacyPolicy } from './pages/PrivacyPolicy'
import { TermsOfUse } from './pages/TermsOfUse'
import { CookiePolicy } from './pages/CookiePolicy'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
          <Navbar />
          <main className="min-h-screen">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Help pages */}
              <Route path="/help" element={<HelpCenter />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/feedback" element={<Feedback />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfUse />} />
              <Route path="/cookies" element={<CookiePolicy />} />
              
              {/* Protected routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/vocabulary" element={
                <ProtectedRoute>
                  <Vocabulary />
                </ProtectedRoute>
              } />
              <Route path="/tests" element={
                <ProtectedRoute>
                  <Tests />
                </ProtectedRoute>
              } />
              <Route path="/proficiency" element={
                <ProtectedRoute>
                  <ProficiencyTest />
                </ProtectedRoute>
              } />
              <Route path="/competition" element={
                <ProtectedRoute>
                  <Competition />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute requireAdmin>
                  <Admin />
                </ProtectedRoute>
              } />
              <Route path="/admin/vocabulary" element={
                <ProtectedRoute requireAdmin>
                  <AdminLayout>
                    <AdminVocabulary />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/topics" element={
                <ProtectedRoute requireAdmin>
                  <AdminLayout>
                    <AdminTopics />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/levels" element={
                <ProtectedRoute requireAdmin>
                  <AdminLayout>
                    <AdminLevels />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/reports" element={
                <ProtectedRoute requireAdmin>
                  <AdminLayout>
                    <AdminReports />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/tests" element={
                <ProtectedRoute requireAdmin>
                  <AdminLayout>
                    <AdminTestsPage />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/competitions" element={
                <ProtectedRoute requireAdmin>
                  <AdminLayout>
                    <AdminCompetitions />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/users" element={
                <ProtectedRoute requireAdmin>
                  <AdminLayout>
                    <AdminUsers />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/analytics" element={
                <ProtectedRoute requireAdmin>
                  <AdminLayout>
                    <AdminAnalytics />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/settings" element={
                <ProtectedRoute requireAdmin>
                  <AdminLayout>
                    <AdminSettings />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              
              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
