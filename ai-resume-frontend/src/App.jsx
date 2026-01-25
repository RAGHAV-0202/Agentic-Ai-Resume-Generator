import './App.css'
import { BrowserRouter as Router, Route, Routes } from "react-router-dom"
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/register" element={<Signup />} />
                <Route path="/dashboard" element ={<Dashboard/>}/>
            </Routes>
        </Router>
    )
}

export default App



