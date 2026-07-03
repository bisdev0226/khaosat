import { LOAI, TEN_LOAI } from '../../constants.js'

// Loại cho câu hỏi gốc: đủ 11 loại; câu con trong nhóm: chỉ 2/3/4/8/10/11/12
const LOAI_GOC = [
  LOAI.CHON_NHIEU,
  LOAI.CHON_MOT,
  LOAI.NHAP_TEXT,
  LOAI.MA_TRAN_NHIEU,
  LOAI.MA_TRAN_MOT,
  LOAI.NHOM,
  LOAI.NHAP_SO,
  LOAI.YES_NO,
  LOAI.CHON_NAM,
  LOAI.CHON_THANH_PHO,
  LOAI.CHON_NGAY,
]
const LOAI_CON = [
  LOAI.CHON_NHIEU,
  LOAI.CHON_MOT,
  LOAI.NHAP_TEXT,
  LOAI.NHAP_SO,
  LOAI.CHON_NAM,
  LOAI.CHON_THANH_PHO,
  LOAI.CHON_NGAY,
]

let demKey = 0

// Model soạn thảo một câu hỏi (trạng thái nội bộ của form builder)
export function taoCauMoi(maLoai = LOAI.CHON_MOT) {
  demKey += 1
  return {
    key: `cau-${Date.now()}-${demKey}`,
    maLoaiCauHoi: maLoai,
    noiDung: '',
    isBatBuoc: false,
    isLyDoKhac: false,
    phuongAnText: '', // loại 2/3 — mỗi dòng một phương án
    minSo: '', // loại 2
    maxSo: '', // loại 2
    hangText: '', // loại 5/6 — mỗi dòng một hàng
    cotText: '', // loại 5/6 — mỗi dòng một cột
    maxLength: '', // loại 4
    cauHoiCon: [], // loại 7
  }
}

function tachDong(s) {
  return String(s || '')
    .split('\n')
    .map((d) => d.trim())
    .filter(Boolean)
}

// Đổ dữ liệu từ GET /khaosats/:id/public vào model soạn thảo
export function cauTuPublic(c) {
  const m = taoCauMoi(c.maLoaiCauHoi || LOAI.CHON_MOT)
  m.noiDung = c.noiDung || ''
  m.isBatBuoc = !!c.isBatBuoc
  m.isLyDoKhac = !!c.isLyDoKhac
  const loai = m.maLoaiCauHoi
  const traLoi = [...(c.cauTraLoi || [])].sort((a, b) => (a.thuTu || 0) - (b.thuTu || 0))
  const con = [...(c.cauHoiCon || [])].sort((a, b) => (a.thuTu || 0) - (b.thuTu || 0))

  if (loai === LOAI.CHON_NHIEU || loai === LOAI.CHON_MOT) {
    // phương án object {noiDung} → mỗi dòng một phương án
    m.phuongAnText = traLoi
      .map((t) => (typeof t === 'string' ? t : t.noiDung || ''))
      .filter(Boolean)
      .join('\n')
    if (loai === LOAI.CHON_NHIEU) {
      m.minSo = c.soLuongTraLoiMin != null ? String(c.soLuongTraLoiMin) : ''
      m.maxSo = c.soLuongTraLoiMax != null ? String(c.soLuongTraLoiMax) : ''
    }
  } else if (loai === LOAI.MA_TRAN_NHIEU || loai === LOAI.MA_TRAN_MOT) {
    // ma trận: cauTraLoi của cha → dòng cột; cauHoiCon → dòng hàng
    m.cotText = traLoi
      .map((t) => (typeof t === 'string' ? t : t.noiDung || ''))
      .filter(Boolean)
      .join('\n')
    m.hangText = con.map((h) => h.noiDung || '').filter(Boolean).join('\n')
  } else if (loai === LOAI.NHOM) {
    m.cauHoiCon = con.map(cauTuPublic)
  } else if (loai === LOAI.NHAP_TEXT) {
    m.maxLength = c.maxLength > 0 ? String(c.maxLength) : ''
  }
  return m
}

