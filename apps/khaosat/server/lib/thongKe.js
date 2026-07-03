import { LOAI, tenLoai, NHAP_GIA_TRI } from './loaiCauHoi.js'

const LOAI_CHON = new Set([LOAI.CHON_NHIEU, LOAI.CHON_MOT, LOAI.YES_NO])
const LOAI_MA_TRAN = new Set([LOAI.MA_TRAN_NHIEU, LOAI.MA_TRAN_MOT])

// Thống kê toàn khảo sát — gom dữ liệu bằng vài query tổng rồi map trong JS (tránh N+1)
export async function thongKeKhaoSat(prisma, khaoSat, cayCauHoi) {
  const khaoSatId = khaoSat.id
  const thuocKhaoSat = { ketQua: { khaoSatId } } // ChiTietKetQua không có khaoSatId → lọc qua ketQua

  // Phân loại câu hỏi để biết cần query gì
  const idGiaTri = [] // 8, 10, 11, 12
  const idText = [] // 4
  const duyet = (ds) => {
    for (const c of ds) {
      if (c.maLoaiCauHoi === LOAI.NHAP_TEXT) idText.push(c.id)
      else if (NHAP_GIA_TRI.has(c.maLoaiCauHoi)) idGiaTri.push(c.id)
      duyet(c.cauHoiCon || [])
    }
  }
  duyet(cayCauHoi)

  const [tongPhieu, nhomChon, dsKhac, nhomGiaTri, dsText] = await Promise.all([
    prisma.ketQua.count({ where: { khaoSatId } }),
    // Đếm lượt chọn theo (cauHoiId, cauTraLoiId) cho toàn khảo sát
    prisma.chiTietKetQua.groupBy({
      by: ['cauHoiId', 'cauTraLoiId'],
      where: { ...thuocKhaoSat, isKhac: false, cauTraLoiId: { not: null } },
      _count: { _all: true },
    }),
    // Ý kiến khác
    prisma.chiTietKetQua.findMany({
      where: { ...thuocKhaoSat, isKhac: true },
      select: { cauHoiId: true, noiDung: true },
    }),
    // Câu nhập giá trị: đếm theo (cauHoiId, noiDung)
    idGiaTri.length
      ? prisma.chiTietKetQua.groupBy({
          by: ['cauHoiId', 'noiDung'],
          where: { ...thuocKhaoSat, cauHoiId: { in: idGiaTri }, isKhac: false },
          _count: { _all: true },
        })
      : Promise.resolve([]),
    // Câu text: lấy nội dung mới nhất trước
    idText.length
      ? prisma.chiTietKetQua.findMany({
          where: { ...thuocKhaoSat, cauHoiId: { in: idText }, isKhac: false },
          select: { cauHoiId: true, noiDung: true },
          orderBy: { ketQua: { createdAt: 'desc' } },
        })
      : Promise.resolve([]),
  ])

  // Map (cauHoiId|cauTraLoiId) → số lượt chọn
  const demChon = new Map()
  for (const n of nhomChon) demChon.set(`${n.cauHoiId}|${n.cauTraLoiId}`, n._count._all)

  // Map cauHoiId → {soLuong, noiDungs} của "ý kiến khác"
  const khacTheoCau = new Map()
  for (const k of dsKhac) {
    if (!khacTheoCau.has(k.cauHoiId)) khacTheoCau.set(k.cauHoiId, { soLuong: 0, noiDungs: [] })
    const muc = khacTheoCau.get(k.cauHoiId)
    muc.soLuong += 1
    const nd = (k.noiDung ?? '').toString().trim()
    if (nd && muc.noiDungs.length < 50) muc.noiDungs.push(nd)
  }

  // Map cauHoiId → [{giaTri, soLuong}] giảm dần theo soLuong, tối đa 50
  const giaTriTheoCau = new Map()
  for (const n of nhomGiaTri) {
    if (n.noiDung == null || n.noiDung === '') continue
    if (!giaTriTheoCau.has(n.cauHoiId)) giaTriTheoCau.set(n.cauHoiId, [])
    giaTriTheoCau.get(n.cauHoiId).push({ giaTri: n.noiDung, soLuong: n._count._all })
  }
  for (const [id, ds] of giaTriTheoCau) {
    ds.sort((a, b) => b.soLuong - a.soLuong || String(a.giaTri).localeCompare(String(b.giaTri)))
    giaTriTheoCau.set(id, ds.slice(0, 50))
  }

  // Map cauHoiId → [chuỗi] tối đa 100, mới nhất trước
  const textTheoCau = new Map()
  for (const t of dsText) {
    const nd = (t.noiDung ?? '').toString().trim()
    if (!nd) continue
    if (!textTheoCau.has(t.cauHoiId)) textTheoCau.set(t.cauHoiId, [])
    const ds = textTheoCau.get(t.cauHoiId)
    if (ds.length < 100) ds.push(nd)
  }

  const xayCau = (c, cha) => {
    const nut = {
      id: c.id,
      noiDung: c.noiDung,
      maLoaiCauHoi: c.maLoaiCauHoi,
      loaiCauHoi: c.loaiCauHoi || tenLoai(c.maLoaiCauHoi),
      thuTu: c.thuTu,
      cauHoiCon: (c.cauHoiCon || []).map((con) => xayCau(con, c)),
    }
    const ma = c.maLoaiCauHoi
    const laHangMaTran = cha && LOAI_MA_TRAN.has(cha.maLoaiCauHoi)

    if (LOAI_MA_TRAN.has(ma)) {
      // Ma trận cha: chỉ liệt kê cột, thống kê thật nằm trong từng hàng (cauHoiCon)
      nut.phuongAns = (c.cauTraLoi || []).map((a) => ({ id: a.id, noiDung: a.noiDung, soLuong: null }))
    } else if (LOAI_CHON.has(ma) || laHangMaTran) {
      // Hàng của ma trận dùng phương án (cột) của câu hỏi CHA
      const phuongAn = laHangMaTran ? cha.cauTraLoi : c.cauTraLoi
      nut.phuongAns = (phuongAn || []).map((a) => ({
        id: a.id,
        noiDung: a.noiDung,
        soLuong: demChon.get(`${c.id}|${a.id}`) || 0,
      }))
      if (c.isLyDoKhac) {
        const k = khacTheoCau.get(c.id)
        nut.khac = { soLuong: k?.soLuong || 0, noiDungs: k?.noiDungs || [] }
      }
    } else if (ma === LOAI.NHAP_TEXT) {
      nut.vanBans = textTheoCau.get(c.id) || []
    } else if (NHAP_GIA_TRI.has(ma)) {
      nut.giaTris = giaTriTheoCau.get(c.id) || []
    }
    // LOAI.NHOM: chỉ có cauHoiCon
    return nut
  }

  return { tongPhieu, cauHois: cayCauHoi.map((c) => xayCau(c, null)) }
}
