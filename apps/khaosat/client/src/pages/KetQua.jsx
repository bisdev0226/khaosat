import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, adminHeaders } from '../api.js'
import { LOAI } from '../constants.js'

// ---------- tiện ích ----------
function sapThuTu(ds) {
  return [...(ds || [])].sort((a, b) => (a.thuTu || 0) - (b.thuTu || 0))
}

// Phần trăm trên tổng số phiếu, làm tròn 1 chữ số thập phân, dấu phẩy kiểu VN
function phanTram(so, tongPhieu) {
  if (!tongPhieu) return '0,0'
  return ((so / tongPhieu) * 100).toFixed(1).replace('.', ',')
}

// ---------- một hàng biểu đồ thanh: nhãn | thanh | "N (P%)" ----------
function HangBieuDo({ nhan, soLuong, max, tongPhieu }) {
  const rong = max > 0 ? (soLuong / max) * 100 : 0
  return (
    <div className="hang-bieu-do">
      <div className="nhan-bieu-do">{nhan}</div>
      <div className="ray-bieu-do">
        {soLuong > 0 && <div className="thanh-bieu-do" style={{ width: rong.toFixed(2) + '%' }} />}
      </div>
      <div className="so-bieu-do">
        {soLuong} ({phanTram(soLuong, tongPhieu)}%)
      </div>
    </div>
  )
}

