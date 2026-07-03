import { LOAI } from './loaiCauHoi.js'

// [field bật, khóa trong JSON nguoiKhaoSat, tiêu đề cột]
const TRUONG_NGUOI = [
  ['isTen', 'ten', 'Họ tên'],
  ['isEmail', 'email', 'Email'],
  ['isDienThoai', 'dienThoai', 'Điện thoại'],
  ['isNamSinh', 'namSinh', 'Năm sinh'],
  ['isDiaChi', 'diaChi', 'Địa chỉ'],
  ['isGioiTinh', 'gioiTinh', 'Giới tính'],
]

// Bọc giá trị theo chuẩn CSV: có , " hoặc xuống dòng thì bọc nháy kép, nhân đôi nháy kép
function bocCsv(v) {
  const s = v == null ? '' : String(v)
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function dinhDangThoiGian(d) {
  const p = (n) => String(n).padStart(2, '0')
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

// Duyệt cây → danh sách cột (mỗi câu hỏi lá một cột), đánh số "Câu <n>" / "Câu <n>.<hàng>"
function layDanhSachCot(cayCauHoi) {
  const cots = [] // {tieuDe, cauHoiId, maLoaiCauHoi, tenPhuongAn: Map(cauTraLoiId → noiDung)}
  let stt = 0
  const themCot = (tieuDe, cauHoi, phuongAn) => {
    cots.push({
      tieuDe,
      cauHoiId: cauHoi.id,
      maLoaiCauHoi: cauHoi.maLoaiCauHoi,
      tenPhuongAn: new Map((phuongAn || []).map((a) => [a.id, a.noiDung])),
    })
  }
  const duyet = (ds) => {
    for (const c of ds) {
      const ma = c.maLoaiCauHoi
      if (ma === LOAI.NHOM) {
        duyet(c.cauHoiCon || [])
        continue
      }
      if (ma === LOAI.MA_TRAN_MOT || ma === LOAI.MA_TRAN_NHIEU) {
        stt += 1
        let sttHang = 0
        for (const hang of c.cauHoiCon || []) {
          sttHang += 1
          // Hàng ma trận: phương án là cột (cauTraLoi) của câu hỏi cha
          themCot(`Câu ${stt}.${sttHang} — ${hang.noiDung}`, hang, c.cauTraLoi)
        }
        continue
      }
      stt += 1
      themCot(`Câu ${stt} — ${c.noiDung}`, c, c.cauTraLoi)
    }
  }
  duyet(cayCauHoi)
  return cots
}

// Xuất toàn bộ phiếu trả lời của khảo sát thành chuỗi CSV (có BOM cho Excel)
export async function xuatCsv(prisma, khaoSat, cayCauHoi) {
  const cots = layDanhSachCot(cayCauHoi)
  const truongNguoi = khaoSat.isNhapThongTin ? TRUONG_NGUOI.filter(([bat]) => khaoSat[bat]) : []

  const ketQuas = await prisma.ketQua.findMany({
    where: { khaoSatId: khaoSat.id },
    include: { chiTiets: true },
    orderBy: { createdAt: 'asc' },
  })

  const dongs = []
  dongs.push(['STT', 'Thời gian gửi', ...truongNguoi.map(([, , nhan]) => nhan), ...cots.map((c) => c.tieuDe)])

  ketQuas.forEach((kq, i) => {
    const theoCau = new Map()
    for (const ct of kq.chiTiets) {
      if (!theoCau.has(ct.cauHoiId)) theoCau.set(ct.cauHoiId, [])
      theoCau.get(ct.cauHoiId).push(ct)
    }
    let nguoi = {}
    try {
      nguoi = kq.nguoiKhaoSat ? JSON.parse(kq.nguoiKhaoSat) : {}
    } catch {
      nguoi = {}
    }
    const oCauHoi = cots.map((cot) => {
      const ds = theoCau.get(cot.cauHoiId) || []
      return ds
        .map((ct) => {
          if (ct.isKhac) return `Khác: ${ct.noiDung ?? ''}`
          if (ct.cauTraLoiId) return cot.tenPhuongAn.get(ct.cauTraLoiId) ?? ''
          return ct.noiDung ?? ''
        })
        .join('; ')
    })
    dongs.push([
      i + 1,
      dinhDangThoiGian(kq.createdAt),
      ...truongNguoi.map(([, khoa]) => nguoi?.[khoa] ?? ''),
      ...oCauHoi,
    ])
  })

  // BOM để Excel nhận diện UTF-8
  return String.fromCharCode(0xfeff) + dongs.map((d) => d.map(bocCsv).join(',')).join('\r\n')
}
