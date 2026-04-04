import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import Skills from './pages/Skills'
import SkillDetail from './pages/SkillDetail'
import Favorites from './pages/Favorites'
import PointsCenter from './pages/PointsCenter'
import MyPurchases from './pages/MyPurchases'
import MySkills from './pages/MySkills'
import UserProfile from './pages/UserProfile'
import SubmitSkill from './pages/SubmitSkill'
import AuthCallback from './pages/AuthCallback'
import AdminLogin from './pages/AdminLogin'
import Admin from './pages/Admin'
import Leaderboard from './pages/Leaderboard'
import NotFound from './pages/NotFound'

function AdminRoute({ children }) {
  const { isLoggedIn, isAdmin, loading } = useAuth()
  if (loading) return null
  if (!isLoggedIn || !isAdmin) return <Navigate to="/admin/login" replace />
  return children
}

export default function App() {
  return (
    <div className="app-shell">
      <Header />
      <main className="content-shell flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/skills" element={<Skills />} />
          <Route path="/skills/:slug" element={<SkillDetail />} />
          <Route path="/me/favorites" element={<Favorites />} />
          <Route path="/me/points" element={<PointsCenter />} />
          <Route path="/me/purchases" element={<MyPurchases />} />
          <Route path="/me/skills" element={<MySkills />} />
          <Route path="/u/:username" element={<UserProfile />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/submit" element={<SubmitSkill />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <Admin />
              </AdminRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
