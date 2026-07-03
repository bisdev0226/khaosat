// Mã loại câu hỏi — giữ tương thích với hệ thống tham chiếu (maLoaiCauHoi)
export const LOAI = {
  CHON_NHIEU: 2,
  CHON_MOT: 3,
  NHAP_TEXT: 4,
  MA_TRAN_NHIEU: 5,
  MA_TRAN_MOT: 6,
  NHOM: 7,
  NHAP_SO: 8,
  YES_NO: 9,
  CHON_NAM: 10,
  CHON_THANH_PHO: 11,
  CHON_NGAY: 12,
}

export const TEN_LOAI = {
  [LOAI.CHON_NHIEU]: 'Câu hỏi chọn nhiều ( MultiChoice )',
  [LOAI.CHON_MOT]: 'Câu hỏi chọn một ( OneChoice )',
  [LOAI.NHAP_TEXT]: 'Câu hỏi nhập text',
  [LOAI.MA_TRAN_NHIEU]: 'Câu hỏi ma trận chọn nhiều ( MultiChoice Group )',
  [LOAI.MA_TRAN_MOT]: 'Câu hỏi ma trận chọn một ( OneChoice Group )',
  [LOAI.NHOM]: 'Nhóm câu hỏi',
  [LOAI.NHAP_SO]: 'Câu hỏi nhập số',
  [LOAI.YES_NO]: 'Câu hỏi YES / NO',
  [LOAI.CHON_NAM]: 'Câu hỏi chọn năm',
  [LOAI.CHON_THANH_PHO]: 'Câu hỏi chọn thành phố',
  [LOAI.CHON_NGAY]: 'Câu hỏi chọn ngày',
}

const NHAN_SANG_MA = Object.fromEntries(
  Object.entries(TEN_LOAI).map(([ma, ten]) => [ten, Number(ma)])
)

export function tenLoai(ma) {
  return TEN_LOAI[ma] || `Loại ${ma}`
}

// Nhận cả nhãn tiếng Việt (JSON của hệ thống tham chiếu) lẫn mã số
export function maLoai(cauHoi) {
  if (typeof cauHoi.maLoaiCauHoi === 'number' && cauHoi.maLoaiCauHoi > 0) return cauHoi.maLoaiCauHoi
  if (cauHoi.loaiCauHoi && NHAN_SANG_MA[cauHoi.loaiCauHoi]) return NHAN_SANG_MA[cauHoi.loaiCauHoi]
  return LOAI.CHON_MOT
}

// Các loại có phương án trả lời cố định
export const CO_PHUONG_AN = new Set([LOAI.CHON_NHIEU, LOAI.CHON_MOT, LOAI.MA_TRAN_NHIEU, LOAI.MA_TRAN_MOT, LOAI.YES_NO])
// Các loại nhập giá trị tự do
export const NHAP_GIA_TRI = new Set([LOAI.NHAP_TEXT, LOAI.NHAP_SO, LOAI.CHON_NAM, LOAI.CHON_THANH_PHO, LOAI.CHON_NGAY])
