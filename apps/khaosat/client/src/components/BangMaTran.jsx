// Bảng ma trận (loại 5 chọn nhiều / 6 chọn một)
// - Mỗi hàng là một câu hỏi con, các cột là cauTraLoi của CÂU CHA
// - State dùng id CÂU CON làm key: 6 → {cauTraLoiId}, 5 → mảng [{cauTraLoiId}]
export default function BangMaTran({ cauHoi, laNhieu, traLoi, capNhat }) {
  const dsCot = cauHoi.cauTraLoi || []
  const dsHang = cauHoi.cauHoiCon || []

  function tickHang(hang, cot, dangChon) {
    if (!laNhieu) return capNhat(hang.id, { cauTraLoiId: cot.id })
    const ds = Array.isArray(traLoi[hang.id]) ? traLoi[hang.id] : []
    capNhat(
      hang.id,
      dangChon ? ds.filter((x) => x.cauTraLoiId !== cot.id) : [...ds, { cauTraLoiId: cot.id }]
    )
  }

  return (
    <div className="cuon-ngang">
      <table className="bang-ma-tran">
        <thead>
          <tr>
            <th></th>
            {dsCot.map((cot) => (
              <th key={cot.id}>{cot.noiDung}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dsHang.map((hang) => {
            const giaTriHang = traLoi[hang.id]
            return (
              <tr key={hang.id}>
                <td className="o-hang">{hang.noiDung}</td>
                {dsCot.map((cot) => {
                  const dangChon = laNhieu
                    ? Array.isArray(giaTriHang) &&
                      giaTriHang.some((x) => x.cauTraLoiId === cot.id)
                    : giaTriHang?.cauTraLoiId === cot.id
                  return (
                    <td key={cot.id} className="o-tick">
                      <input
                        type={laNhieu ? 'checkbox' : 'radio'}
                        name={hang.id}
                        checked={dangChon}
                        aria-label={`${hang.noiDung} — ${cot.noiDung}`}
                        onChange={() => tickHang(hang, cot, dangChon)}
                      />
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