// ---------- biểu đồ thanh theo phương án (loại 2/3/9 + hàng ma trận) ----------
function KhoiPhuongAn({ phuongAns, khac, tongPhieu }) {
  const [bungKhac, setBungKhac] = useState(false)
  const ds = phuongAns || []
  if (ds.length === 0 && !khac) return <div className="mo-nhat">Chưa có dữ liệu thống kê.</div>
  const max = Math.max(...ds.map((p) => p.soLuong || 0), khac ? khac.soLuong || 0 : 0, 0)
  const dsYKien = (khac && khac.noiDungs) || []
  return (
    <div>
      {ds.map((p, i) => (
        <HangBieuDo
          key={p.id ?? i}
          nhan={p.noiDung}
          soLuong={p.soLuong || 0}
          max={max}
          tongPhieu={tongPhieu}
        />
      ))}
      {khac && (
        <>
          <HangBieuDo nhan="Ý kiến khác" soLuong={khac.soLuong || 0} max={max} tongPhieu={tongPhieu} />
          {dsYKien.length > 0 && (
            <div>
              <button type="button" className="nut nut-nho" onClick={() => setBungKhac((b) => !b)}>
                {bungKhac ? 'Đóng danh sách ý kiến' : `Xem ý kiến khác (${dsYKien.length})`}
              </button>
              {bungKhac && (
                <ul className="mo-nhat">
                  {dsYKien.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ---------- biểu đồ thanh theo giá trị (loại 8/10/11/12) — giữ nguyên thứ tự server ----------
function KhoiGiaTri({ giaTris, tongPhieu }) {
  const ds = giaTris || []
  if (ds.length === 0) return <div className="mo-nhat">Chưa có dữ liệu thống kê.</div>
  const max = Math.max(...ds.map((g) => g.soLuong || 0), 0)
  return (
    <div>
      {ds.map((g, i) => (
        <HangBieuDo
          key={i}
          nhan={String(g.giaTri)}
          soLuong={g.soLuong || 0}
          max={max}
          tongPhieu={tongPhieu}
        />
      ))}
    </div>
  )
}

// ---------- danh sách ý kiến văn bản (loại 4) — hiện 20, bung dần ----------
function DanhSachVanBan({ vanBans }) {
  const [soHien, setSoHien] = useState(20)
  const ds = vanBans || []
  if (ds.length === 0) return <div className="mo-nhat">Chưa có ý kiến nào.</div>
  return (
    <div>
      <div className="ghi-chu">Tổng cộng {ds.length} ý kiến.</div>
      <ul>
        {ds.slice(0, soHien).map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>
      {soHien < ds.length && (
        <button type="button" className="nut nut-nho" onClick={() => setSoHien((s) => s + 20)}>
          Xem thêm ({ds.length - soHien} ý kiến nữa)
        </button>
      )}
    </div>
  )
}

// ---------- render đệ quy thống kê một câu hỏi ----------
function ThongKeCau({ cau, tongPhieu }) {
  const loai = cau.maLoaiCauHoi
  const con = sapThuTu(cau.cauHoiCon)

  // Nhóm câu hỏi: các câu con thụt lề
  if (loai === LOAI.NHOM) {
    return (
      <div className="nhom-con">
        {con.map((c) => (
          <div className="cau-con" key={c.id}>
            <div className="de-cau-con">{c.noiDung}</div>
            <ThongKeCau cau={c} tongPhieu={tongPhieu} />
          </div>
        ))}
      </div>
    )
  }

  // Ma trận: cha chỉ mang tên cột (phuongAns soLuong=null) — thống kê thật ở từng hàng
  if (loai === LOAI.MA_TRAN_NHIEU || loai === LOAI.MA_TRAN_MOT) {
    if (con.length === 0) return <div className="mo-nhat">Chưa có dữ liệu thống kê.</div>
    return (
      <div>
        {con.map((hang) => (
          <div className="cau-con" key={hang.id}>
            <div className="de-cau-con">{hang.noiDung}</div>
            <KhoiPhuongAn phuongAns={hang.phuongAns} khac={hang.khac} tongPhieu={tongPhieu} />
          </div>
        ))}
      </div>
    )
  }

  if (loai === LOAI.NHAP_TEXT) return <DanhSachVanBan vanBans={cau.vanBans} />

  if (cau.giaTris) return <KhoiGiaTri giaTris={cau.giaTris} tongPhieu={tongPhieu} />

  if (cau.phuongAns) return <KhoiPhuongAn phuongAns={cau.phuongAns} khac={cau.khac} tongPhieu={tongPhieu} />

  // Dự phòng: có câu con thì render tiếp như nhóm
  if (con.length > 0) {
    return (
      <div className="nhom-con">
        {con.map((c) => (
          <div className="cau-con" key={c.id}>
            <div className="de-cau-con">{c.noiDung}</div>
            <ThongKeCau cau={c} tongPhieu={tongPhieu} />
          </div>
        ))}
      </div>
    )
  }
  return <div className="mo-nhat">Chưa có dữ liệu thống kê.</div>
}

// ---------- trang kết quả công khai ----------
export default function KetQua() {
  const { id } = useParams()
  const [duLieu, setDuLieu] = useState(null)
  const [dangTai, setDangTai] = useState(true)
  const [loi, setLoi] = useState('')
  const [khongCongKhai, setKhongCongKhai] = useState(false)

  useEffect(() => {
    let daHuy = false
    setDangTai(true)
    setLoi('')
    setKhongCongKhai(false)
    api(`/api/v1/khaosats/${id}/thongke`, { headers: adminHeaders() })
      .then((body) => {
        if (!daHuy) setDuLieu(body.data)
      })
      .catch((e) => {
        if (daHuy) return
        if (e.status === 403) setKhongCongKhai(true)
        else setLoi(e.message || 'Không tải được kết quả khảo sát.')
      })
      .finally(() => {
        if (!daHuy) setDangTai(false)
      })
    return () => {
      daHuy = true
    }
  }, [id])

  if (dangTai) {
    return (
      <div className="trang">
        <div className="khung tai-giua mo-nhat cach-tren">Đang tải kết quả khảo sát…</div>
      </div>
    )
  }

  if (khongCongKhai) {
    return (
      <div className="trang">
        <div className="khung">
          <div className="the tai-giua">
            <div className="hop-thong-bao nhac">Kết quả khảo sát này không công khai.</div>
            <div className="hang-nut">
              <Link className="nut" to={`/khao-sat/${id}`}>Quay lại phiếu khảo sát</Link>
              <Link className="nut nut-chinh" to="/quan-tri">Đăng nhập quản trị</Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loi || !duLieu) {
    return (
      <div className="trang">
        <div className="khung">
          <div className="hop-thong-bao loi">{loi || 'Không tải được kết quả khảo sát.'}</div>
          <div className="hang-nut">
            <Link className="nut" to={`/khao-sat/${id}`}>Quay lại phiếu khảo sát</Link>
          </div>
        </div>
      </div>
    )
  }

  const dsCau = sapThuTu(duLieu.cauHois)
  const tongPhieu = duLieu.tongPhieu || 0

  return (
    <div className="trang">
      <div className="khung">
        <div className="the the-dau">
          <div className="mo-nhat">KẾT QUẢ KHẢO SÁT</div>
          <h1 className="tieu-de-khao-sat">{duLieu.tieuDe}</h1>
          <div>
            Tổng số phiếu: <strong>{tongPhieu}</strong>
          </div>
          <div className="hang-nut cach-tren">
            <Link className="nut" to={`/khao-sat/${id}`}>Quay lại phiếu khảo sát</Link>
          </div>
        </div>

        {dsCau.map((cau, i) => (
          <div className="the" key={cau.id}>
            <div className="de-cau">
              <span className="so-cau">Câu {i + 1}.</span>
              {cau.noiDung}
            </div>
            <ThongKeCau cau={cau} tongPhieu={tongPhieu} />
          </div>
        ))}

        {dsCau.length === 0 && (
          <div className="the tai-giua mo-nhat">Khảo sát chưa có câu hỏi nào.</div>
        )}
      </div>
    </div>
  )
}
