import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import Skills from './pages/Skills'
import SkillDetail from './pages/SkillDetail'

export default function App() {
  return (
    <div className="app-shell">
      <Header />
      <main className="content-shell flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/skills" element={<Skills />} />
          <Route path="/skills/:slug" element={<SkillDetail />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
