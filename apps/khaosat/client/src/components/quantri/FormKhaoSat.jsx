import { useState } from 'react'
import SoanCauHoi, { taoCauMoi, cauTuPublic, xayPayloadCau, kiemTraCau } from './SoanCauHoi.jsx'

// Model form trống (tạo mới)
export function modelMoi() {
  return {
    tieuDe: '',
    header: '',
    footer: '',
    background: '#eeecec',
    thoiGianBatDau: '',
    thoiGianKetThuc: '',
    isActive: true,
    isViewKQ: false,
    isNhapThongTin: false,
    isNhapThongTinRequired: false,
    isTen: false,
    isEmail: false,
    isDienThoai: false,
    isNamSinh: false,
    isDiaChi: false,
    isGioiTinh: false,
    cauHois: [taoCauMoi()],
  }
}

// "2026-07-02T17:00:00" → "2026-07-02T17:00" (giá trị cho input datetime-local)
function catGioLocal(iso) {
  if (!iso) return ''
  return String(iso).slice(0, 16)
}

// Đổ dữ liệu GET /khaosats/:id/public vào model form
export function taoModelTuPublic(d) {
  const m = modelMoi()
  m.tieuDe = d.tieuDe ?? d.phieuKhaoSatTieuDe ?? ''
  m.header = d.header ?? d.phieuKhaoSatHeader ?? ''
  m.footer = d.footer ?? d.phieuKhaoSatFooter ?? ''
  m.background = d.background ?? d.phieuKhaoSatBackground ?? '#eeecec'
  m.thoiGianBatDau = catGioLocal(d.thoiGianBatDau)
  m.thoiGianKetThuc = catGioLocal(d.thoiGianKetThuc)
  m.isActive = !!d.isActive
  m.isViewKQ = !!d.isViewKQ
  m.isNhapThongTin = !!d.isNhapThongTin
  m.isNhapThongTinRequired = !!d.isNhapThongTinRequired
  m.isTen = !!d.isTen
  m.isEmail = !!d.isEmail
  m.isDienThoai = !!d.isDienThoai
  m.isNamSinh = !!d.isNamSinh
  m.isDiaChi = !!d.isDiaChi
  m.isGioiTinh = !!d.isGioiTinh
  const ds = [...(d.cauHois || [])].sort((a, b) => (a.thuTu || 0) - (b.thuTu || 0))
  m.cauHois = ds.length ? ds.map(cauTuPublic) : [taoCauMoi()]
  return m
}

const CO_THONG_TIN = [
  ['isTen', 'Họ tên'],
  ['isEmail', 'Email'],
  ['isDienThoai', 'Điện thoại'],
  ['isNamSinh', 'Năm sinh'],
  ['isDiaChi', 'Địa chỉ (tỉnh/thành)'],
  ['isGioiTinh', 'Giới tính'],
]

