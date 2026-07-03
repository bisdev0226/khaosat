import { Routes, Route } from 'react-router-dom'
import TrangChu from './pages/TrangChu.jsx'
import KhaoSat from './pages/KhaoSat.jsx'
import HoanThanh from './pages/HoanThanh.jsx'
import KetQua from './pages/KetQua.jsx'
import QuanTri from './pages/QuanTri.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<TrangChu />} />
      <Route path="/khao-sat/:id" element={<KhaoSat />} />
      <Route path="/khao-sat/:id/hoan-thanh" element={<HoanThanh />} />
      <Route path="/khao-sat/:id/ket-qua" element={<KetQua />} />
      <Route path="/quan-tri" element={<QuanTri />} />
      <Route path="*" element={<TrangChu />} />
    </Routes>
  )
}
