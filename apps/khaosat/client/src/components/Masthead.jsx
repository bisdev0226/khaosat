import { CO_QUAN } from '../constants.js'

// Emblem cân công lý (Sở Tư pháp) — SVG nội tuyến, không phụ thuộc ảnh ngoài
function Emblem() {
  return (
    <svg className="mh-emblem" viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="23" fill="#fff" stroke="currentColor" strokeWidth="2" />
      <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M24 10v28" />
        <path d="M14 38h20" />
        <path d="M10 16h28" />
        <circle cx="24" cy="12" r="2.2" fill="currentColor" stroke="none" />
        {/* đĩa cân trái */}
        <path d="M10 16l-4 9h8l-4-9z" />
        <path d="M4 25a6 3 0 0 0 12 0" />
        {/* đĩa cân phải */}
        <path d="M38 16l-4 9h8l-4-9z" />
        <path d="M32 25a6 3 0 0 0 12 0" />
      </g>
    </svg>
  )
}

// Masthead cơ quan. Prop `phu` (tùy chọn): khối bên phải (vd "PHIẾU SỐ 02 / Dành cho...").
export default function Masthead({ phu }) {
  return (
    <div className="mh">
      <div className="mh-trai">
        <Emblem />
        <div>
          <div className="mh-coquan">{CO_QUAN.ten}</div>
          <div className="mh-diachi">{CO_QUAN.diaChi}</div>
        </div>
      </div>
      {phu && <div className="mh-phai">{phu}</div>}
    </div>
  )
}
