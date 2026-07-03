import { tenLoai } from './loaiCauHoi.js'

// Nạp toàn bộ câu hỏi của một khảo sát rồi dựng cây cha–con (mọi độ sâu)
export async function layCayCauHoi(prisma, khaoSatId) {
  const cauHois = await prisma.cauHoi.findMany({
    where: { khaoSatId },
    include: { cauTraLoi: { orderBy: { thuTu: 'asc' } } },
    orderBy: { thuTu: 'asc' },
  })
  const theoId = new Map(cauHois.map((c) => [c.id, { ...c, loaiCauHoi: tenLoai(c.maLoaiCauHoi), cauHoiCon: [] }]))
  const goc = []
  for (const c of theoId.values()) {
    if (c.cauHoiChaId && theoId.has(c.cauHoiChaId)) theoId.get(c.cauHoiChaId).cauHoiCon.push(c)
    else goc.push(c)
  }
  const sapXep = (ds) => {
    ds.sort((a, b) => a.thuTu - b.thuTu)
    ds.forEach((c) => sapXep(c.cauHoiCon))
  }
  sapXep(goc)
  return goc
}

export function trangThaiKhaoSat(khaoSat, now = new Date()) {
  if (!khaoSat.isActive) return 'khoa'
  if (khaoSat.thoiGianBatDau && now < khaoSat.thoiGianBatDau) return 'chua-mo'
  if (khaoSat.thoiGianKetThuc && now > khaoSat.thoiGianKetThuc) return 'da-dong'
  return 'dang-mo'
}

export function khaoSatCongKhai(khaoSat, cauHois) {
  return {
    id: khaoSat.id,
    tieuDe: khaoSat.tieuDe,
    header: khaoSat.header,
    footer: khaoSat.footer,
    logo: khaoSat.logo,
    background: khaoSat.background,
    thoiGianBatDau: khaoSat.thoiGianBatDau,
    thoiGianKetThuc: khaoSat.thoiGianKetThuc,
    isActive: khaoSat.isActive,
    isViewKQ: khaoSat.isViewKQ,
    isNhapThongTin: khaoSat.isNhapThongTin,
    isNhapThongTinRequired: khaoSat.isNhapThongTinRequired,
    isTen: khaoSat.isTen,
    isEmail: khaoSat.isEmail,
    isDienThoai: khaoSat.isDienThoai,
    isNamSinh: khaoSat.isNamSinh,
    isDiaChi: khaoSat.isDiaChi,
    isGioiTinh: khaoSat.isGioiTinh,
    trangThai: trangThaiKhaoSat(khaoSat),
    cauHois,
  }
}
