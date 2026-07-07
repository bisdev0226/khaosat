// Seed các phiếu khảo sát An toàn thực phẩm (Sở Tư pháp Đắk Lắk):
//  - attp-cbcc.json         : Phiếu số 01 (cán bộ, công chức, viên chức)
//  - attp-nguoi-dan.json    : Phiếu số 02 (người dân, hộ kinh doanh, cơ sở nhỏ lẻ)
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PrismaClient } from '@prisma/client'
import { taoKhaoSat } from '../server/lib/nhapKhaoSat.js'

const prisma = new PrismaClient()
const DATA = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../data')

function doc(ten) {
  return JSON.parse(fs.readFileSync(path.join(DATA, ten), 'utf8'))
}

// Nạp 1 khảo sát nếu chưa tồn tại (idempotent theo id). Trả về true nếu vừa tạo.
async function seedMot(payload, nhan) {
  if (payload.id) {
    const daCo = await prisma.khaoSat.findUnique({ where: { id: payload.id } })
    if (daCo) {
      console.log(`• ${nhan}: đã có, bỏ qua`)
      return false
    }
  }
  const id = await taoKhaoSat(prisma, payload, { giuId: true })
  console.log(`• ${nhan}: đã tạo /khao-sat/${id}`)
  return true
}

async function main() {
  // Hai phiếu An toàn thực phẩm (builder-format)
  for (const [ten, nhan] of [
    ['attp-cbcc.json', 'ATTP 01 — CBCC'],
    ['attp-nguoi-dan.json', 'ATTP 02 — Người dân'],
  ]) {
    const p = doc(ten)
    p.thoiGianKetThuc = p.thoiGianKetThuc || new Date('2030-12-31T23:59:59')
    await seedMot(p, nhan)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