// ---------- form builder tạo/sửa khảo sát ----------
// onGui(payload) → Promise<chuỗi thông báo thành công>; ném lỗi (409 giữ nguyên form)
export default function FormKhaoSat({ banDau, dangSua, soPhieu, onGui, onXong, onHuy }) {
  const [m, setM] = useState(() => banDau || modelMoi())
  const [thongBao, setThongBao] = useState(null) // {loai:'loi'|'nhac', noiDung}
  const [dangGui, setDangGui] = useState(false)

  function doi(truong, giaTri) {
    setM((cu) => ({ ...cu, [truong]: giaTri }))
  }
  function doiCau(i, cauMoi) {
    setM((cu) => {
      const ds = cu.cauHois.slice()
      ds[i] = cauMoi
      return { ...cu, cauHois: ds }
    })
  }
  function themCau() {
    setM((cu) => ({ ...cu, cauHois: [...cu.cauHois, taoCauMoi()] }))
  }
  function xoaCau(i) {
    setM((cu) => ({ ...cu, cauHois: cu.cauHois.filter((_, j) => j !== i) }))
  }
  function chuyenCau(i, huong) {
    setM((cu) => {
      const j = i + huong
      if (j < 0 || j >= cu.cauHois.length) return cu
      const ds = cu.cauHois.slice()
      ;[ds[i], ds[j]] = [ds[j], ds[i]]
      return { ...cu, cauHois: ds }
    })
  }

  function xayPayload() {
    return {
      tieuDe: m.tieuDe.trim(),
      header: m.header,
      footer: m.footer,
      background: m.background,
      thoiGianBatDau: m.thoiGianBatDau || null,
      thoiGianKetThuc: m.thoiGianKetThuc || null,
      isActive: !!m.isActive,
      isViewKQ: !!m.isViewKQ,
      isNhapThongTin: !!m.isNhapThongTin,
      isNhapThongTinRequired: m.isNhapThongTin ? !!m.isNhapThongTinRequired : false,
      isTen: m.isNhapThongTin && !!m.isTen,
      isEmail: m.isNhapThongTin && !!m.isEmail,
      isDienThoai: m.isNhapThongTin && !!m.isDienThoai,
      isNamSinh: m.isNhapThongTin && !!m.isNamSinh,
      isDiaChi: m.isNhapThongTin && !!m.isDiaChi,
      isGioiTinh: m.isNhapThongTin && !!m.isGioiTinh,
      cauHois: m.cauHois.map(xayPayloadCau),
    }
  }

  async function gui(e) {
    e.preventDefault()
    if (!m.tieuDe.trim()) {
      setThongBao({ loai: 'loi', noiDung: 'Vui lòng nhập tiêu đề khảo sát.' })
      return
    }
    if (m.cauHois.length === 0) {
      setThongBao({ loai: 'loi', noiDung: 'Khảo sát cần ít nhất một câu hỏi.' })
      return
    }
    for (let i = 0; i < m.cauHois.length; i++) {
      const l = kiemTraCau(m.cauHois[i], `Câu ${i + 1}`)
      if (l) {
        setThongBao({ loai: 'loi', noiDung: l })
        return
      }
    }
    setDangGui(true)
    setThongBao(null)
    try {
      const thongDiep = await onGui(xayPayload())
      onXong(thongDiep)
    } catch (e2) {
      if (e2.status === 401) return // đã bị đăng xuất ở cấp trên
      // 409: đã có phiếu mà đổi câu hỏi — giữ nguyên form để người dùng chỉnh lại
      setThongBao({
        loai: e2.status === 409 ? 'nhac' : 'loi',
        noiDung: e2.message || 'Lưu khảo sát thất bại.',
      })
    } finally {
      setDangGui(false)
    }
  }

  const mauHopLe = /^#[0-9a-fA-F]{6}$/.test(m.background) ? m.background : '#eeecec'

  return (
    <form onSubmit={gui}>
      <div className="the">
        <h2>{dangSua ? 'Sửa khảo sát' : 'Tạo khảo sát mới'}</h2>
        {dangSua && soPhieu > 0 && (
          <div className="hop-thong-bao nhac">
            Khảo sát đã có phiếu — chỉ sửa được thông tin chung.
          </div>
        )}
        {thongBao && <div className={`hop-thong-bao ${thongBao.loai}`}>{thongBao.noiDung}</div>}

        <div className="luoi-form">
          <div className="rong">
            <label className="nhan-form">Tiêu đề *</label>
            <input
              className="o-nhap"
              value={m.tieuDe}
              onChange={(e) => doi('tieuDe', e.target.value)}
              placeholder="Tiêu đề khảo sát"
            />
          </div>
          <div className="rong">
            <label className="nhan-form">Phần mở đầu (header)</label>
            <textarea
              className="vung-nhap"
              value={m.header}
              onChange={(e) => doi('header', e.target.value)}
              placeholder="Lời giới thiệu hiển thị đầu phiếu khảo sát…"
            />
          </div>
          <div className="rong">
            <label className="nhan-form">Phần kết (footer)</label>
            <textarea
              className="vung-nhap vung-nhap-ngan"
              value={m.footer}
              onChange={(e) => doi('footer', e.target.value)}
              placeholder="Lời cảm ơn hiển thị cuối phiếu…"
            />
          </div>
          <div>
            <label className="nhan-form">Màu nền</label>
            <div className="o-mau">
              <input
                type="color"
                value={mauHopLe}
                onChange={(e) => doi('background', e.target.value)}
                title="Chọn màu nền"
              />
              <input
                className="o-nhap"
                value={m.background}
                onChange={(e) => doi('background', e.target.value)}
                placeholder="#eeecec"
              />
            </div>
          </div>
          <div />
          <div>
            <label className="nhan-form">Thời gian bắt đầu</label>
            <input
              type="datetime-local"
              className="o-nhap"
              value={m.thoiGianBatDau}
              onChange={(e) => doi('thoiGianBatDau', e.target.value)}
            />
          </div>
          <div>
            <label className="nhan-form">Thời gian kết thúc</label>
            <input
              type="datetime-local"
              className="o-nhap"
              value={m.thoiGianKetThuc}
              onChange={(e) => doi('thoiGianKetThuc', e.target.value)}
            />
          </div>
          <div className="rong">
            <label className="o-check">
              <input
                type="checkbox"
                checked={m.isActive}
                onChange={(e) => doi('isActive', e.target.checked)}
              />
              Mở nhận trả lời
            </label>
            <label className="o-check">
              <input
                type="checkbox"
                checked={m.isViewKQ}
                onChange={(e) => doi('isViewKQ', e.target.checked)}
              />
              Công khai kết quả
            </label>
            <label className="o-check">
              <input
                type="checkbox"
                checked={m.isNhapThongTin}
                onChange={(e) => doi('isNhapThongTin', e.target.checked)}
              />
              Thu thập thông tin người trả lời
            </label>
          </div>
          {m.isNhapThongTin && (
            <div className="rong">
              <label className="o-check">
                <input
                  type="checkbox"
                  checked={m.isNhapThongTinRequired}
                  onChange={(e) => doi('isNhapThongTinRequired', e.target.checked)}
                />
                <strong>Bắt buộc nhập thông tin</strong>
              </label>
              {CO_THONG_TIN.map(([truong, ten]) => (
                <label className="o-check" key={truong}>
                  <input
                    type="checkbox"
                    checked={m[truong]}
                    onChange={(e) => doi(truong, e.target.checked)}
                  />
                  {ten}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="the">
        <h2>Câu hỏi</h2>
        {m.cauHois.map((c, i) => (
          <SoanCauHoi
            key={c.key}
            cau={c}
            nhan={`Câu ${i + 1}`}
            onDoi={(x) => doiCau(i, x)}
            onLen={() => chuyenCau(i, -1)}
            onXuong={() => chuyenCau(i, 1)}
            onXoa={() => xoaCau(i)}
            lenDuoc={i > 0}
            xuongDuoc={i < m.cauHois.length - 1}
          />
        ))}
        <button type="button" className="nut" onClick={themCau}>
          + Thêm câu hỏi
        </button>
      </div>

      <div className="hang-nut">
        <button type="submit" className="nut nut-chinh" disabled={dangGui}>
          {dangGui ? 'Đang lưu…' : dangSua ? 'Lưu thay đổi' : 'Tạo khảo sát'}
        </button>
        <button type="button" className="nut" onClick={onHuy} disabled={dangGui}>
          Hủy
        </button>
      </div>
    </form>
  )
}
