import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './components/Login'
import AdminDashboard from './pages/AdminDashboard'
import OfficeDashboard from './pages/OfficeDashboard'
import PrincipalDashboard from './pages/PrincipalDashboard'
import TransferCertificate from './pages/TransferCertificate'
import CourseCompletionCertificate from './pages/CourseCompletionCertificate'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin" element={<ProtectedRoute element={<AdminDashboard />} allowedRole="admin" />} />
        <Route path="/office" element={<ProtectedRoute element={<OfficeDashboard />} allowedRole="office" />} />
        <Route path="/principal" element={<ProtectedRoute element={<PrincipalDashboard />} allowedRole="principal" />} />
        <Route path="/tc-view/:id" element={<TransferCertificate />} />
        <Route path="/cc-view/:id" element={<CourseCompletionCertificate />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  )
}

export default App

