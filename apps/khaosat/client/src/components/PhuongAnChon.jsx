// Danh sách phương án cho câu chọn một (radio) / chọn nhiều (checkbox), kèm "Ý kiến khác"
// - kieu='radio'   : giaTri = {cauTraLoiId} | {isKhac:true, noiDung}
// - kieu='checkbox': giaTri = mảng các phần tử như trên
export default function PhuongAnChon({ cauHoi, kieu, giaTri, onChange }) {
  const laNhieu = kieu === 'checkbox'
  const dsChon = laNhieu ? (Array.isArray(giaTri) ? giaTri : []) : null
  const max = cauHoi.soLuongTraLoiMax || 0
  const datMax = laNhieu && max > 0 && dsChon.length >= max

  const daChon = (idPA) =>
    laNhieu ? dsChon.some((x) => x.cauTraLoiId === idPA) : giaTri?.cauTraLoiId === idPA
  const khacDaChon = laNhieu ? dsChon.some((x) => x.isKhac) : !!giaTri?.isKhac
  const noiDungKhac = laNhieu
    ? dsChon.find((x) => x.isKhac)?.noiDung || ''
    : giaTri?.noiDung || ''

  function chonPhuongAn(idPA) {
    if (!laNhieu) return onChange({ cauTraLoiId: idPA })
    if (daChon(idPA)) return onChange(dsChon.filter((x) => x.cauTraLoiId !== idPA))
    if (datMax) return // chặn chọn quá số lượng tối đa ngay trên UI
    onChange([...dsChon, { cauTraLoiId: idPA }])
  }

  function chonKhac() {
    if (!laNhieu) return onChange({ isKhac: true, noiDung: noiDungKhac })
    if (khacDaChon) return onChange(dsChon.filter((x) => !x.isKhac))
    if (datMax) return
    onChange([...dsChon, { isKhac: true, noiDung: '' }])
  }

  function nhapKhac(v) {
    if (!laNhieu) return onChange({ isKhac: true, noiDung: v })
    onChange(dsChon.map((x) => (x.isKhac ? { ...x, noiDung: v } : x)))
  }

  return (
    <div className="ds-phuong-an">
      {(cauHoi.cauTraLoi || []).map((pa) => {
        const chon = daChon(pa.id)
        return (
          <label key={pa.id} className={'phuong-an' + (chon ? ' chon' : '')}>
            <input
              type={laNhieu ? 'checkbox' : 'radio'}
              name={cauHoi.id}
              value={pa.id}
              checked={chon}
              disabled={laNhieu && datMax && !chon}
              onChange={() => chonPhuongAn(pa.id)}
            />
            <span>{pa.noiDung}</span>
          </label>
        )
      })}

      {cauHoi.isLyDoKhac && (
        <div>
          <label className={'phuong-an' + (khacDaChon ? ' chon' : '')}>
            <input
              type={laNhieu ? 'checkbox' : 'radio'}
              name={cauHoi.id}
              value="khac"
              checked={khacDaChon}
              disabled={laNhieu && datMax && !khacDaChon}
              onChange={chonKhac}
            />
            <span>Ý kiến khác</span>
          </label>
          {khacDaChon && (
            <div className="o-khac">
              <input
                className="o-nhap"
                value={noiDungKhac}
                placeholder="Nhập ý kiến khác…"
                onChange={(e) => nhapKhac(e.target.value)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
