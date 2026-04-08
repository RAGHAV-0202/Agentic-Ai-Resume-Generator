import './App.css'
import { BrowserRouter as Router, Route, Routes, useLocation } from "react-router-dom"
import { useEffect } from "react"
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Templates from './pages/Templates'
import Editor from './pages/Editor'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import PublicResume from './pages/PublicResume'

const getPageTitle = (pathname) => {
    if (pathname === "/") return "ResumeAI | AI Resume Builder"
    if (pathname === "/login") return "Login | ResumeAI"
    if (pathname === "/signup" || pathname === "/register") return "Sign Up | ResumeAI"
    if (pathname === "/dashboard") return "Dashboard | ResumeAI"
    if (pathname === "/templates") return "Templates | ResumeAI"
    if (pathname.startsWith("/editor/")) return "Resume Editor | ResumeAI"
    if (pathname.startsWith("/resume/")) return "Public Resume | ResumeAI"
    if (pathname === "/admin/login") return "Admin Login | ResumeAI"
    if (pathname === "/admin/dashboard") return "Admin Dashboard | ResumeAI"
    return "ResumeAI"
}

function TitleManager() {
    const { pathname } = useLocation()

    useEffect(() => {
        document.title = getPageTitle(pathname)
    }, [pathname])

    return null
}

function App() {
    return (
        <Router>
            <TitleManager />
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/register" element={<Signup />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/templates" element={<Templates />} />
                <Route path="/editor/:id" element={<Editor />} />
                <Route path="/resume/:id" element={<PublicResume />} />

                {/* Admin Routes */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
            </Routes>
        </Router>
    )
}

export default App



