import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { api } from '../api.js'

// Trang cảm ơn sau khi gửi phiếu thành công
export default function HoanThanh() {
  const { id } = useParams()
  const location = useLocation()

  // Ưu tiên state điều hướng từ trang KhaoSat; nếu vào thẳng URL thì fetch để biết
  const [isViewKQ, setIsViewKQ] = useState(
    typeof location.state?.isViewKQ === 'boolean' ? location.state.isViewKQ : null
  )
  const [nen, setNen] = useState(location.state?.background || '')

  useEffect(() => {
    document.title = 'Hoàn thành khảo sát'
    if (typeof location.state?.isViewKQ === 'boolean' && location.state?.background) return
    let huy = false
    api(`/api/v1/khaosats/${id}/public`)
      .then((body) => {
        if (huy) return
        const ks = body?.data
        if (!ks) return
        setIsViewKQ((cu) => (cu === null ? !!ks.isViewKQ : cu))
        setNen((cu) => cu || ks.background || '')
      })
      .catch(() => {
        /* không fetch được thì dùng nền mặc định, ẩn nút xem kết quả */
      })
    return () => {
      huy = true
    }
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="trang" style={{ backgroundColor: nen || 'var(--nen)' }}>
      <div className="khung">
        <div className="the tai-giua">
          <div style={{ fontSize: 64, lineHeight: 1, color: 'var(--ok)' }} aria-hidden="true">
            ✓
          </div>
          <p style={{ fontWeight: 700, fontSize: '1.15rem' }}>
            Trân trọng cảm ơn Ông (bà) đã tham gia khảo sát!
          </p>
          <p className="mo-nhat">Phiếu trả lời của Ông (bà) đã được ghi nhận.</p>
          <div className="hang-nut cach-tren">
            {isViewKQ && (
              <Link className="nut nut-chinh" to={`/khao-sat/${id}/ket-qua`}>
                Xem kết quả khảo sát
              </Link>
            )}
            <Link className="nut" to="/">
              Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
