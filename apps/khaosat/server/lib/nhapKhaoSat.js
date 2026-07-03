import { LOAI, maLoai } from './loaiCauHoi.js'

// Chuyển giá trị ngày (string ISO hoặc Date) về Date | null
function veNgay(v) {
  if (!v) return null
  return v instanceof Date ? v : new Date(v)
}

// Tạo đệ quy danh sách câu hỏi (dùng chung cho taoKhaoSat và PUT cập nhật câu hỏi)
export async function taoCauHois(tx, khaoSatId, cauHois, cauHoiChaId = null, giuId = false) {
  for (let i = 0; i < cauHois.length; i++) {
    const ch = cauHois[i]
    const ma = maLoai(ch)

    let cauTraLoi = (ch.cauTraLoi || []).map((a, j) => {
      if (typeof a === 'string') return { noiDung: a, thuTu: j + 1 }
      return {
        ...(giuId && a.id ? { id: a.id } : {}),
        noiDung: a.noiDung,
        thuTu: a.thuTu ?? j + 1,
      }
    })
    // YES_NO không khai báo phương án → tự tạo Có / Không
    if (ma === LOAI.YES_NO && cauTraLoi.length === 0) {
      cauTraLoi = [
        { noiDung: 'Có', thuTu: 1 },
        { noiDung: 'Không', thuTu: 2 },
      ]
    }

    const tao = await tx.cauHoi.create({
      data: {
        ...(giuId && ch.id ? { id: ch.id } : {}),
        khaoSatId,
        cauHoiChaId,
        noiDung: ch.noiDung,
        maLoaiCauHoi: ma,
        isBatBuoc: ch.isBatBuoc ?? false,
        isLyDoKhac: ch.isLyDoKhac ?? false,
        thuTu: ch.thuTu ?? i + 1,
        soLuongTraLoiMin: ch.soLuongTraLoiMin ?? null,
        soLuongTraLoiMax: ch.soLuongTraLoiMax ?? null,
        maxLength: ch.maxLength ?? null,
        ...(cauTraLoi.length ? { cauTraLoi: { create: cauTraLoi } } : {}),
      },
    })

    if (ch.cauHoiCon?.length) {
      await taoCauHois(tx, khaoSatId, ch.cauHoiCon, tao.id, giuId)
    }
  }
}

// Tạo khảo sát từ payload dạng builder — trả về id khảo sát
export async function taoKhaoSat(prisma, payload, { giuId = false } = {}) {
  return prisma.$transaction(
    async (tx) => {
      const ks = await tx.khaoSat.create({
        data: {
          ...(giuId && payload.id ? { id: payload.id } : {}),
          tieuDe: payload.tieuDe,
          header: payload.header ?? null,
          footer: payload.footer ?? null,
          logo: payload.logo ?? null,
          ...(payload.background != null ? { background: payload.background } : {}),
          thoiGianBatDau: veNgay(payload.thoiGianBatDau),
          thoiGianKetThuc: veNgay(payload.thoiGianKetThuc),
          isActive: payload.isActive ?? true,
          isViewKQ: payload.isViewKQ ?? false,
          isNhapThongTin: payload.isNhapThongTin ?? false,
          isNhapThongTinRequired: payload.isNhapThongTinRequired ?? false,
          isTen: payload.isTen ?? false,
          isEmail: payload.isEmail ?? false,
          isDienThoai: payload.isDienThoai ?? false,
          isNamSinh: payload.isNamSinh ?? false,
          isDiaChi: payload.isDiaChi ?? false,
          isGioiTinh: payload.isGioiTinh ?? false,
        },
      })
      await taoCauHois(tx, ks.id, payload.cauHois || [], null, giuId)
      return ks.id
    },
    { timeout: 30000 }
  )
}

// Chuẩn hoá đệ quy câu hỏi của JSON hệ thống tham chiếu — bỏ câu hỏi isActive === false
function chuanHoaCauHois(ds) {
  return (ds || [])
    .filter((c) => c.isActive !== false)
    .map((c) => ({
      id: c.id,
      noiDung: c.noiDung,
      maLoaiCauHoi: maLoai(c),
      isBatBuoc: c.isBatBuoc ?? false,
      isLyDoKhac: c.isLyDoKhac ?? false,
      thuTu: c.thuTu,
      soLuongTraLoiMin: c.soLuongTraLoiMin ?? null,
      soLuongTraLoiMax: c.soLuongTraLoiMax ?? null,
      maxLength: c.maxLength ?? null,
      cauTraLoi: (c.cauTraLoi || []).map((a) => ({ id: a.id, noiDung: a.noiDung, thuTu: a.thuTu })),
      cauHoiCon: chuanHoaCauHois(c.cauHoiCon),
    }))
}

// Nhận JSON format hệ thống tham chiếu ({data:{...}} hoặc {...}) → payload cho taoKhaoSat
export function chuanHoaThamChieu(json) {
  const d = json?.data ?? json ?? {}
  return {
    id: d.id,
    tieuDe: d.phieuKhaoSatTieuDe,
    header: d.phieuKhaoSatHeader,
    footer: d.phieuKhaoSatFooter,
    logo: d.phieuKhaoSatLogo,
    background: d.phieuKhaoSatBackground,
    thoiGianBatDau: d.thoiGianBatDau ? new Date(d.thoiGianBatDau) : null,
    thoiGianKetThuc: d.thoiGianKetThuc ? new Date(d.thoiGianKetThuc) : null,
    isActive: d.isActive ?? true,
    isViewKQ: d.isViewKQ ?? false,
    isNhapThongTin: d.isNhapThongTin ?? false,
    isNhapThongTinRequired: d.isNhapThongTinRequired ?? false,
    isTen: d.isTen ?? false,
    isEmail: d.isEmail ?? false,
    isDienThoai: d.isDienThoai ?? false,
    isNamSinh: d.isNamSinh ?? false,
    isDiaChi: d.isDiaChi ?? false,
    isGioiTinh: d.isGioiTinh ?? false,
    cauHois: chuanHoaCauHois(d.cauHois),
  }
}
