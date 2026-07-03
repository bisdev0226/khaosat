// LƯU Ý: globalSetup không chia sẻ process.env với worker → phải đặt DATABASE_URL
// TRƯỚC khi nạp app.js (import động bên dưới, vì import tĩnh bị hoisting).
process.env.DATABASE_URL = 'file:./test.db'
process.env.ADMIN_KEY = 'khaosat-admin'

import { describe, it, expect, beforeAll, afterAll } from 'vitest'

const { default: request } = await import('supertest')
const { default: app, prisma } = await import('../server/app.js')
const { taoKhaoSat } = await import('../server/lib/nhapKhaoSat.js')
const { layCayCauHoi } = await import('../server/lib/khaoSat.js')
const { LOAI } = await import('../server/lib/loaiCauHoi.js')

describe('API khảo sát', () => {
  let khaoSatId
  let cauChon // câu chọn một bắt buộc (2 phương án)
  let cauText // câu nhập text không bắt buộc

  beforeAll(async () => {
    khaoSatId = await taoKhaoSat(prisma, {
      tieuDe: 'Khảo sát kiểm thử',
      isActive: true,
      cauHois: [
        {
          noiDung: 'Bạn có hài lòng với dịch vụ không?',
          maLoaiCauHoi: LOAI.CHON_MOT,
          isBatBuoc: true,
          cauTraLoi: ['Hài lòng', 'Không hài lòng'],
        },
        { noiDung: 'Góp ý thêm của bạn', maLoaiCauHoi: LOAI.NHAP_TEXT },
      ],
    })
    const cay = await layCayCauHoi(prisma, khaoSatId)
    cauChon = cay.find((c) => c.maLoaiCauHoi === LOAI.CHON_MOT)
    cauText = cay.find((c) => c.maLoaiCauHoi === LOAI.NHAP_TEXT)
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  it('GET /health trả 200', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
  })

  it('GET /api/v1/khaosats/:id/public trả đúng cấu trúc', async () => {
    const res = await request(app).get(`/api/v1/khaosats/${khaoSatId}/public`)
    expect(res.status).toBe(200)
    expect(res.body.data.id).toBe(khaoSatId)
    expect(res.body.data.trangThai).toBe('dang-mo')
    expect(res.body.data.cauHois.length).toBe(2)
    const chon = res.body.data.cauHois.find((c) => c.maLoaiCauHoi === LOAI.CHON_MOT)
    expect(chon.cauTraLoi.length).toBe(2)
  })

  it('POST phiếu hợp lệ → 200 và đếm KetQua = 1', async () => {
    const res = await request(app)
      .post('/api/v1/ketquakhaosats/public')
      .send({
        khaoSatId,
        chiTietKetQuas: [
          { cauHoiId: cauChon.id, cauTraLoiId: cauChon.cauTraLoi[0].id },
          { cauHoiId: cauText.id, noiDung: 'Rất tốt' },
        ],
      })
    expect(res.status).toBe(200)
    expect(res.body.data.id).toBeTruthy()
    const dem = await prisma.ketQua.count({ where: { khaoSatId } })
    expect(dem).toBe(1)
  })

  it('POST thiếu câu bắt buộc → 400 có errors', async () => {
    const res = await request(app)
      .post('/api/v1/ketquakhaosats/public')
      .send({ khaoSatId, chiTietKetQuas: [] })
    expect(res.status).toBe(400)
    expect(Array.isArray(res.body.errors)).toBe(true)
    expect(res.body.errors.length).toBeGreaterThan(0)
  })

  it('GET /api/v1/admin/khaosats: không key → 401, đúng key → 200', async () => {
    const khongKey = await request(app).get('/api/v1/admin/khaosats')
    expect(khongKey.status).toBe(401)

    const dungKey = await request(app)
      .get('/api/v1/admin/khaosats')
      .set('x-admin-key', 'khaosat-admin')
    expect(dungKey.status).toBe(200)
    expect(Array.isArray(dungKey.body.data)).toBe(true)
  })
})
