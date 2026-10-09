import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import RequireAuth from './components/RequireAuth.jsx'
import Header from './components/organisms/Header.jsx'
import DemoNotice from './components/DemoNotice.jsx'
import Home from './pages/Home.jsx'
import Library from './pages/Library.jsx'
import BrandKitBuilder from './pages/BrandKitBuilder.jsx'
import ProjectEntry from './pages/ProjectEntry.jsx'
import QuickCapture from './pages/QuickCapture.jsx'
import Login from './pages/Login.jsx'
import Settings from './pages/Settings.jsx'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter basename={import.meta.env.BASE_URL}>
            <Header />
            <DemoNotice />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<RequireAuth><Home /></RequireAuth>} />
              <Route path="/library" element={<RequireAuth><Library /></RequireAuth>} />
              <Route path="/kit/:id" element={<RequireAuth><BrandKitBuilder /></RequireAuth>} />
              <Route path="/project/:id" element={<RequireAuth><ProjectEntry /></RequireAuth>} />
              <Route path="/notes" element={<RequireAuth><QuickCapture /></RequireAuth>} />
              <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}