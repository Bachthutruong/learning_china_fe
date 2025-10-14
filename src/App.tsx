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
import { VocabularyLearning } from './pages/VocabularyLearning'
import { AddVocabulary } from './pages/AddVocabulary'
// import { Tests } from './pages/Tests'
import { ProficiencyTest } from './pages/ProficiencyTest'
import { Competition } from './pages/Competition'
import { CompetitionDetail } from './pages/CompetitionDetail'
import { Profile } from './pages/Profile'
import { Admin } from './pages/Admin'
import { AdminVocabulary } from './pages/admin/Vocabulary'
import { AdminTopics } from './pages/admin/Topics'
import { AdminLevels } from './pages/admin/Levels'
import { AdminLayout } from './layouts/AdminLayout'
import { AdminReports } from './pages/admin/Reports'
import { AdminTests as AdminTestsPage } from './pages/admin/Tests'
import { AdminCompetitions } from './pages/admin/Competitions'
import { AdminCompetitionEdit } from './pages/admin/CompetitionEdit'
import { AdminCompetitionStats } from './pages/admin/CompetitionStats'
import { AdminUsers } from './pages/admin/Users'
import { AdminAnalytics } from './pages/admin/Analytics'
import { AdminTestHistories } from './pages/admin/TestHistories'
import { AdminProficiencyConfig } from './pages/admin/ProficiencyConfig'
import { ProficiencyConfigPage } from './pages/admin/ProficiencyConfigPage'
import { ProficiencyConfigForm } from './pages/admin/ProficiencyConfigForm'
import { AdminProficiencyQuestions } from './pages/admin/ProficiencyQuestions'
import { AdminSettings } from './pages/admin/Settings'
import { CoinPurchase } from './pages/CoinPurchase'
import { UserCoinHistory } from './pages/UserCoinHistory'
import { AdminCoinPurchases } from './pages/admin/CoinPurchases'
import { AdminCoinTransactions } from './pages/admin/CoinTransactions'
import { PaymentConfigPage } from './pages/admin/PaymentConfig'
import { TestList } from './pages/TestList'
import { TestDetail } from './pages/TestDetail'
import { NewTestPage } from './pages/NewTestPage'
import { Checkin } from './pages/Checkin'

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
              <Route path="/vocabulary-learning" element={
                <ProtectedRoute>
                  <VocabularyLearning />
                </ProtectedRoute>
              } />
              <Route path="/vocabulary-learning/add" element={
                <ProtectedRoute>
                  <AddVocabulary />
                </ProtectedRoute>
              } />
              <Route path="/tests" element={
                <ProtectedRoute>
                  <TestList />
                </ProtectedRoute>
              } />
              <Route path="/test/:id" element={
                <ProtectedRoute>
                  <TestDetail />
                </ProtectedRoute>
              } />
              <Route path="/test/new" element={
                <ProtectedRoute>
                  <NewTestPage />
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
              <Route path="/competition/:id" element={
                <ProtectedRoute>
                  <CompetitionDetail />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              <Route path="/checkin" element={
                <ProtectedRoute>
                  <Checkin />
                </ProtectedRoute>
              } />
              <Route path="/coin-purchase" element={
                <ProtectedRoute>
                  <CoinPurchase />
                </ProtectedRoute>
              } />
              <Route path="/coin-history" element={
                <ProtectedRoute>
                  <UserCoinHistory />
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
              <Route path="/admin/test-histories" element={
                <ProtectedRoute requireAdmin>
                  <AdminLayout>
                    <AdminTestHistories />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/proficiency" element={
                <ProtectedRoute requireAdmin>
                  <AdminLayout>
                    <AdminProficiencyConfig />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/proficiency-config" element={
                <ProtectedRoute requireAdmin>
                  <AdminLayout>
                    <ProficiencyConfigPage />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/proficiency-config/new" element={
                <ProtectedRoute requireAdmin>
                  <AdminLayout>
                    <ProficiencyConfigForm />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/proficiency-config/:id/edit" element={
                <ProtectedRoute requireAdmin>
                  <AdminLayout>
                    <ProficiencyConfigForm />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/proficiency-questions" element={
                <ProtectedRoute requireAdmin>
                  <AdminLayout>
                    <AdminProficiencyQuestions />
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
              <Route path="/admin/competitions/:id" element={
                <ProtectedRoute requireAdmin>
                  <AdminLayout>
                    <AdminCompetitionEdit />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/competitions/:id/stats" element={
                <ProtectedRoute requireAdmin>
                  <AdminLayout>
                    <AdminCompetitionStats />
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
              <Route path="/admin/coin-purchases" element={
                <ProtectedRoute requireAdmin>
                  <AdminLayout>
                    <AdminCoinPurchases />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/payment-config" element={
                <ProtectedRoute requireAdmin>
                  <AdminLayout>
                    <PaymentConfigPage />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/coin-transactions" element={
                <ProtectedRoute requireAdmin>
                  <AdminLayout>
                    <AdminCoinTransactions />
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