// Model soạn thảo → payload câu hỏi theo hợp đồng API
export function xayPayloadCau(c) {
  const loai = Number(c.maLoaiCauHoi)
  const cau = { noiDung: c.noiDung.trim(), maLoaiCauHoi: loai, isBatBuoc: !!c.isBatBuoc }

  if (loai === LOAI.CHON_NHIEU || loai === LOAI.CHON_MOT) {
    cau.cauTraLoi = tachDong(c.phuongAnText)
    cau.isLyDoKhac = !!c.isLyDoKhac
    if (loai === LOAI.CHON_NHIEU) {
      if (c.minSo !== '') cau.soLuongTraLoiMin = Number(c.minSo)
      if (c.maxSo !== '') cau.soLuongTraLoiMax = Number(c.maxSo)
    }
  } else if (loai === LOAI.MA_TRAN_NHIEU || loai === LOAI.MA_TRAN_MOT) {
    // cột → cauTraLoi của cha; hàng → cauHoiCon loại 3 không phương án
    cau.cauTraLoi = tachDong(c.cotText)
    cau.cauHoiCon = tachDong(c.hangText).map((hang) => ({
      noiDung: hang,
      maLoaiCauHoi: LOAI.CHON_MOT,
      cauTraLoi: [],
    }))
  } else if (loai === LOAI.NHOM) {
    cau.cauHoiCon = (c.cauHoiCon || []).map(xayPayloadCau)
  } else if (loai === LOAI.NHAP_TEXT) {
    if (c.maxLength !== '' && Number(c.maxLength) > 0) cau.maxLength = Number(c.maxLength)
  }
  return cau
}

// Kiểm tra model trước khi gửi — trả về chuỗi lỗi hoặc null
export function kiemTraCau(c, nhan) {
  if (!c.noiDung.trim()) return `${nhan}: chưa nhập nội dung câu hỏi.`
  const loai = Number(c.maLoaiCauHoi)
  if (
    (loai === LOAI.CHON_NHIEU || loai === LOAI.CHON_MOT) &&
    tachDong(c.phuongAnText).length === 0 &&
    !c.isLyDoKhac
  ) {
    return `${nhan}: cần ít nhất một phương án trả lời.`
  }
  if (loai === LOAI.CHON_NHIEU && c.minSo !== '' && c.maxSo !== '' && Number(c.minSo) > Number(c.maxSo)) {
    return `${nhan}: "chọn tối thiểu" không được lớn hơn "chọn tối đa".`
  }
  if (loai === LOAI.MA_TRAN_NHIEU || loai === LOAI.MA_TRAN_MOT) {
    if (tachDong(c.hangText).length === 0) return `${nhan}: ma trận cần ít nhất một hàng.`
    if (tachDong(c.cotText).length === 0) return `${nhan}: ma trận cần ít nhất một cột.`
  }
  if (loai === LOAI.NHOM) {
    if ((c.cauHoiCon || []).length === 0) return `${nhan}: nhóm cần ít nhất một câu hỏi con.`
    for (let i = 0; i < c.cauHoiCon.length; i++) {
      const l = kiemTraCau(c.cauHoiCon[i], `${nhan} — câu con ${i + 1}`)
      if (l) return l
    }
  }
  return null
}

