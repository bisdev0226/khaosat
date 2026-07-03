import { useEffect, useState } from 'react'
import { dinhDangThoiGian } from '../../constants.js'

const MOI_TRANG = 20

// Ghép thông tin người trả lời (nếu có) thành một dòng text
function moTaNguoi(n) {
  if (!n) return '—'
  if (typeof n === 'string') return n || '—'
  const phan = []
  if (n.ten) phan.push(n.ten)
  if (n.email) phan.push(n.email)
  if (n.dienThoai) phan.push('ĐT: ' + n.dienThoai)
  if (n.namSinh) phan.push('Sinh: ' + n.namSinh)
  if (n.gioiTinh) phan.push(n.gioiTinh)
  if (n.diaChi) phan.push(n.diaChi)
  return phan.length ? phan.join(' · ') : '—'
}

// Panel danh sách phiếu trả lời của một khảo sát, phân trang Trước/Sau 20/trang
export default function PanelPhieu({ khaoSat, goiAdmin, onDong }) {
  const [trang, setTrang] = useState(0)
  const [tong, setTong] = useState(0)
  const [items, setItems] = useState([])
  const [dangTai, setDangTai] = useState(true)
  const [loi, setLoi] = useState('')

  useEffect(() => {
    let daHuy = false
    setDangTai(true)
    setLoi('')
    goiAdmin(`/api/v1/admin/khaosats/${khaoSat.id}/ketquas?skip=${trang * MOI_TRANG}&take=${MOI_TRANG}`)
      .then((body) => {
        if (daHuy) return
        setTong((body.data && body.data.tong) || 0)
        setItems((body.data && body.data.items) || [])
      })
      .catch((e) => {
        if (!daHuy && e.status !== 401) setLoi(e.message || 'Không tải được danh sách phiếu.')
      })
      .finally(() => {
        if (!daHuy) setDangTai(false)
      })
    return () => {
      daHuy = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [khaoSat.id, trang])

  const soTrang = Math.max(1, Math.ceil(tong / MOI_TRANG))

  return (
    <div className="the">
      <div className="dau-khoi">
        <strong>Phiếu trả lời — {khaoSat.tieuDe}</strong>
        <span className="day-phai">
          <button type="button" className="nut nut-nho" onClick={onDong}>
            Đóng
          </button>
        </span>
      </div>

      {loi && <div className="hop-thong-bao loi">{loi}</div>}
      {dangTai && <div className="mo-nhat">Đang tải danh sách phiếu…</div>}

      {!dangTai && !loi && (
        <>
          {items.length === 0 ? (
            <div className="mo-nhat">Chưa có phiếu trả lời nào.</div>
          ) : (
            <div className="cuon-ngang">
              <table className="bang-du-lieu">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Thời gian gửi</th>
                    <th>Người trả lời</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((p, i) => (
                    <tr key={p.id}>
                      <td>{trang * MOI_TRANG + i + 1}</td>
                      <td>{dinhDangThoiGian(p.createdAt)}</td>
                      <td>{moTaNguoi(p.nguoiKhaoSat)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="hang-thao-tac cach-tren">
            <button
              type="button"
              className="nut nut-nho"
              onClick={() => setTrang((t) => Math.max(0, t - 1))}
              disabled={trang === 0}
            >
              ← Trước
            </button>
            <button
              type="button"
              className="nut nut-nho"
              onClick={() => setTrang((t) => t + 1)}
              disabled={(trang + 1) * MOI_TRANG >= tong}
            >
              Sau →
            </button>
            <span className="mo-nhat">
              Trang {trang + 1}/{soTrang} — tổng {tong} phiếu
            </span>
          </div>
        </>
      )}
    </div>
  )
}
