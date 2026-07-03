import { Router } from 'express'
import { prisma } from '../app.js'
import { layCayCauHoi, trangThaiKhaoSat, khaoSatCongKhai } from '../lib/khaoSat.js'
import { kiemTraPhieu } from '../lib/kiemTraPhieu.js'
import { thongKeKhaoSat } from '../lib/thongKe.js'

const router = Router()

// Express 4 không tự bắt lỗi async → bọc handler
const xuLy = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

const layAdminKey = () => process.env.ADMIN_KEY || 'khaosat-admin'

// [field bật, khóa dữ liệu, tên trường trong thông báo]
const TRUONG_NGUOI = [
  ['isTen', 'ten', 'họ tên'],
  ['isEmail', 'email', 'email'],
  ['isDienThoai', 'dienThoai', 'số điện thoại'],
  ['isNamSinh', 'namSinh', 'năm sinh'],
  ['isDiaChi', 'diaChi', 'địa chỉ'],
  ['isGioiTinh', 'gioiTinh', 'giới tính'],
]

// Danh sách khảo sát đang bật
router.get(
  '/khaosats',
  xuLy(async (req, res) => {
    const ds = await prisma.khaoSat.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    })
    res.json({
      data: ds.map((k) => ({
        id: k.id,
        tieuDe: k.tieuDe,
        thoiGianBatDau: k.thoiGianBatDau,
        thoiGianKetThuc: k.thoiGianKetThuc,
        isViewKQ: k.isViewKQ,
        trangThai: trangThaiKhaoSat(k),
      })),
    })
  })
)

// Nội dung công khai của một khảo sát (kèm cây câu hỏi)
router.get(
  '/khaosats/:id/public',
  xuLy(async (req, res) => {
    const khaoSat = await prisma.khaoSat.findUnique({ where: { id: req.params.id } })
    if (!khaoSat) return res.status(404).json({ message: 'Không tìm thấy khảo sát' })
    const cay = await layCayCauHoi(prisma, khaoSat.id)
    res.json({ data: khaoSatCongKhai(khaoSat, cay) })
  })
)

// Gửi phiếu trả lời
router.post(
  '/ketquakhaosats/public',
  xuLy(async (req, res) => {
    const { khaoSatId, chiTietKetQuas, nguoiKhaoSat } = req.body || {}
    const khaoSat = khaoSatId
      ? await prisma.khaoSat.findUnique({ where: { id: khaoSatId } })
      : null
    if (!khaoSat) return res.status(404).json({ message: 'Không tìm thấy khảo sát' })

    const trangThai = trangThaiKhaoSat(khaoSat)
    if (trangThai !== 'dang-mo') {
      const thongBao = {
        'chua-mo': 'Khảo sát chưa mở',
        'da-dong': 'Khảo sát đã kết thúc',
        khoa: 'Khảo sát đang khóa',
      }
      return res.status(403).json({ message: thongBao[trangThai] || 'Khảo sát không nhận phiếu trả lời' })
    }

    const cay = await layCayCauHoi(prisma, khaoSat.id)
    const { ok, errors, chiTietHopLe } = kiemTraPhieu(cay, chiTietKetQuas)
    if (!ok) return res.status(400).json({ message: 'Phiếu trả lời chưa hợp lệ', errors })

    // Thông tin người trả lời: chỉ giữ các trường được bật
    let thongTinNguoi = null
    if (khaoSat.isNhapThongTin) {
      const nguon = nguoiKhaoSat || {}
      const loc = {}
      const thieu = []
      for (const [bat, khoa, nhan] of TRUONG_NGUOI) {
        if (!khaoSat[bat]) continue
        const giaTri = (nguon[khoa] ?? '').toString().trim()
        if (giaTri) loc[khoa] = giaTri
        else if (khaoSat.isNhapThongTinRequired) thieu.push({ cauHoiId: null, message: `Vui lòng nhập ${nhan}` })
      }
      if (thieu.length) {
        return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin người trả lời', errors: thieu })
      }
      if (Object.keys(loc).length) thongTinNguoi = JSON.stringify(loc)
    }

    const ketQua = await prisma.ketQua.create({
      data: {
        khaoSatId: khaoSat.id,
        nguoiKhaoSat: thongTinNguoi,
        chiTiets: { create: chiTietHopLe },
      },
    })
    res.json({ data: { id: ketQua.id }, message: 'Ghi nhận phiếu trả lời thành công' })
  })
)

// Kết quả thống kê — công khai khi isViewKQ, hoặc có khóa quản trị
router.get(
  '/khaosats/:id/thongke',
  xuLy(async (req, res) => {
    const khaoSat = await prisma.khaoSat.findUnique({ where: { id: req.params.id } })
    if (!khaoSat) return res.status(404).json({ message: 'Không tìm thấy khảo sát' })
    if (!khaoSat.isViewKQ && req.headers['x-admin-key'] !== layAdminKey()) {
      return res.status(403).json({ message: 'Kết quả khảo sát không công khai' })
    }
    const cay = await layCayCauHoi(prisma, khaoSat.id)
    const thongKe = await thongKeKhaoSat(prisma, khaoSat, cay)
    res.json({ data: { tieuDe: khaoSat.tieuDe, ...thongKe } })
  })
)

export default router