// ---------- component soạn một câu hỏi (đệ quy cho nhóm) ----------
export default function SoanCauHoi({ cau, nhan, laCon, onDoi, onLen, onXuong, onXoa, lenDuoc, xuongDuoc }) {
  const loai = Number(cau.maLoaiCauHoi)
  let dsLoai = laCon ? LOAI_CON : LOAI_GOC
  if (!dsLoai.includes(loai)) dsLoai = [...dsLoai, loai] // dữ liệu cũ có loại ngoài danh sách

  function doi(truong, giaTri) {
    onDoi({ ...cau, [truong]: giaTri })
  }

  function doiCon(i, cauCon) {
    const ds = cau.cauHoiCon.slice()
    ds[i] = cauCon
    doi('cauHoiCon', ds)
  }
  function themCon() {
    doi('cauHoiCon', [...(cau.cauHoiCon || []), taoCauMoi()])
  }
  function xoaCon(i) {
    doi('cauHoiCon', cau.cauHoiCon.filter((_, j) => j !== i))
  }
  function chuyenCon(i, huong) {
    const j = i + huong
    if (j < 0 || j >= cau.cauHoiCon.length) return
    const ds = cau.cauHoiCon.slice()
    ;[ds[i], ds[j]] = [ds[j], ds[i]]
    doi('cauHoiCon', ds)
  }

  return (
    <div className="khoi-cau-hoi">
      <div className="dau-khoi">
        <strong>{nhan}</strong>
        <select
          className="o-chon"
          value={loai}
          onChange={(e) => doi('maLoaiCauHoi', Number(e.target.value))}
        >
          {dsLoai.map((ma) => (
            <option key={ma} value={ma}>
              {TEN_LOAI[ma] || `Loại ${ma}`}
            </option>
          ))}
        </select>
        <span className="day-phai">
          <button type="button" className="nut nut-nho" onClick={onLen} disabled={!lenDuoc} title="Chuyển lên">
            ↑
          </button>
          <button type="button" className="nut nut-nho" onClick={onXuong} disabled={!xuongDuoc} title="Chuyển xuống">
            ↓
          </button>
          <button type="button" className="nut nut-nho nut-nguy-hiem" onClick={onXoa}>
            Xóa
          </button>
        </span>
      </div>

      <label className="nhan-form">Nội dung câu hỏi</label>
      <textarea
        className="vung-nhap vung-nhap-ngan"
        value={cau.noiDung}
        onChange={(e) => doi('noiDung', e.target.value)}
        placeholder="Nhập nội dung câu hỏi…"
      />
      <div className="cach-tren-nho">
        <label className="o-check">
          <input
            type="checkbox"
            checked={cau.isBatBuoc}
            onChange={(e) => doi('isBatBuoc', e.target.checked)}
          />
          Bắt buộc trả lời
        </label>
      </div>

      {(loai === LOAI.CHON_NHIEU || loai === LOAI.CHON_MOT) && (
        <div className="cach-tren-nho">
          <label className="nhan-form">Phương án trả lời (mỗi dòng một phương án)</label>
          <textarea
            className="vung-nhap vung-nhap-ngan"
            value={cau.phuongAnText}
            onChange={(e) => doi('phuongAnText', e.target.value)}
            placeholder={'Phương án 1\nPhương án 2\n…'}
          />
          <div className="cach-tren-nho">
            <label className="o-check">
              <input
                type="checkbox"
                checked={cau.isLyDoKhac}
                onChange={(e) => doi('isLyDoKhac', e.target.checked)}
              />
              Có mục "Ý kiến khác"
            </label>
          </div>
          {loai === LOAI.CHON_NHIEU && (
            <div className="hang-so">
              <label>
                Chọn tối thiểu{' '}
                <input
                  type="number"
                  min="0"
                  className="o-nhap o-so"
                  value={cau.minSo}
                  onChange={(e) => doi('minSo', e.target.value)}
                />
              </label>
              <label>
                Chọn tối đa{' '}
                <input
                  type="number"
                  min="0"
                  className="o-nhap o-so"
                  value={cau.maxSo}
                  onChange={(e) => doi('maxSo', e.target.value)}
                />
              </label>
              <span className="ghi-chu">Để trống nếu không giới hạn.</span>
            </div>
          )}
        </div>
      )}

      {(loai === LOAI.MA_TRAN_NHIEU || loai === LOAI.MA_TRAN_MOT) && (
        <div className="luoi-form cach-tren-nho">
          <div>
            <label className="nhan-form">Các hàng (mỗi dòng một hàng)</label>
            <textarea
              className="vung-nhap vung-nhap-ngan"
              value={cau.hangText}
              onChange={(e) => doi('hangText', e.target.value)}
              placeholder={'Hàng 1\nHàng 2\n…'}
            />
          </div>
          <div>
            <label className="nhan-form">Các cột (mỗi dòng một cột)</label>
            <textarea
              className="vung-nhap vung-nhap-ngan"
              value={cau.cotText}
              onChange={(e) => doi('cotText', e.target.value)}
              placeholder={'Cột 1\nCột 2\n…'}
            />
          </div>
          <div className="ghi-chu rong">
            Mỗi hàng là một mục cần đánh giá; mỗi cột là một mức trả lời chung cho các hàng.
          </div>
        </div>
      )}

      {loai === LOAI.NHAP_TEXT && (
        <div className="hang-so">
          <label>
            Độ dài tối đa (ký tự){' '}
            <input
              type="number"
              min="1"
              className="o-nhap o-so"
              value={cau.maxLength}
              onChange={(e) => doi('maxLength', e.target.value)}
            />
          </label>
          <span className="ghi-chu">Để trống nếu không giới hạn.</span>
        </div>
      )}

      {loai === LOAI.NHOM && (
        <div className="nhom-con cach-tren-nho">
          {(cau.cauHoiCon || []).map((con, i) => (
            <SoanCauHoi
              key={con.key}
              cau={con}
              nhan={`Câu con ${i + 1}`}
              laCon
              onDoi={(m) => doiCon(i, m)}
              onLen={() => chuyenCon(i, -1)}
              onXuong={() => chuyenCon(i, 1)}
              onXoa={() => xoaCon(i)}
              lenDuoc={i > 0}
              xuongDuoc={i < cau.cauHoiCon.length - 1}
            />
          ))}
          <button type="button" className="nut nut-nho" onClick={themCon}>
            + Thêm câu hỏi con
          </button>
        </div>
      )}

      {loai === LOAI.NHAP_SO && <div className="ghi-chu cach-tren-nho">Người trả lời sẽ nhập một con số.</div>}
      {loai === LOAI.YES_NO && <div className="ghi-chu cach-tren-nho">Người trả lời chọn Có hoặc Không.</div>}
      {loai === LOAI.CHON_NAM && <div className="ghi-chu cach-tren-nho">Người trả lời chọn một năm.</div>}
      {loai === LOAI.CHON_THANH_PHO && (
        <div className="ghi-chu cach-tren-nho">Người trả lời chọn một tỉnh/thành phố.</div>
      )}
      {loai === LOAI.CHON_NGAY && <div className="ghi-chu cach-tren-nho">Người trả lời chọn một ngày.</div>}
    </div>
  )
}
