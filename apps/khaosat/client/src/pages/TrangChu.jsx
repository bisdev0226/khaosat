import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'
import { CHIEN_DICH, thongTinPhieu } from '../constants.js'
import Masthead from '../components/Masthead.jsx'

// Trang chủ — trang giới thiệu cuộc khảo sát của Sở Tư pháp + chọn phiếu theo đối tượng
export default function TrangChu() {
  const [dsKhaoSat, setDsKhaoSat] = useState([])
  const [dangTai, setDangTai] = useState(true)
  const [loiTai, setLoiTai] = useState('')

  useEffect(() => {
    document.title = 'Khảo sát tình hình thi hành pháp luật về an toàn thực phẩm'
    let huy = false
    api('/api/v1/khaosats')
      .then((body) => {
        if (!huy) setDsKhaoSat(body?.data || [])
      })
      .catch((e) => {
        if (!huy) setLoiTai(e.message || 'Không tải được danh sách phiếu khảo sát')
      })
      .finally(() => {
        if (!huy) setDangTai(false)
      })
    return () => {
      huy = true
    }
  }, [])

  // Sắp theo "phiếu số" (1 trước, 2 sau); phiếu không rõ số xếp cuối
  const ds = [...dsKhaoSat].sort(
    (a, b) => (thongTinPhieu(a.tieuDe).so || 99) - (thongTinPhieu(b.tieuDe).so || 99)
  )

  return (
    <div className="trang trang-chu">
      <div className="khung">
        <div className="the the-gioi-thieu">
          <Masthead />
          <h1 className="tieu-de-chien-dich">{CHIEN_DICH.tieuDe}</h1>
          <p className="gioi-thieu-chien-dich">{CHIEN_DICH.gioiThieu}</p>
        </div>

        <div className="tieu-de-muc">Chọn phiếu phù hợp với đối tượng của Ông/Bà</div>

        {dangTai && <div className="the tai-giua mo-nhat">Đang tải danh sách phiếu…</div>}
        {!dangTai && loiTai && <div className="hop-thong-bao loi">{loiTai}</div>}
        {!dangTai && !loiTai && ds.length === 0 && (
          <div className="the tai-giua mo-nhat">Chưa có phiếu khảo sát nào</div>
        )}

        <div className="luoi-phieu">
          {ds.map((ks) => {
            const { so, doiTuong } = thongTinPhieu(ks.tieuDe)
            const moContent = ks.trangThai === 'dang-mo'
            return (
              <div key={ks.id} className="the the-phieu">
                <div className="phieu-so">Phiếu số {so ?? '?'}</div>
                <div className="phieu-doi-tuong">{doiTuong || ks.tieuDe}</div>
                <div className="phieu-nut">
                  {moContent ? (
                    <Link className="nut nut-chinh" to={`/khao-sat/${ks.id}`}>
                      Bắt đầu trả lời phiếu
                    </Link>
                  ) : (
                    <span className="nhan-trang-thai dong">
                      {ks.trangThai === 'da-dong' ? 'Đã kết thúc' : 'Chưa mở'}
                    </span>
                  )}
                  {ks.isViewKQ && (
                    <Link className="nut nut-nho" to={`/khao-sat/${ks.id}/ket-qua`}>
                      Xem kết quả
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="the ghi-chu-bao-mat">{CHIEN_DICH.baoMat}</div>

        <div className="chan-trang">
          <span>© {CHIEN_DICH.tieuDe.includes('AN TOÀN') ? 'Sở Tư pháp tỉnh Đắk Lắk' : ''}</span>
          <Link to="/quan-tri" className="mo-nhat">
            Quản trị
          </Link>
        </div>
      </div>
    </div>
  )
}
