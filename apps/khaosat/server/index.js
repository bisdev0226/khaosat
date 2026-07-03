import app, { prisma } from './app.js'

const PORT = process.env.PORT || 3000

const server = app.listen(PORT, () => {
  console.log(`Khảo sát server chạy tại http://localhost:${PORT}`)
})

// Đóng gọn gàng khi nhận tín hiệu dừng
async function dungServer(tinHieu) {
  console.log(`Nhận ${tinHieu} — đang dừng server...`)
  server.close(async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
}

process.on('SIGINT', () => dungServer('SIGINT'))
process.on('SIGTERM', () => dungServer('SIGTERM'))
