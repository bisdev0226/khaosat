import { LOAI, NHAP_GIA_TRI } from './loaiCauHoi.js'

// Kiểm tra hợp lệ một phiếu trả lời trước khi ghi nhận.
// cayCauHoi: cây câu hỏi (layCayCauHoi); chiTiets: [{cauHoiId, cauTraLoiId?, isKhac?, noiDung?}]
// Trả về { ok, errors: [{cauHoiId, message}], chiTietHopLe: [...] }
export function kiemTraPhieu(cayCauHoi, chiTiets) {
  const errors = []
  if (!Array.isArray(chiTiets)) return { ok: false, errors: [{ cauHoiId: null, message: 'Thiếu chiTietKetQuas' }], chiTietHopLe: [] }

  // Gom câu hỏi phẳng + ghi nhớ cha (để biết cột hợp lệ của hàng ma trận)
  const cauHoiPhang = new Map()
  const duyet = (ds, cha) => {
    for (const c of ds) {
      cauHoiPhang.set(c.id, { cauHoi: c, cha })
      duyet(c.cauHoiCon || [], c)
    }
  }
  duyet(cayCauHoi, null)

  const theoCauHoi = new Map()
  for (const ct of chiTiets) {
    if (!ct || !ct.cauHoiId || !cauHoiPhang.has(ct.cauHoiId)) {
      errors.push({ cauHoiId: ct?.cauHoiId ?? null, message: 'Câu trả lời không thuộc khảo sát này' })
      continue
    }
    if (!theoCauHoi.has(ct.cauHoiId)) theoCauHoi.set(ct.cauHoiId, [])
    theoCauHoi.get(ct.cauHoiId).push(ct)
  }
  if (errors.length) return { ok: false, errors, chiTietHopLe: [] }

  const chiTietHopLe = []
  const loi = (c, message) => errors.push({ cauHoiId: c.id, message: `"${rutGon(c.noiDung)}": ${message}` })

  for (const { cauHoi: c, cha } of cauHoiPhang.values()) {
    const ma = c.maLoaiCauHoi
    const ds = theoCauHoi.get(c.id) || []

    if (ma === LOAI.NHOM) {
      if (ds.length) loi(c, 'nhóm câu hỏi không nhận câu trả lời trực tiếp')
      continue
    }

    // Hàng của ma trận: phương án hợp lệ là CỘT của câu hỏi cha
    const laHangMaTran = cha && (cha.maLoaiCauHoi === LOAI.MA_TRAN_MOT || cha.maLoaiCauHoi === LOAI.MA_TRAN_NHIEU)
    const phuongAn = laHangMaTran ? cha.cauTraLoi : c.cauTraLoi
    const idPhuongAn = new Set((phuongAn || []).map((a) => a.id))
    const batBuoc = c.isBatBuoc || (laHangMaTran && cha.isBatBuoc)
    const chonMot = ma === LOAI.CHON_MOT || ma === LOAI.YES_NO
      ? !laHangMaTran || cha.maLoaiCauHoi === LOAI.MA_TRAN_MOT
      : false

    if (ma === LOAI.MA_TRAN_MOT || ma === LOAI.MA_TRAN_NHIEU) {
      if (ds.length) loi(c, 'câu hỏi ma trận nhận trả lời theo từng hàng')
      continue
    }

    if (NHAP_GIA_TRI.has(ma)) {
      const giaTri = (ds[0]?.noiDung ?? '').toString().trim()
      if (ds.length > 1) { loi(c, 'chỉ được một giá trị'); continue }
      if (!giaTri) {
        if (batBuoc) loi(c, 'câu hỏi bắt buộc, vui lòng trả lời')
        continue
      }
      if (ma === LOAI.NHAP_SO && Number.isNaN(Number(giaTri))) { loi(c, 'giá trị phải là số'); continue }
      if (ma === LOAI.CHON_NAM) {
        const nam = Number(giaTri)
        if (!Number.isInteger(nam) || nam < 1900 || nam > 2100) { loi(c, 'năm không hợp lệ'); continue }
      }
      if (ma === LOAI.NHAP_TEXT && c.maxLength > 0 && giaTri.length > c.maxLength) {
        loi(c, `tối đa ${c.maxLength} ký tự`); continue
      }
      chiTietHopLe.push({ cauHoiId: c.id, noiDung: giaTri })
      continue
    }

    // Các loại chọn phương án (chọn một / chọn nhiều / yes-no / hàng ma trận)
    const luaChon = []
    let hopLe = true
    for (const ct of ds) {
      if (ct.isKhac) {
        if (!c.isLyDoKhac) { loi(c, 'câu hỏi không có mục "ý kiến khác"'); hopLe = false; break }
        const nd = (ct.noiDung ?? '').toString().trim()
        if (!nd) { loi(c, 'vui lòng nhập nội dung ý kiến khác'); hopLe = false; break }
        luaChon.push({ cauHoiId: c.id, isKhac: true, noiDung: nd })
      } else {
        if (!ct.cauTraLoiId || !idPhuongAn.has(ct.cauTraLoiId)) { loi(c, 'phương án trả lời không hợp lệ'); hopLe = false; break }
        luaChon.push({ cauHoiId: c.id, cauTraLoiId: ct.cauTraLoiId })
      }
    }
    if (!hopLe) continue
    const trung = new Set(luaChon.map((l) => l.cauTraLoiId || 'khac'))
    if (trung.size !== luaChon.length) { loi(c, 'phương án bị trùng lặp'); continue }

    if (chonMot && luaChon.length > 1) { loi(c, 'chỉ được chọn một phương án'); continue }
    if (!luaChon.length) {
      if (batBuoc) loi(c, 'câu hỏi bắt buộc, vui lòng trả lời')
      continue
    }
    if (ma === LOAI.CHON_NHIEU) {
      if (c.soLuongTraLoiMin && luaChon.length < c.soLuongTraLoiMin) { loi(c, `chọn tối thiểu ${c.soLuongTraLoiMin} phương án`); continue }
      if (c.soLuongTraLoiMax && luaChon.length > c.soLuongTraLoiMax) { loi(c, `chọn tối đa ${c.soLuongTraLoiMax} phương án`); continue }
    }
    chiTietHopLe.push(...luaChon)
  }

  return { ok: errors.length === 0, errors, chiTietHopLe }
}

function rutGon(s) {
  return s.length > 60 ? s.slice(0, 57) + '…' : s
}
