import { Routes, Route } from 'react-router-dom'
import Dashboard      from './pages/Dashboard'
import Suppliers      from './pages/Suppliers'
import RiskAssessment from './pages/RiskAssessment'
import DueDiligence   from './pages/DueDiligence'
import Blockchain     from './pages/Blockchain'

export default function Router() {
  return (
    <Routes>
      <Route path="/"              element={<Dashboard />} />
      <Route path="/suppliers"     element={<Suppliers />} />
      <Route path="/risk"          element={<RiskAssessment />} />
      <Route path="/due-diligence" element={<DueDiligence />} />
      <Route path="/blockchain"    element={<Blockchain />} />
    </Routes>
  )
}
