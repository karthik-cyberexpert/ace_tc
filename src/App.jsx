import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './components/Login'
import AdminDashboard from './pages/AdminDashboard'
import OfficeDashboard from './pages/OfficeDashboard'
import PrincipalDashboard from './pages/PrincipalDashboard'
import TransferCertificate from './pages/TransferCertificate'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/office" element={<OfficeDashboard />} />
        <Route path="/principal" element={<PrincipalDashboard />} />
        <Route path="/tc-view/:id" element={<TransferCertificate />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  )
}

export default App
