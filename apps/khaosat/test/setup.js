// globalSetup của vitest: chuẩn bị CSDL test sạch trước khi chạy toàn bộ test.
// LƯU Ý: DATABASE_URL "file:./test.db" là tương đối so với thư mục prisma/ → prisma/test.db
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export default function setup() {
  const goc = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
  // Xoá CSDL test cũ để mỗi lần chạy đều sạch
  for (const f of ['test.db', 'test.db-journal']) {
    fs.rmSync(path.join(goc, 'prisma', f), { force: true })
  }
  execSync('npx prisma db push --skip-generate --accept-data-loss', {
    cwd: goc,
    env: { ...process.env, DATABASE_URL: 'file:./test.db' },
    stdio: 'inherit',
  })
}
