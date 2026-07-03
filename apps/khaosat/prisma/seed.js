// Seed khảo sát mẫu từ JSON hệ thống tham chiếu (data/khao-sat-nq57.json)
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PrismaClient } from '@prisma/client'
import { taoKhaoSat, chuanHoaThamChieu } from '../server/lib/nhapKhaoSat.js'

const prisma = new PrismaClient()

async function main() {
  const duongDan = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../data/khao-sat-nq57.json')
  const json = JSON.parse(fs.readFileSync(duongDan, 'utf8'))

  const payload = chuanHoaThamChieu(json)
  // Ghi đè để khảo sát mẫu luôn dùng được ngay
  payload.isActive = true
  payload.isViewKQ = true
  payload.thoiGianKetThuc = new Date('2030-12-31T23:59:59')

  if (payload.id) {
    const daCo = await prisma.khaoSat.findUnique({ where: { id: payload.id } })
    if (daCo) {
      console.log('Đã seed trước đó, bỏ qua')
      return
    }
  }

  const id = await taoKhaoSat(prisma, payload, { giuId: true })
  console.log(`Đã seed khảo sát mẫu: /khao-sat/${id}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
