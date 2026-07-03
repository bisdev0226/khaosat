import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'
import { dinhDangThoiGian } from '../constants.js'

const NHAN_TRANG_THAI = {
  'dang-mo': 'Đang diễn ra',
  'chua-mo': 'Chưa mở',
  'da-dong': 'Đã kết thúc',
  khoa: 'Không khả dụng',
}

// Trang chủ — danh sách các cuộc khảo sát
export default function TrangChu() {
  const [dsKhaoSat, setDsKhaoSat] = useState([])
  const [dangTai, setDangTai] = useState(true)
  const [loiTai, setLoiTai] = useState('')

  useEffect(() => {
    document.title = 'Hệ thống khảo sát trực tuyến'
    let huy = false
    api('/api/v1/khaosats')
      .then((body) => {
        if (!huy) setDsKhaoSat(body?.data || [])
      })
      .catch((e) => {
        if (!huy) setLoiTai(e.message || 'Không tải được danh sách khảo sát')
      })
      .finally(() => {
        if (!huy) setDangTai(false)
      })
    return () => {
      huy = true
    }
  }, [])

  return (
    <div className="trang">
      <header className="thanh-dau">
        <div className="khung">
          <h1>HỆ THỐNG KHẢO SÁT TRỰC TUYẾN</h1>
          <Link to="/quan-tri">Quản trị</Link>
        </div>
      </header>

      <div className="khung">
        {dangTai && <div className="the tai-giua mo-nhat">Đang tải danh sách khảo sát…</div>}

        {!dangTai && loiTai && <div className="hop-thong-bao loi">{loiTai}</div>}

        {!dangTai && !loiTai && dsKhaoSat.length === 0 && (
          <div className="the tai-giua mo-nhat">Chưa có cuộc khảo sát nào</div>
        )}

        {dsKhaoSat.map((ks) => (
          <div key={ks.id} className="the">
            <div className="de-cau">
              <Link to={`/khao-sat/${ks.id}`}>{ks.tieuDe}</Link>
            </div>
            <div className="ghi-chu">
              Thời gian: {dinhDangThoiGian(ks.thoiGianBatDau)} —{' '}
              {dinhDangThoiGian(ks.thoiGianKetThuc)}
            </div>
            <div className="cach-tren">
              <span
                className={
                  'nhan-trang-thai ' + (ks.trangThai === 'dang-mo' ? 'mo' : 'dong')
                }
              >
                {NHAN_TRANG_THAI[ks.trangThai] || ks.trangThai}
              </span>
              {ks.isViewKQ && (
                <Link to={`/khao-sat/${ks.id}/ket-qua`} style={{ marginLeft: 16 }}>
                  Xem kết quả
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
